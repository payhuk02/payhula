import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetryInfo {
  retry_id: string;
  transaction_id: string;
  attempt_number: number;
  max_attempts: number;
  payment_provider: string;
}

/**
 * Edge Function pour retry automatique des transactions échouées
 * À appeler via un cron job (ex: toutes les heures)
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting transaction retry job...');

    // Récupérer les retries à traiter
    const { data: retries, error: retriesError } = await supabase.rpc(
      'get_pending_transaction_retries'
    );

    if (retriesError) {
      console.error('Error fetching pending retries:', retriesError);
      throw retriesError;
    }

    if (!retries || retries.length === 0) {
      console.log('No pending retries to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No retries to process', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${retries.length} retries...`);

    const results = await Promise.allSettled(
      retries.map(async (retry: RetryInfo) => {
        try {
          // Marquer la retry comme en cours de traitement
          await supabase
            .from('transaction_retries')
            .update({
              status: 'processing',
              last_attempt_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', retry.retry_id);

          // Récupérer la transaction
          const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', retry.transaction_id)
            .single();

          if (txError || !transaction) {
            throw new Error(`Transaction not found: ${retry.transaction_id}`);
          }

          // Vérifier le provider et appeler la fonction de vérification appropriée
          let verificationResult: { success: boolean; status?: string; error?: string };

          if (transaction.payment_provider === 'paydunya' && transaction.paydunya_invoice_token) {
            // Vérifier avec PayDunya
            verificationResult = await verifyPayDunyaTransaction(
              supabase,
              transaction.paydunya_invoice_token,
              transaction.id
            );
          } else if (transaction.payment_provider === 'moneroo' && transaction.moneroo_transaction_id) {
            // Vérifier avec Moneroo
            verificationResult = await verifyMonerooTransaction(
              supabase,
              transaction.moneroo_transaction_id,
              transaction.id
            );
          } else {
            throw new Error('Unknown payment provider or missing transaction ID');
          }

          // Mettre à jour le résultat de la retry
          if (verificationResult.success && verificationResult.status === 'completed') {
            // Succès !
            await supabase
              .from('transaction_retries')
              .update({
                status: 'completed',
                last_attempt_result: verificationResult,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', retry.retry_id);

            // Mettre à jour la transaction
            await supabase
              .from('transactions')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                retry_count: retry.attempt_number,
                updated_at: new Date().toISOString(),
              })
              .eq('id', transaction.id);

            console.log(`Transaction ${transaction.id} successfully verified after ${retry.attempt_number} attempts`);
            return { success: true, transaction_id: transaction.id, attempt: retry.attempt_number };
          } else if (verificationResult.success && verificationResult.status === 'failed') {
            // Échec définitif
            await supabase
              .from('transaction_retries')
              .update({
                status: 'failed',
                last_attempt_result: verificationResult,
                error_message: verificationResult.error || 'Transaction failed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', retry.retry_id);

            console.log(`Transaction ${transaction.id} failed after ${retry.attempt_number} attempts`);
            return { success: false, transaction_id: transaction.id, error: verificationResult.error };
          } else {
            // Toujours en attente, planifier le prochain retry
            if (retry.attempt_number < retry.max_attempts) {
              await supabase.rpc('create_or_update_transaction_retry', {
                p_transaction_id: transaction.id,
                p_max_attempts: retry.max_attempts,
                p_strategy: 'exponential',
              });

              console.log(`Transaction ${transaction.id} still pending, scheduled next retry (attempt ${retry.attempt_number + 1})`);
              return { success: true, transaction_id: transaction.id, pending: true, attempt: retry.attempt_number };
            } else {
              // Maximum atteint
              await supabase
                .from('transaction_retries')
                .update({
                  status: 'failed',
                  last_attempt_result: verificationResult,
                  error_message: 'Maximum retry attempts reached',
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', retry.retry_id);

              console.log(`Transaction ${transaction.id} reached maximum retry attempts`);
              return { success: false, transaction_id: transaction.id, error: 'Max attempts reached' };
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error processing retry ${retry.retry_id}:`, errorMessage);

          // Mettre à jour la retry avec l'erreur
          await supabase
            .from('transaction_retries')
            .update({
              status: 'pending', // Remettre en pending pour réessayer
              last_attempt_result: { error: errorMessage },
              error_message: errorMessage,
              updated_at: new Date().toISOString(),
            })
            .eq('id', retry.retry_id);

          return { success: false, retry_id: retry.retry_id, error: errorMessage };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`Retry job completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: retries.length,
        successful,
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Promise rejected' }),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in retry job:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Vérifier une transaction PayDunya
 */
async function verifyPayDunyaTransaction(
  supabase: ReturnType<typeof createClient>,
  paydunyaTransactionId: string,
  transactionId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    // Appeler l'API PayDunya pour vérifier le statut
    const paydunyaMasterKey = Deno.env.get('PAYDUNYA_MASTER_KEY');
    const paydunyaPrivateKey = Deno.env.get('PAYDUNYA_PRIVATE_KEY');
    const paydunyaToken = Deno.env.get('PAYDUNYA_TOKEN');
    const paydunyaApiUrl = Deno.env.get('PAYDUNYA_API_URL') || 'https://app.paydunya.com/api/v1';

    if (!paydunyaMasterKey || !paydunyaPrivateKey || !paydunyaToken) {
      throw new Error('PayDunya credentials not configured');
    }

    const response = await fetch(`${paydunyaApiUrl}/checkout-invoice/confirm/${paydunyaTransactionId}`, {
      method: 'GET',
      headers: {
        'PAYDUNYA-MASTER-KEY': paydunyaMasterKey,
        'PAYDUNYA-PRIVATE-KEY': paydunyaPrivateKey,
        'PAYDUNYA-TOKEN': paydunyaToken,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'PayDunya API error' };
    }

    const status = data.response?.status || data.status;
    const statusMap: Record<string, string> = {
      'completed': 'completed',
      'success': 'completed',
      'paid': 'completed',
      'failed': 'failed',
      'pending': 'processing',
    };

    return {
      success: true,
      status: statusMap[status?.toLowerCase()] || 'processing',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Vérifier une transaction Moneroo
 */
async function verifyMonerooTransaction(
  supabase: ReturnType<typeof createClient>,
  monerooTransactionId: string,
  transactionId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    // Appeler l'API Moneroo via Edge Function
    const monerooApiKey = Deno.env.get('MONEROO_API_KEY');
    const monerooApiUrl = Deno.env.get('MONEROO_API_URL') || 'https://api.moneroo.io/v1';

    if (!monerooApiKey) {
      throw new Error('Moneroo API key not configured');
    }

    const response = await fetch(`${monerooApiUrl}/payments/${monerooTransactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${monerooApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Moneroo API error' };
    }

    const status = data.status;
    const statusMap: Record<string, string> = {
      'completed': 'completed',
      'success': 'completed',
      'failed': 'failed',
      'pending': 'processing',
    };

    return {
      success: true,
      status: statusMap[status?.toLowerCase()] || 'processing',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}


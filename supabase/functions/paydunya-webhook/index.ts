import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' // Remplacer par votre domaine de production
    : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('PayDunya webhook received:', payload);

    // Extract transaction data from PayDunya webhook
    // PayDunya envoie généralement: response.invoice_token, response.status, etc.
    const invoiceToken = payload.response?.invoice_token || payload.invoice_token || payload.token;
    const status = payload.response?.status || payload.status;
    const amount = payload.response?.invoice?.total_amount || payload.amount;
    const currency = payload.response?.invoice?.currency || payload.currency || 'XOF';
    const paymentMethod = payload.response?.receipt?.payment_method || payload.payment_method;
    const customer = payload.response?.customer || payload.customer;
    const metadata = payload.response?.custom_data || payload.metadata || {};

    if (!invoiceToken) {
      console.error('Missing invoice_token in PayDunya webhook payload');
      return new Response(
        JSON.stringify({ error: 'Missing invoice_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find transaction by PayDunya invoice token
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('paydunya_invoice_token', invoiceToken)
      .single();

    if (findError) {
      console.error('Transaction not found:', findError);
      // Ne pas retourner une erreur, car le webhook peut arriver avant la création de la transaction
      return new Response(
        JSON.stringify({ success: true, message: 'Transaction not found, will be processed later' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map PayDunya status to our status
    const statusMap: Record<string, string> = {
      'completed': 'completed',
      'success': 'completed',
      'paid': 'completed',
      'failed': 'failed',
      'pending': 'processing',
      'cancelled': 'cancelled',
      'expired': 'cancelled',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'processing';

    // 🆕 Vérifier l'idempotence (éviter les webhooks dupliqués)
    if (mappedStatus === transaction.status) {
      try {
        const { data: alreadyProcessed } = await supabase.rpc('is_webhook_already_processed', {
          p_transaction_id: transaction.id,
          p_status: mappedStatus,
          p_provider: 'paydunya',
        });

        if (alreadyProcessed) {
          console.log('Webhook already processed, ignoring duplicate');
          return new Response(
            JSON.stringify({ success: true, message: 'Webhook already processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (rpcError) {
        // Si la fonction n'existe pas encore, continuer (pour compatibilité)
        console.warn('is_webhook_already_processed function not available, continuing:', rpcError);
      }
    }

    // 🆕 Valider le montant si amount est fourni
    if (amount && transaction.order_id) {
      try {
        const { data: amountValid } = await supabase.rpc('validate_transaction_amount', {
          p_transaction_id: transaction.id,
          p_amount: amount,
        });

        if (amountValid === false) {
          console.warn('Amount mismatch detected', {
            transaction_id: transaction.id,
            webhook_amount: amount,
            transaction_amount: transaction.amount,
          });
        }
      } catch (rpcError) {
        console.warn('validate_transaction_amount function not available, continuing:', rpcError);
      }
    }

    // Prepare updates
    const updates: Record<string, unknown> = {
      status: mappedStatus,
      paydunya_response: payload,
      updated_at: new Date().toISOString(),
      webhook_processed_at: new Date().toISOString(),
      webhook_attempts: ((transaction.webhook_attempts as number) || 0) + 1,
      last_webhook_payload: payload,
    };

    if (paymentMethod) {
      updates.paydunya_payment_method = paymentMethod;
    }

    if (mappedStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.retry_count = 0; // Reset retry count on success

      // Update associated payment if exists
      if (transaction.payment_id) {
        await supabase
          .from('payments')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.payment_id);
      }

      // Update associated order if exists
      if (transaction.order_id) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id)
          .select('*')
          .single();

        if (orderError) {
          console.error('Error updating order:', orderError);
        } else if (order) {
          // Déclencher webhook order.completed
          await supabase.rpc('trigger_webhook', {
            p_event_type: 'order.completed',
            p_event_id: order.id,
            p_event_data: {
              order: {
                id: order.id,
                store_id: order.store_id,
                customer_id: order.customer_id,
                order_number: order.order_number,
                status: 'confirmed',
                total_amount: order.total_amount,
                currency: order.currency,
                payment_status: 'paid',
                created_at: order.created_at,
              },
            },
            p_store_id: order.store_id,
          }).catch((err) => console.error('Webhook error:', err));

          // Déclencher webhook payment.completed
          if (transaction.payment_id) {
            await supabase.rpc('trigger_webhook', {
              p_event_type: 'payment.completed',
              p_event_id: transaction.payment_id,
              p_event_data: {
                payment: {
                  id: transaction.payment_id,
                  transaction_id: transaction.id,
                  order_id: order.id,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  status: 'completed',
                  payment_method: paymentMethod,
                  provider: 'paydunya',
                },
              },
              p_store_id: order.store_id,
            }).catch((err) => console.error('Payment webhook error:', err));
          }
        }
      }
    } else if (mappedStatus === 'failed') {
      updates.failed_at = new Date().toISOString();
      updates.error_message = payload.response?.error_message || payload.error_message || 'Payment failed';

      // Update payment and order status
      if (transaction.payment_id) {
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.payment_id);
      }

      if (transaction.order_id) {
        await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id);
      }

      // Déclencher webhook payment.failed
      if (transaction.payment_id && transaction.store_id) {
        await supabase.rpc('trigger_webhook', {
          p_event_type: 'payment.failed',
          p_event_id: transaction.payment_id,
          p_event_data: {
            payment: {
              id: transaction.payment_id,
              transaction_id: transaction.id,
              order_id: transaction.order_id,
              amount: transaction.amount,
              currency: transaction.currency,
              status: 'failed',
              error_message: updates.error_message,
              provider: 'paydunya',
            },
          },
          p_store_id: transaction.store_id,
        }).catch((err) => console.error('Payment failed webhook error:', err));
      }
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    // Log webhook event
    await supabase.from('transaction_logs').insert({
      transaction_id: transaction.id,
      event_type: 'webhook_received',
      status: mappedStatus,
      response_data: payload,
      request_data: {
        invoice_token: invoiceToken,
        status,
        amount,
        currency,
      },
    });

    console.log('PayDunya webhook processed successfully:', {
      transaction_id: transaction.id,
      status: mappedStatus,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Error in PayDunya webhook:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


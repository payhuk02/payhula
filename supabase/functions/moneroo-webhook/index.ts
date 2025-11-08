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

/**
 * Calcule la signature HMAC-SHA256 d'un payload
 */
async function calculateHMACSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare deux strings de manière constante dans le temps
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extrait la signature depuis l'en-tête HTTP
 */
function extractSignatureFromHeader(headers: Headers): string | null {
  const signature = headers.get('x-moneroo-signature') || 
                   headers.get('X-Moneroo-Signature') ||
                   headers.get('moneroo-signature');
  
  if (!signature) {
    return null;
  }

  // La signature peut être au format "sha256=signature" ou juste "signature"
  const match = signature.match(/sha256=(.+)/i);
  return match ? match[1] : signature;
}

/**
 * Vérifie la signature d'un webhook Moneroo
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    return false;
  }

  try {
    const calculatedSignature = await calculateHMACSignature(payload, secret);
    return constantTimeEquals(calculatedSignature, signature);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le secret webhook depuis les variables d'environnement
    const webhookSecret = Deno.env.get('MONEROO_WEBHOOK_SECRET');
    
    // Récupérer le payload brut pour la vérification de signature
    const rawPayload = await req.text();
    
    // Vérifier la signature si le secret est configuré
    if (webhookSecret) {
      const signature = extractSignatureFromHeader(req.headers);
      
      if (!signature) {
        console.error('Webhook signature missing');
        return new Response(
          JSON.stringify({ error: 'Webhook signature missing' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyWebhookSignature(rawPayload, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        // Log de sécurité (sans révéler la signature complète)
        await supabase.from('transaction_logs').insert({
          event_type: 'webhook_signature_failed',
          status: 'failed',
          request_data: {
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString(),
          },
          error_data: {
            error: 'Invalid webhook signature',
            signature_preview: signature.substring(0, 20) + '...',
          },
        }).catch(err => console.error('Error logging failed webhook:', err));

        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Webhook signature verified successfully');
    } else {
      console.warn('MONEROO_WEBHOOK_SECRET not configured - webhook signature verification disabled');
    }

    // Parser le payload JSON
    const payload = JSON.parse(rawPayload);
    console.log('Moneroo webhook received:', payload);

    // Extract transaction data from Moneroo webhook
    const { transaction_id, status, amount, currency, metadata } = payload;

    if (!transaction_id) {
      throw new Error('Missing transaction_id in webhook payload');
    }

    // Find transaction by Moneroo transaction ID
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('moneroo_transaction_id', transaction_id)
      .single();

    if (findError) {
      console.error('Transaction not found:', findError);
      throw new Error('Transaction not found');
    }

    // Map Moneroo status to our status
    const statusMap: Record<string, string> = {
      'completed': 'completed',
      'success': 'completed',
      'failed': 'failed',
      'pending': 'processing',
      'cancelled': 'cancelled',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'processing';

    // Update transaction
    const updates: any = {
      status: mappedStatus,
      moneroo_response: payload,
      updated_at: new Date().toISOString(),
    };

    if (mappedStatus === 'completed') {
      updates.completed_at = new Date().toISOString();

      // Update associated payment if exists
      if (transaction.payment_id) {
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            transaction_id: transaction_id,
          })
          .eq('id', transaction.payment_id)
          .select('*, order_id, store_id')
          .single();

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        } else if (payment) {
          // Déclencher webhook payment.completed
          await supabase.rpc('trigger_webhook', {
            p_event_type: 'payment.completed',
            p_event_id: payment.id,
            p_event_data: {
              payment: {
                id: payment.id,
                order_id: payment.order_id,
                transaction_id: transaction_id,
                amount: transaction.amount,
                currency: transaction.currency,
                status: 'completed',
                payment_method: transaction.payment_method || 'moneroo',
                created_at: payment.created_at,
              },
            },
            p_store_id: payment.store_id,
          }).catch((err) => console.error('Webhook error:', err));
        }
      }

      // Update associated order if exists
      let order = null;
      if (transaction.order_id) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', transaction.order_id)
          .select('*')
          .single();

        if (orderError) {
          console.error('Error updating order:', orderError);
        } else {
          order = orderData;
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
        }
      }

      // Créer une notification de paiement réussi
      if (transaction.customer_id) {
        await supabase.from('notifications').insert({
          user_id: transaction.customer_id,
          type: 'payment_completed',
          title: '✅ Paiement réussi !',
          message: `Votre paiement de ${transaction.amount} ${transaction.currency} a été confirmé avec succès.${order?.order_number ? ` Commande #${order.order_number}` : ''}`,
          metadata: {
            transaction_id: transaction.id,
            order_id: transaction.order_id,
            amount: transaction.amount,
            currency: transaction.currency,
            payment_method: transaction.moneroo_payment_method || 'moneroo',
          },
          is_read: false,
        }).catch((err) => console.error('Error creating notification:', err));
      }
    } else if (mappedStatus === 'failed') {
      updates.failed_at = new Date().toISOString();
      updates.error_message = payload.error_message || 'Payment failed';

      // Update payment and order status
      if (transaction.payment_id) {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', transaction.payment_id);
      }

      if (transaction.order_id) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', transaction.order_id);
      }

      // Créer une notification de paiement échoué
      if (transaction.customer_id) {
        await supabase.from('notifications').insert({
          user_id: transaction.customer_id,
          type: 'payment_failed',
          title: '❌ Paiement échoué',
          message: `Votre paiement de ${transaction.amount} ${transaction.currency} a échoué. Veuillez réessayer.`,
          metadata: {
            transaction_id: transaction.id,
            order_id: transaction.order_id,
            amount: transaction.amount,
            currency: transaction.currency,
            error_message: payload.error_message,
          },
          is_read: false,
        }).catch((err) => console.error('Error creating notification:', err));
      }
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    // Log the webhook event
    await supabase.from('transaction_logs').insert({
      transaction_id: transaction.id,
      event_type: 'webhook_received',
      status: mappedStatus,
      response_data: payload,
    });

    console.log('Transaction updated successfully:', transaction.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

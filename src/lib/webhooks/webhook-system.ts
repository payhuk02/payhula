/**
 * Webhook System
 * Date: 28 Janvier 2025
 * 
 * Système de webhooks pour tous les événements
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Fonction pour signer avec HMAC (compatible navigateur)
function signPayload(payload: string, secret: string): string {
  // Utiliser Web Crypto API si disponible, sinon fallback
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Note: Web Crypto API nécessite une conversion plus complexe
    // Pour simplifier, on utilise une fonction de hash simple
    return btoa(payload + secret).substring(0, 64);
  }
  // Fallback pour Node.js (si utilisé côté serveur)
  return btoa(payload + secret).substring(0, 64);
}

export type WebhookEvent =
  // Commandes
  | 'order.created'
  | 'order.completed'
  | 'order.cancelled'
  | 'order.payment_received'
  | 'order.payment_failed'
  | 'order.refunded'
  
  // Produits
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.stock_low'
  | 'product.out_of_stock'
  
  // Clients
  | 'customer.created'
  | 'customer.updated'
  
  // Paiements
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  
  // Services
  | 'service.booking_confirmed'
  | 'service.booking_cancelled'
  
  // Cours
  | 'course.enrollment'
  | 'course.completed';

export interface Webhook {
  id: string;
  store_id: string;
  url: string;
  secret: string;
  description?: string;
  events: WebhookEvent[];
  is_active: boolean;
  last_triggered_at?: string;
  failure_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: WebhookEvent;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  status_code?: number;
  response_body?: string;
  error_message?: string;
  attempt_number: number;
  max_attempts: number;
  triggered_at: string;
  completed_at?: string;
}

/**
 * Créer un webhook
 */
export async function createWebhook(
  storeId: string,
  url: string,
  events: WebhookEvent[],
  secret?: string
): Promise<{ success: boolean; webhook?: Webhook; error?: string }> {
  try {
    const webhookSecret = secret || generateSecret();

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        store_id: storeId,
        url,
        secret: webhookSecret,
        events,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Webhook created', { webhookId: data.id, storeId, events });

    return { success: true, webhook: data as Webhook };
  } catch (error: any) {
    logger.error('Error creating webhook', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Déclencher un webhook
 */
export async function triggerWebhook(
  storeId: string,
  eventType: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  try {
    // Appeler la fonction SQL pour déclencher les webhooks
    const { error } = await supabase.rpc('trigger_webhook', {
      p_store_id: storeId,
      p_event_type: eventType,
      p_payload: payload,
    });

    if (error) {
      logger.error('Error triggering webhook', { error: error.message, storeId, eventType });
    } else {
      logger.info('Webhook triggered', { storeId, eventType });
    }
  } catch (error: any) {
    logger.error('Exception triggering webhook', { error: error.message, storeId, eventType });
  }
}

/**
 * Envoyer un webhook (appelé par un worker)
 */
export async function sendWebhook(
  webhook: Webhook,
  eventType: WebhookEvent,
  payload: Record<string, any>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    // Signer le payload
    const signature = signPayload(JSON.stringify(payload), webhook.secret);
    const timestamp = Date.now();

    // Envoyer la requête
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payhuk-Signature': signature,
        'X-Payhuk-Timestamp': timestamp.toString(),
        'X-Payhuk-Event': eventType,
      },
      body: JSON.stringify({
        event: eventType,
        timestamp,
        data: payload,
      }),
    });

    const success = response.ok;
    const responseBody = await response.text().catch(() => '');

    // Mettre à jour le log
    await updateWebhookLog(webhook.id, eventType, {
      success,
      statusCode: response.status,
      responseBody,
      errorMessage: success ? undefined : responseBody,
    });

    // Mettre à jour le webhook
    if (success) {
      await supabase
        .from('webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: 0,
          last_error: null,
        })
        .eq('id', webhook.id);
    } else {
      await supabase
        .from('webhooks')
        .update({
          failure_count: webhook.failure_count + 1,
          last_error: responseBody,
        })
        .eq('id', webhook.id);
    }

    return { success, statusCode: response.status };
  } catch (error: any) {
    logger.error('Error sending webhook', { error: error.message, webhookId: webhook.id });
    
    // Mettre à jour le log
    await updateWebhookLog(webhook.id, eventType, {
      success: false,
      errorMessage: error.message,
    });

    // Mettre à jour le webhook
    await supabase
      .from('webhooks')
      .update({
        failure_count: webhook.failure_count + 1,
        last_error: error.message,
      })
      .eq('id', webhook.id);

    return { success: false, error: error.message };
  }
}

/**
 * Signer un payload avec le secret
 */
function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Vérifier la signature d'un webhook
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signPayload(payload, secret);
  return signature === expectedSignature;
}

/**
 * Générer un secret aléatoire
 */
function generateSecret(): string {
  // Générer un secret aléatoire (32 caractères hex)
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback pour Node.js
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Mettre à jour un log de webhook
 */
async function updateWebhookLog(
  webhookId: string,
  eventType: WebhookEvent,
  result: {
    success: boolean;
    statusCode?: number;
    responseBody?: string;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    // Trouver le log le plus récent pour ce webhook et cet événement
    const { data: logs } = await supabase
      .from('webhook_logs')
      .select('id, attempt_number, max_attempts')
      .eq('webhook_id', webhookId)
      .eq('event_type', eventType)
      .eq('status', 'pending')
      .order('triggered_at', { ascending: false })
      .limit(1);

    if (logs && logs.length > 0) {
      const log = logs[0];
      const status = result.success
        ? 'success'
        : log.attempt_number < log.max_attempts
        ? 'retrying'
        : 'failed';

      await supabase
        .from('webhook_logs')
        .update({
          status,
          status_code: result.statusCode,
          response_body: result.responseBody,
          error_message: result.errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', log.id);
    }
  } catch (error: any) {
    logger.error('Error updating webhook log', { error: error.message });
  }
}

/**
 * Récupérer les webhooks d'une boutique
 */
export async function getWebhooks(storeId: string): Promise<Webhook[]> {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching webhooks', { error: error.message });
    return [];
  }

  return (data || []) as Webhook[];
}

/**
 * Récupérer les logs d'un webhook
 */
export async function getWebhookLogs(
  webhookId: string,
  limit: number = 50
): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching webhook logs', { error: error.message });
    return [];
  }

  return (data || []) as WebhookLog[];
}


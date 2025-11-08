/**
 * Service de notifications pour les paiements Moneroo
 * Envoie des notifications email, SMS et in-app pour les événements de paiement
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from './logger';

export interface PaymentNotificationData {
  transactionId: string;
  userId?: string;
  customerEmail?: string;
  customerName?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  orderId?: string;
  orderNumber?: string;
  reason?: string;
}

/**
 * Envoie une notification de paiement réussi
 */
export const notifyPaymentSuccess = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // Notification in-app
    if (data.userId) {
      await supabase.from('notifications').insert({
        user_id: data.userId,
        type: 'payment_completed',
        title: '✅ Paiement réussi !',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} a été confirmé avec succès.${data.orderNumber ? ` Commande #${data.orderNumber}` : ''}`,
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          payment_method: data.paymentMethod,
        },
        is_read: false,
      }).catch((err) => {
        logger.warn('Error creating in-app notification:', err);
      });
    }

    // Notification email (via Supabase Edge Function ou service externe)
    if (data.customerEmail) {
      await sendPaymentEmail({
        to: data.customerEmail,
        subject: 'Paiement confirmé - Payhula',
        template: 'payment_success',
        data: {
          customerName: data.customerName || 'Client',
          amount: data.amount,
          currency: data.currency,
          orderNumber: data.orderNumber,
          transactionId: data.transactionId,
        },
      }).catch((err) => {
        logger.warn('Error sending payment success email:', err);
      });
    }

    logger.log('Payment success notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment success notification:', error);
    // Ne pas faire échouer l'opération principale si la notification échoue
  }
};

/**
 * Envoie une notification de paiement échoué
 */
export const notifyPaymentFailed = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // Notification in-app
    if (data.userId) {
      await supabase.from('notifications').insert({
        user_id: data.userId,
        type: 'payment_failed',
        title: '❌ Paiement échoué',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} a échoué.${data.reason ? ` Raison : ${data.reason}` : ' Veuillez réessayer.'}`,
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
        },
        is_read: false,
      }).catch((err) => {
        logger.warn('Error creating in-app notification:', err);
      });
    }

    // Notification email
    if (data.customerEmail) {
      await sendPaymentEmail({
        to: data.customerEmail,
        subject: 'Paiement échoué - Payhula',
        template: 'payment_failed',
        data: {
          customerName: data.customerName || 'Client',
          amount: data.amount,
          currency: data.currency,
          reason: data.reason || 'Erreur inconnue',
          transactionId: data.transactionId,
        },
      }).catch((err) => {
        logger.warn('Error sending payment failed email:', err);
      });
    }

    logger.log('Payment failed notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment failed notification:', error);
  }
};

/**
 * Envoie une notification de paiement annulé
 */
export const notifyPaymentCancelled = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // Notification in-app
    if (data.userId) {
      await supabase.from('notifications').insert({
        user_id: data.userId,
        type: 'payment_cancelled',
        title: '🚫 Paiement annulé',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} a été annulé.${data.reason ? ` Raison : ${data.reason}` : ''}`,
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
        },
        is_read: false,
      }).catch((err) => {
        logger.warn('Error creating in-app notification:', err);
      });
    }

    // Notification email
    if (data.customerEmail) {
      await sendPaymentEmail({
        to: data.customerEmail,
        subject: 'Paiement annulé - Payhula',
        template: 'payment_cancelled',
        data: {
          customerName: data.customerName || 'Client',
          amount: data.amount,
          currency: data.currency,
          reason: data.reason || 'Demande utilisateur',
          transactionId: data.transactionId,
        },
      }).catch((err) => {
        logger.warn('Error sending payment cancelled email:', err);
      });
    }

    logger.log('Payment cancelled notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment cancelled notification:', error);
  }
};

/**
 * Envoie une notification de remboursement
 */
export const notifyPaymentRefunded = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // Notification in-app
    if (data.userId) {
      await supabase.from('notifications').insert({
        user_id: data.userId,
        type: 'payment_refunded',
        title: '💸 Remboursement effectué',
        message: `Un remboursement de ${data.amount.toLocaleString()} ${data.currency} a été effectué.${data.reason ? ` Raison : ${data.reason}` : ''}`,
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          reason: data.reason,
        },
        is_read: false,
      }).catch((err) => {
        logger.warn('Error creating in-app notification:', err);
      });
    }

    // Notification email
    if (data.customerEmail) {
      await sendPaymentEmail({
        to: data.customerEmail,
        subject: 'Remboursement effectué - Payhula',
        template: 'payment_refunded',
        data: {
          customerName: data.customerName || 'Client',
          amount: data.amount,
          currency: data.currency,
          reason: data.reason || 'Demande client',
          transactionId: data.transactionId,
        },
      }).catch((err) => {
        logger.warn('Error sending payment refunded email:', err);
      });
    }

    logger.log('Payment refunded notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
      email: data.customerEmail,
    });
  } catch (error) {
    logger.error('Error sending payment refunded notification:', error);
  }
};

/**
 * Envoie une notification de paiement en attente
 */
export const notifyPaymentPending = async (data: PaymentNotificationData): Promise<void> => {
  try {
    // Notification in-app
    if (data.userId) {
      await supabase.from('notifications').insert({
        user_id: data.userId,
        type: 'payment_pending',
        title: '⏳ Paiement en attente',
        message: `Votre paiement de ${data.amount.toLocaleString()} ${data.currency} est en cours de traitement.`,
        metadata: {
          transaction_id: data.transactionId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
        },
        is_read: false,
      }).catch((err) => {
        logger.warn('Error creating in-app notification:', err);
      });
    }

    logger.log('Payment pending notification sent:', {
      transactionId: data.transactionId,
      userId: data.userId,
    });
  } catch (error) {
    logger.error('Error sending payment pending notification:', error);
  }
};

/**
 * Helper pour envoyer des emails de paiement
 * Utilise Supabase Edge Function ou service externe (Resend, SendGrid, etc.)
 */
async function sendPaymentEmail(params: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}): Promise<void> {
  // TODO: Implémenter l'envoi d'email via Supabase Edge Function ou service externe
  // Pour l'instant, on log juste l'intention
  logger.log('Email notification (not implemented yet):', {
    to: params.to,
    subject: params.subject,
    template: params.template,
  });

  // Exemple d'implémentation future avec Supabase Edge Function
  // await supabase.functions.invoke('send-email', {
  //   body: {
  //     to: params.to,
  //     subject: params.subject,
  //     template: params.template,
  //     data: params.data,
  //   },
  // });
}

/**
 * Helper pour envoyer des SMS (optionnel)
 */
export async function sendPaymentSMS(params: {
  to: string;
  message: string;
}): Promise<void> {
  // TODO: Implémenter l'envoi de SMS via service externe (Twilio, etc.)
  logger.log('SMS notification (not implemented yet):', {
    to: params.to,
    message: params.message,
  });
}


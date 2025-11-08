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

    // Notification SMS (optionnel, si numéro de téléphone disponible)
    if (data.customerPhone) {
      await sendPaymentSuccessSMS(data).catch((err) => {
        logger.warn('Error sending payment success SMS:', err);
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

    // Notification SMS (optionnel)
    if (data.customerPhone) {
      await sendPaymentFailedSMS(data).catch((err) => {
        logger.warn('Error sending payment failed SMS:', err);
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

    // Notification SMS (optionnel)
    if (data.customerPhone) {
      await sendPaymentCancelledSMS(data).catch((err) => {
        logger.warn('Error sending payment cancelled SMS:', err);
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

    // Notification SMS (optionnel)
    if (data.customerPhone) {
      await sendPaymentRefundedSMS(data).catch((err) => {
        logger.warn('Error sending payment refunded SMS:', err);
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
 * Utilise Supabase Edge Function (send-email) avec Resend API
 */
async function sendPaymentEmail(params: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.to,
        subject: params.subject,
        template: params.template,
        data: params.data,
      },
    });

    if (error) {
      logger.error('Error invoking send-email function:', error);
      throw error;
    }

    logger.log('Email sent successfully:', {
      to: params.to,
      subject: params.subject,
      template: params.template,
      messageId: data?.messageId,
    });
  } catch (error: any) {
    logger.error('Error sending payment email:', {
      error: error.message,
      to: params.to,
      template: params.template,
    });
    // Ne pas faire échouer l'opération principale si l'email échoue
  }
}

/**
 * Helper pour envoyer des SMS (optionnel)
 * Utilise Supabase Edge Function (send-sms) avec Twilio API
 */
export async function sendPaymentSMS(params: {
  to: string;
  template: string;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: params.to,
        template: params.template,
        data: params.data,
      },
    });

    if (error) {
      logger.error('Error invoking send-sms function:', error);
      throw error;
    }

    logger.log('SMS sent successfully:', {
      to: params.to,
      template: params.template,
      messageId: data?.messageId,
    });
  } catch (error: any) {
    logger.error('Error sending payment SMS:', {
      error: error.message,
      to: params.to,
      template: params.template,
    });
    // Ne pas faire échouer l'opération principale si le SMS échoue
  }
}

/**
 * Envoie une notification SMS pour un paiement réussi
 */
export const sendPaymentSuccessSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_success',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      orderNumber: data.orderNumber,
      transactionId: data.transactionId,
    },
  });
};

/**
 * Envoie une notification SMS pour un paiement échoué
 */
export const sendPaymentFailedSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_failed',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      transactionId: data.transactionId,
    },
  });
};

/**
 * Envoie une notification SMS pour un paiement annulé
 */
export const sendPaymentCancelledSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_cancelled',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      transactionId: data.transactionId,
    },
  });
};

/**
 * Envoie une notification SMS pour un remboursement
 */
export const sendPaymentRefundedSMS = async (data: PaymentNotificationData): Promise<void> => {
  if (!data.customerPhone) {
    return;
  }

  await sendPaymentSMS({
    to: data.customerPhone,
    template: 'payment_refunded',
    data: {
      customerName: data.customerName,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      transactionId: data.transactionId,
    },
  });
};


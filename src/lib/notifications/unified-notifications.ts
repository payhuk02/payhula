/**
 * Unified Notifications System for All Product Types
 * Date: 28 Janvier 2025
 * 
 * Système de notifications unifié pour tous les types de produits
 * (Digital, Physical, Service, Course, Artist)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type NotificationType =
  // Produits digitaux
  | 'digital_product_purchased'
  | 'digital_product_download_ready'
  | 'digital_product_version_update'
  | 'digital_product_license_expiring'
  | 'digital_product_license_expired'
  
  // Produits physiques
  | 'physical_product_order_placed'
  | 'physical_product_order_confirmed'
  | 'physical_product_order_shipped'
  | 'physical_product_order_delivered'
  | 'physical_product_order_cancelled'
  | 'physical_product_low_stock'
  | 'physical_product_out_of_stock'
  | 'physical_product_back_in_stock'
  
  // Services
  | 'service_booking_confirmed'
  | 'service_booking_reminder'
  | 'service_booking_cancelled'
  | 'service_booking_completed'
  | 'service_payment_required'
  
  // Cours
  | 'course_enrollment'
  | 'course_lesson_complete'
  | 'course_complete'
  | 'course_certificate_ready'
  | 'course_new_content'
  | 'course_quiz_passed'
  | 'course_quiz_failed'
  
  // Artistes
  | 'artist_product_purchased'
  | 'artist_product_certificate_ready'
  | 'artist_product_edition_sold_out'
  | 'artist_product_shipping_update'
  
  // Général
  | 'order_payment_received'
  | 'order_payment_failed'
  | 'order_refund_processed'
  | 'affiliate_commission_earned'
  | 'affiliate_commission_paid'
  | 'product_review_received'
  | 'system_announcement';

export interface UnifiedNotification {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  action_url?: string;
  action_label?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: ('in_app' | 'email' | 'sms' | 'push')[];
  product_type?: 'digital' | 'physical' | 'service' | 'course' | 'artist';
  product_id?: string;
  order_id?: string;
}

export interface NotificationPreferences {
  user_id: string;
  // Par type de notification
  preferences: Record<NotificationType, {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  }>;
  // Par type de produit
  product_type_preferences?: Record<string, {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  }>;
}

/**
 * Envoyer une notification unifiée
 */
export async function sendUnifiedNotification(
  notification: UnifiedNotification
): Promise<{ success: boolean; error?: string; notification_id?: string }> {
  try {
    // 1. Vérifier les préférences utilisateur
    const preferences = await getUserNotificationPreferences(notification.user_id);
    
    // 2. Créer la notification in-app (si activée)
    let notificationId: string | undefined;
    
    if (shouldSendNotification(notification, preferences, 'in_app')) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata || {},
          action_url: notification.action_url,
          action_label: notification.action_label,
          priority: notification.priority || 'medium',
          is_read: false,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Error creating in-app notification', { error, notification });
        return { success: false, error: error.message };
      }

      notificationId = data.id;
      logger.info('In-app notification created', { notificationId, type: notification.type });
    }

    // 3. Envoyer email (si activé)
    if (shouldSendNotification(notification, preferences, 'email')) {
      await sendEmailNotification(notification).catch((err) => {
        logger.warn('Error sending email notification', { error: err, notification });
      });
    }

    // 4. Envoyer SMS (si activé)
    if (shouldSendNotification(notification, preferences, 'sms')) {
      await sendSMSNotification(notification).catch((err) => {
        logger.warn('Error sending SMS notification', { error: err, notification });
      });
    }

    // 5. Envoyer push (si activé)
    if (shouldSendNotification(notification, preferences, 'push')) {
      await sendPushNotification(notification).catch((err) => {
        logger.warn('Error sending push notification', { error: err, notification });
      });
    }

    return { success: true, notification_id: notificationId };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending unified notification', { error: errorMessage, notification });
    return { success: false, error: errorMessage };
  }
}

/**
 * Vérifier si une notification doit être envoyée sur un canal
 */
function shouldSendNotification(
  notification: UnifiedNotification,
  preferences: NotificationPreferences | null,
  channel: 'in_app' | 'email' | 'sms' | 'push'
): boolean {
  if (!preferences) {
    // Par défaut, activer in_app et email
    return channel === 'in_app' || channel === 'email';
  }

  const typePrefs = preferences.preferences[notification.type];
  if (!typePrefs) {
    return channel === 'in_app' || channel === 'email';
  }

  return typePrefs[channel] ?? (channel === 'in_app' || channel === 'email');
}

/**
 * Récupérer les préférences de notifications d'un utilisateur
 */
async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Convertir les préférences de la BDD en format unifié
    type ChannelPrefs = { in_app: boolean; email: boolean; sms: boolean; push: boolean };
    const preferences: Partial<Record<NotificationType, ChannelPrefs>> = {};

    // Mapper les préférences existantes
    const dataRecord = data as Record<string, unknown>;
    Object.keys(dataRecord).forEach((key) => {
      if (key.startsWith('email_') || key.startsWith('app_')) {
        const type = mapPreferenceKeyToNotificationType(key);
        if (type) {
          if (!preferences[type]) {
            preferences[type] = { in_app: false, email: false, sms: false, push: false };
          }
          if (key.startsWith('email_')) {
            preferences[type]!.email = (dataRecord[key] as boolean) ?? true;
          } else if (key.startsWith('app_')) {
            preferences[type]!.in_app = (dataRecord[key] as boolean) ?? true;
          }
        }
      }
    });

    return {
      user_id: userId,
      preferences: preferences as Record<NotificationType, ChannelPrefs>,
    };
  } catch (error) {
    logger.error('Error fetching notification preferences', { error, userId });
    return null;
  }
}

/**
 * Mapper une clé de préférence vers un type de notification
 */
function mapPreferenceKeyToNotificationType(key: string): NotificationType | null {
  const mapping: Record<string, NotificationType> = {
    'email_course_enrollment': 'course_enrollment',
    'email_course_complete': 'course_complete',
    'email_certificate_ready': 'course_certificate_ready',
    'email_new_course': 'course_new_content',
    'email_affiliate_sale': 'affiliate_commission_earned',
    // Ajouter plus de mappings selon les besoins
  };

  const baseKey = key.replace(/^(email_|app_)/, '');
  return mapping[baseKey] || null;
}

/**
 * Envoyer une notification email
 */
async function sendEmailNotification(
  notification: UnifiedNotification
): Promise<void> {
  try {
    // Récupérer l'email de l'utilisateur
    const { data: user } = await supabase.auth.admin.getUserById(notification.user_id);
    if (!user?.user?.email) {
      logger.warn('User email not found for email notification', { userId: notification.user_id });
      return;
    }

    // Déterminer le template selon le type
    const template = getEmailTemplate(notification.type);

    // Appeler la fonction Supabase Edge Function pour envoyer l'email
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: user.user.email,
        subject: notification.title,
        template: template,
        data: {
          title: notification.title,
          message: notification.message,
          action_url: notification.action_url,
          action_label: notification.action_label,
          ...notification.metadata,
        },
      },
    });

    if (error) {
      throw error;
    }

    logger.info('Email notification sent', { userId: notification.user_id, type: notification.type });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending email notification', { error: errorMessage, notification });
    throw error;
  }
}

/**
 * Envoyer une notification SMS
 */
async function sendSMSNotification(
  notification: UnifiedNotification
): Promise<void> {
  try {
    // Récupérer le numéro de téléphone de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', notification.user_id)
      .single();

    if (!profile?.phone) {
      logger.warn('User phone not found for SMS notification', { userId: notification.user_id });
      return;
    }

    // Appeler la fonction Supabase Edge Function pour envoyer le SMS
    const { error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: profile.phone,
        message: `${notification.title}: ${notification.message}`,
      },
    });

    if (error) {
      throw error;
    }

    logger.info('SMS notification sent', { userId: notification.user_id, type: notification.type });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending SMS notification', { error: errorMessage, notification });
    throw error;
  }
}

/**
 * Envoyer une notification push
 */
async function sendPushNotification(
  notification: UnifiedNotification
): Promise<void> {
  try {
    // Récupérer les tokens push de l'utilisateur
    const { data: pushTokens } = await supabase
      .from('user_push_tokens')
      .select('token, platform')
      .eq('user_id', notification.user_id)
      .eq('is_active', true);

    if (!pushTokens || pushTokens.length === 0) {
      logger.warn('No push tokens found for user', { userId: notification.user_id });
      return;
    }

    // Envoyer à chaque token
    for (const tokenData of pushTokens) {
      await supabase.functions.invoke('send-push', {
        body: {
          token: tokenData.token,
          platform: tokenData.platform,
          title: notification.title,
          body: notification.message,
          data: notification.metadata,
        },
      });
    }

    logger.info('Push notification sent', { userId: notification.user_id, type: notification.type });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending push notification', { error: errorMessage, notification });
    throw error;
  }
}

/**
 * Obtenir le template email selon le type de notification
 */
function getEmailTemplate(type: NotificationType): string {
  const templates: Record<NotificationType, string> = {
    // Digital
    'digital_product_purchased': 'digital-product-purchased',
    'digital_product_download_ready': 'digital-download-ready',
    'digital_product_version_update': 'digital-version-update',
    'digital_product_license_expiring': 'license-expiring',
    'digital_product_license_expired': 'license-expired',
    
    // Physical
    'physical_product_order_placed': 'order-placed',
    'physical_product_order_confirmed': 'order-confirmed',
    'physical_product_order_shipped': 'order-shipped',
    'physical_product_order_delivered': 'order-delivered',
    'physical_product_order_cancelled': 'order-cancelled',
    'physical_product_low_stock': 'low-stock',
    'physical_product_out_of_stock': 'out-of-stock',
    'physical_product_back_in_stock': 'back-in-stock',
    
    // Service
    'service_booking_confirmed': 'booking-confirmed',
    'service_booking_reminder': 'booking-reminder',
    'service_booking_cancelled': 'booking-cancelled',
    'service_booking_completed': 'booking-completed',
    'service_payment_required': 'payment-required',
    
    // Course
    'course_enrollment': 'course-enrollment',
    'course_lesson_complete': 'lesson-complete',
    'course_complete': 'course-complete',
    'course_certificate_ready': 'certificate-ready',
    'course_new_content': 'new-content',
    'course_quiz_passed': 'quiz-passed',
    'course_quiz_failed': 'quiz-failed',
    
    // Artist
    'artist_product_purchased': 'artist-product-purchased',
    'artist_product_certificate_ready': 'certificate-ready',
    'artist_product_edition_sold_out': 'edition-sold-out',
    'artist_product_shipping_update': 'shipping-update',
    
    // General
    'order_payment_received': 'payment-received',
    'order_payment_failed': 'payment-failed',
    'order_refund_processed': 'refund-processed',
    'affiliate_commission_earned': 'commission-earned',
    'affiliate_commission_paid': 'commission-paid',
    'product_review_received': 'review-received',
    'system_announcement': 'system-announcement',
  };

  return templates[type] || 'default';
}

/**
 * Helpers spécifiques par type de produit
 */

// Produits digitaux
export async function notifyDigitalProductUpdate(
  userId: string,
  productId: string,
  productName: string,
  version: string,
  downloadUrl: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'digital_product_version_update',
    title: '🔄 Nouvelle version disponible',
    message: `Une nouvelle version (${version}) de "${productName}" est disponible.`,
    metadata: {
      product_id: productId,
      product_name: productName,
      version,
      download_url: downloadUrl,
    },
    action_url: `/digital/${productId}`,
    action_label: 'Télécharger',
    product_type: 'digital',
    product_id: productId,
    priority: 'high',
  });
}

// Produits physiques
export async function notifyPhysicalProductOrderShipped(
  userId: string,
  orderId: string,
  orderNumber: string,
  trackingNumber: string,
  carrierName: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'physical_product_order_shipped',
    title: '📦 Commande expédiée',
    message: `Votre commande #${orderNumber} a été expédiée. Numéro de suivi: ${trackingNumber}`,
    metadata: {
      order_id: orderId,
      order_number: orderNumber,
      tracking_number: trackingNumber,
      carrier_name: carrierName,
    },
    action_url: `/orders/${orderId}`,
    action_label: 'Suivre la commande',
    product_type: 'physical',
    order_id: orderId,
    priority: 'high',
  });
}

// Services
export async function notifyServiceBookingReminder(
  userId: string,
  bookingId: string,
  serviceName: string,
  bookingDate: string,
  bookingTime: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'service_booking_reminder',
    title: '⏰ Rappel de réservation',
    message: `Votre réservation pour "${serviceName}" est prévue le ${bookingDate} à ${bookingTime}.`,
    metadata: {
      booking_id: bookingId,
      service_name: serviceName,
      booking_date: bookingDate,
      booking_time: bookingTime,
    },
    action_url: `/bookings/${bookingId}`,
    action_label: 'Voir la réservation',
    product_type: 'service',
    priority: 'medium',
  });
}

// Cours
export async function notifyCourseNewContent(
  userId: string,
  courseId: string,
  courseName: string,
  lessonTitle: string
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'course_new_content',
    title: '📚 Nouveau contenu disponible',
    message: `Une nouvelle leçon "${lessonTitle}" a été ajoutée au cours "${courseName}".`,
    metadata: {
      course_id: courseId,
      course_name: courseName,
      lesson_title: lessonTitle,
    },
    action_url: `/courses/${courseId}`,
    action_label: 'Voir le cours',
    product_type: 'course',
    product_id: courseId,
    priority: 'medium',
  });
}

// Artistes
export async function notifyArtistProductEditionSoldOut(
  userId: string,
  productId: string,
  artworkTitle: string,
  editionNumber: number,
  totalEditions: number
): Promise<void> {
  await sendUnifiedNotification({
    user_id: userId,
    type: 'artist_product_edition_sold_out',
    title: '🎨 Édition complète',
    message: `L'édition ${editionNumber}/${totalEditions} de "${artworkTitle}" est maintenant complète.`,
    metadata: {
      product_id: productId,
      artwork_title: artworkTitle,
      edition_number: editionNumber,
      total_editions: totalEditions,
    },
    action_url: `/artist/${productId}`,
    action_label: 'Voir l\'œuvre',
    product_type: 'artist',
    product_id: productId,
    priority: 'low',
  });
}


/**
 * Utilitaires PWA
 * Gestion du Service Worker, notifications push, mode offline
 */

/**
 * Enregistrer le Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('[PWA] Service Worker registered:', registration.scope);
      
      // Vérifier les mises à jour
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              console.log('[PWA] New version available');
              notifyNewVersion();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Notifier l'utilisateur d'une nouvelle version
 */
function notifyNewVersion() {
  if (window.confirm('Une nouvelle version de l\'application est disponible. Recharger maintenant ?')) {
    window.location.reload();
  }
}

/**
 * Forcer la mise à jour du Service Worker
 */
export async function updateServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('[PWA] Service Worker updated');
    }
  }
}

/**
 * Désinscrire le Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('[PWA] Service Worker unregistered:', success);
      return success;
    }
  }
  return false;
}

/**
 * Vider le cache
 */
export async function clearCache(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    console.log('[PWA] Cache cleared');
  }
}

/**
 * Demander la permission pour les notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  }
  
  return Notification.permission;
}

/**
 * S'abonner aux notifications push
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });
    
    console.log('[PWA] Push subscription:', subscription);
    
    // Envoyer la subscription au serveur
    await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('[PWA] Error subscribing to push:', error);
    return null;
  }
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PWA] Unsubscribed from push');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PWA] Error unsubscribing from push:', error);
    return false;
  }
}

/**
 * Envoyer l'abonnement au serveur
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    // TODO: Implémenter l'envoi au backend
    console.log('[PWA] Sending subscription to server:', subscription);
    
    // Exemple:
    // await fetch('/api/push/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription),
    // });
  } catch (error) {
    console.error('[PWA] Error sending subscription:', error);
  }
}

/**
 * Afficher une notification locale
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return;
  }
  
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      ...options,
    });
  }
}

/**
 * Vérifier si l'utilisateur est en ligne
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Écouter les changements de connexion
 */
export function watchNetworkStatus(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Retourner une fonction de nettoyage
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Enregistrer une tâche pour le background sync
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
    }
  } catch (error) {
    console.error('[PWA] Error registering background sync:', error);
  }
}

/**
 * Envoyer un message au Service Worker
 */
export function sendMessageToSW(message: any): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Convertir une clé VAPID base64 en Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Vérifier si l'app est installée (PWA)
 */
export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Détecter si l'installation est possible
 */
export function canInstallApp(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}


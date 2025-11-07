import * as Sentry from '@sentry/react';
import { logger } from './logger';

/**
 * Configuration de Sentry pour le monitoring d'erreurs
 */
export const initSentry = () => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  const ENV = import.meta.env.MODE;
  
  // Ne pas initialiser Sentry en développement si pas de DSN configuré
  if (!SENTRY_DSN) {
    logger.warn('Sentry DSN non configuré. Error tracking désactivé.', {
      environment: ENV,
    });
    return;
  }

  // Valider le format du DSN
  try {
    // Vérifier que le DSN est valide (format: https://xxx@xxx.ingest.sentry.io/xxx ou https://xxx.ingest.de.sentry.io/xxx)
    // Le DSN peut avoir deux formats :
    // 1. https://xxx@xxx.ingest.sentry.io/xxx (format classique)
    // 2. https://xxx.ingest.de.sentry.io/xxx (format nouveau sans @)
    const dsnPattern = /^https:\/\/([a-f0-9]+@)?[a-z0-9-]+\.ingest\.(sentry\.io|de\.sentry\.io)\/[0-9]+$/;
    if (!SENTRY_DSN.match(dsnPattern)) {
      logger.error('Invalid Sentry Dsn:', SENTRY_DSN);
      return;
    }
  } catch (error) {
    logger.error('Erreur lors de la validation du DSN Sentry:', error);
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    integrations: [
      Sentry.browserTracingIntegration({
        // Trace les navigations
        enableInp: true, // Interaction to Next Paint
        enableLongTask: true, // Long tasks
        enableWebVitalsInstrumentation: true, // Web Vitals
      }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        // Capturer les sessions avec erreurs
        sessionSampleRate: ENV === 'production' ? 0.1 : 1.0,
        errorSampleRate: 1.0,
      }),
      // Note: React Router integration sera ajoutée si nécessaire
      // Sentry.reactRouterV6BrowserTracingIntegration n'est pas disponible dans cette version
    ],
    
    // Performance Monitoring - APM amélioré
    tracesSampleRate: ENV === 'production' ? 0.2 : 1.0, // Augmenté pour plus de données
    profilesSampleRate: ENV === 'production' ? 0.1 : 1.0, // Profiling pour identifier les bottlenecks
    
    // Session Replay
    replaysSessionSampleRate: ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    // Options avancées
    beforeSend(event, hint) {
      // Filtrer certains types d'erreurs en production
      if (ENV === 'production') {
        // Ignorer les erreurs réseau mineures
        if (event.exception?.values?.[0]?.type === 'NetworkError' && 
            event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
          return null;
        }
        
        // Ignorer les erreurs de script cross-origin
        if (event.exception?.values?.[0]?.value?.includes('Script error')) {
          return null;
        }
      }
      
      // Ajouter des tags automatiques
      if (event.tags) {
        event.tags.environment = ENV;
        event.tags.platform = 'web';
      } else {
        event.tags = {
          environment: ENV,
          platform: 'web',
        };
      }
      
      return event;
    },
    
    // Ignorer certaines erreurs
    ignoreErrors: [
      // Erreurs du navigateur
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Erreurs d'extensions de navigateur
      'chrome-extension://',
      'moz-extension://',
      // Erreurs de réseau courantes
      'Network request failed',
      'Failed to fetch',
    ],
    
    // Options de release
    release: import.meta.env.VITE_APP_VERSION || undefined,
    
    // Options de transport
    transportOptions: {
      // Timeout pour les requêtes
      timeout: 5000,
    },
  });
  
  logger.info('Sentry initialisé avec succès', {
    environment: ENV,
    tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
  });
};

/**
 * Capture une erreur manuellement
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
};

/**
 * Définir l'utilisateur courant pour Sentry
 */
export const setSentryUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

/**
 * Effacer l'utilisateur Sentry (lors de la déconnexion)
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * Ajouter une trace (breadcrumb)
 */
export const addBreadcrumb = (message: string, category?: string, level?: Sentry.SeverityLevel) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * Mesurer la performance d'une fonction
 */
export const measurePerformance = async <T,>(
  name: string,
  fn: () => Promise<T> | T,
  tags?: Record<string, string>
): Promise<T> => {
  return await Sentry.startSpan(
    {
      name,
      op: 'function',
      attributes: tags,
    },
    async (span) => {
      try {
        const result = await fn();
        span?.setStatus({ code: 1 }); // OK status
        return result;
      } catch (error) {
        span?.setStatus({ code: 2 }); // ERROR status
        Sentry.captureException(error);
        throw error;
      }
    }
  );
};

/**
 * Capturer un message (non-error)
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureMessage(message, level);
};

/**
 * Créer un span pour tracer une opération
 * Note: Dans Sentry v8+, utiliser directement startSpan au lieu de createSpan
 */
export const createSpan = (
  operation: string,
  description?: string
): any => {
  // Dans Sentry v8+, startSpan doit être utilisé directement
  // Cette fonction est conservée pour compatibilité mais deprecated
  logger.warn('createSpan is deprecated, use Sentry.startSpan directly', {
    operation,
    description,
  });
  return {
    setStatus: () => {},
    finish: () => {},
  };
};

/**
 * Helper pour wrapper des opérations async avec error tracking
 */
export const withSentry = async <T,>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  return await Sentry.startSpan(
    {
      name: operation,
      op: 'function',
    },
    async (span) => {
      try {
        const result = await fn();
        span?.setStatus({ code: 1 }); // OK status
        return result;
      } catch (error) {
        span?.setStatus({ code: 2 }); // ERROR status
        captureError(error as Error, context);
        throw error;
      }
    }
  );
};


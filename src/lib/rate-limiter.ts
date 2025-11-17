/**
 * Client-side Rate Limiter - Version Renforcée
 * Wrapper pour appeler l'Edge Function de rate limiting avec cache local
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import * as Sentry from '@sentry/react';

export type RateLimitEndpoint = 'default' | 'auth' | 'api' | 'webhook' | 'payment' | 'upload' | 'search';

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
  error?: string;
  message?: string;
}

interface RateLimitCache {
  [key: string]: {
    response: RateLimitResponse;
    timestamp: number;
  };
}

// Cache local pour éviter les appels répétés
const rateLimitCache: RateLimitCache = {};
const CACHE_TTL = 1000; // 1 seconde de cache

/**
 * Nettoie le cache expiré
 */
const cleanCache = (): void => {
  const now = Date.now();
  Object.keys(rateLimitCache).forEach(key => {
    if (now - rateLimitCache[key].timestamp > CACHE_TTL) {
      delete rateLimitCache[key];
    }
  });
};

/**
 * Nettoie complètement le cache (utilisé uniquement pour les tests)
 * @internal
 */
export function clearRateLimitCache(): void {
  Object.keys(rateLimitCache).forEach(key => {
    delete rateLimitCache[key];
  });
}

/**
 * Génère une clé de cache pour un endpoint
 */
const getCacheKey = (endpoint: RateLimitEndpoint, userId?: string): string => {
  return `${endpoint}:${userId || 'anonymous'}`;
};

/**
 * Vérifie si la requête est autorisée par le rate limiter
 * @param endpoint - Type d'endpoint (auth, api, webhook, default, payment, upload, search)
 * @param userId - ID de l'utilisateur (optionnel)
 * @param bypassCache - Forcer un appel serveur (par défaut: false)
 * @returns Promise avec le résultat du rate limiting
 */
export async function checkRateLimit(
  endpoint: RateLimitEndpoint = 'default',
  userId?: string,
  bypassCache: boolean = false
): Promise<RateLimitResponse> {
  // Nettoyer le cache périodiquement
  cleanCache();

  const cacheKey = getCacheKey(endpoint, userId);

  // Vérifier le cache si disponible
  if (!bypassCache && rateLimitCache[cacheKey]) {
    const cached = rateLimitCache[cacheKey];
    const now = Date.now();
    
    // Si le cache est encore valide, retourner la réponse mise en cache
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.response;
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: { 
        endpoint,
        userId,
        timestamp: Date.now(),
      }
    });

    if (error) {
      logger.error('[RateLimiter] Error:', error);
      
      // Envoyer à Sentry pour monitoring
      Sentry.captureException(error, {
        tags: {
          component: 'rate-limiter',
          endpoint,
        },
        extra: {
          userId,
        },
      });

      // En cas d'erreur, autoriser par défaut (fail open) mais avec limite réduite
      const fallbackResponse: RateLimitResponse = {
        allowed: true,
        remaining: 10, // Limite réduite en cas d'erreur
        limit: 10,
        resetAt: new Date(Date.now() + 60000).toISOString()
      };
      
      // Mettre en cache la réponse de fallback
      rateLimitCache[cacheKey] = {
        response: fallbackResponse,
        timestamp: Date.now(),
      };
      
      return fallbackResponse;
    }

    const response: RateLimitResponse = {
      ...data,
      limit: data.limit || 100,
    };

    // Mettre en cache la réponse
    rateLimitCache[cacheKey] = {
      response,
      timestamp: Date.now(),
    };

    // Logger les violations de rate limit
    if (!response.allowed) {
      logger.warn('[RateLimiter] Rate limit exceeded:', {
        endpoint,
        userId,
        remaining: response.remaining,
        resetAt: response.resetAt,
      });

      // Envoyer à Sentry pour monitoring
      Sentry.captureMessage('Rate limit exceeded', {
        level: 'warning',
        tags: {
          component: 'rate-limiter',
          endpoint,
        },
        extra: {
          userId,
          remaining: response.remaining,
          resetAt: response.resetAt,
        },
      });
    }

    return response;
  } catch (error: any) {
    logger.error('[RateLimiter] Exception:', error);
    
    // Envoyer à Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'rate-limiter',
        endpoint,
      },
      extra: {
        userId,
      },
    });

    // En cas d'exception, autoriser par défaut mais avec limite réduite
    const fallbackResponse: RateLimitResponse = {
      allowed: true,
      remaining: 10,
      limit: 10,
      resetAt: new Date(Date.now() + 60000).toISOString()
    };
    
    rateLimitCache[cacheKey] = {
      response: fallbackResponse,
      timestamp: Date.now(),
    };
    
    return fallbackResponse;
  }
}

/**
 * Hook React pour le rate limiting avec état
 */
export function useRateLimit(endpoint: RateLimitEndpoint = 'default') {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<RateLimitResponse | null>(null);

  const check = async (userId?: string, bypassCache: boolean = false) => {
    setIsChecking(true);
    try {
      const result = await checkRateLimit(endpoint, userId, bypassCache);
      setLastResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  return { 
    check, 
    isChecking, 
    lastResult,
    isAllowed: lastResult?.allowed ?? true,
    remaining: lastResult?.remaining ?? 100,
  };
}

/**
 * Middleware rate limiting pour protéger les actions sensibles
 * Version améliorée avec retry et backoff
 */
export async function withRateLimit<T>(
  endpoint: RateLimitEndpoint,
  action: () => Promise<T>,
  options?: {
    userId?: string;
    retry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  }
): Promise<T> {
  const {
    userId,
    retry = false,
    maxRetries = 3,
    retryDelay = 1000,
  } = options || {};

  let attempts = 0;

  while (attempts < maxRetries) {
    const result = await checkRateLimit(endpoint, userId, attempts > 0);

    if (!result.allowed) {
      if (retry && attempts < maxRetries - 1) {
        attempts++;
        const delay = retryDelay * Math.pow(2, attempts - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const error = new Error(result.message || 'Rate limit exceeded. Please try again later.');
      (error as any).rateLimitInfo = {
        remaining: result.remaining,
        resetAt: result.resetAt,
        limit: result.limit,
      };
      throw error;
    }

    // Si autorisé, exécuter l'action
    return await action();
  }

  throw new Error('Max retries exceeded for rate limit check');
}

/**
 * Décorateur pour protéger automatiquement les fonctions avec rate limiting
 */
export function rateLimited(
  endpoint: RateLimitEndpoint,
  options?: {
    userId?: () => string | undefined;
    retry?: boolean;
  }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const userId = options?.userId?.call(this);
      
      return withRateLimit(
        endpoint,
        () => originalMethod.apply(this, args),
        {
          userId,
          retry: options?.retry,
        }
      );
    };

    return descriptor;
  };
}


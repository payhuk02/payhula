/**
 * Tests unitaires pour le rate limiter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, useRateLimit, withRateLimit } from '../rate-limiter';
import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';

// Mock des dépendances
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Fonction pour nettoyer le cache (exposée pour les tests)
// Note: En production, le cache est privé, mais pour les tests on peut utiliser un délai
const waitForCacheExpiry = () => new Promise(resolve => setTimeout(resolve, 1100));

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('devrait retourner allowed: true quand la limite n\'est pas dépassée', async () => {
      const mockResponse = {
        allowed: true,
        remaining: 95,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await checkRateLimit('default');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(95);
      expect(result.limit).toBe(100);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('rate-limiter', {
        body: {
          endpoint: 'default',
          userId: undefined,
          timestamp: expect.any(Number),
        },
      });
    });

    it('devrait retourner allowed: false quand la limite est dépassée', async () => {
      const mockResponse = {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
        message: 'Rate limit exceeded',
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await checkRateLimit('auth');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('rate-limiter', {
        body: {
          endpoint: 'auth',
          userId: undefined,
          timestamp: expect.any(Number),
        },
      });
    });

    it('devrait utiliser le cache pour éviter les appels répétés', async () => {
      const mockResponse = {
        allowed: true,
        remaining: 90,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      // Premier appel
      const firstResult = await checkRateLimit('default');
      
      // Deuxième appel immédiatement (devrait utiliser le cache)
      const secondResult = await checkRateLimit('default');

      expect(firstResult.allowed).toBe(true);
      expect(secondResult.allowed).toBe(true);
      expect(secondResult.remaining).toBe(90);
      // Le cache devrait être utilisé, donc un seul appel
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });

    it('devrait bypasser le cache si bypassCache est true', async () => {
      const mockResponse1 = {
        allowed: true,
        remaining: 90,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      const mockResponse2 = {
        allowed: true,
        remaining: 85,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      (supabase.functions.invoke as any)
        .mockResolvedValueOnce({ data: mockResponse1, error: null })
        .mockResolvedValueOnce({ data: mockResponse2, error: null });

      // Premier appel
      await checkRateLimit('default', undefined, false);
      
      // Deuxième appel avec bypassCache
      const result = await checkRateLimit('default', undefined, true);

      expect(result.remaining).toBe(85);
      // Devrait avoir été appelé deux fois
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer les erreurs et retourner un fallback', async () => {
      const mockError = { message: 'Network error', status: 500 };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await checkRateLimit('default');

      expect(result.allowed).toBe(true); // Fail open
      expect(result.remaining).toBe(10); // Limite réduite
      expect(result.limit).toBe(10);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait passer userId dans la requête', async () => {
      const mockResponse = {
        allowed: true,
        remaining: 80,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const userId = 'test-user-id';
      await checkRateLimit('default', userId);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('rate-limiter', {
        body: {
          endpoint: 'default',
          userId: userId,
          timestamp: expect.any(Number),
        },
      });
    });

    it('devrait gérer les exceptions et retourner un fallback', async () => {
      const mockError = new Error('Unexpected error');

      (supabase.functions.invoke as any).mockRejectedValue(mockError);

      const result = await checkRateLimit('default');

      expect(result.allowed).toBe(true); // Fail open
      expect(result.remaining).toBe(10); // Limite réduite
      expect(result.limit).toBe(10);
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('withRateLimit', () => {
    it('devrait exécuter l\'action si le rate limit est respecté', async () => {
      const mockResponse = {
        allowed: true,
        remaining: 90,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const action = vi.fn().mockResolvedValue('success');

      const result = await withRateLimit('default', action);

      expect(result).toBe('success');
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('devrait lancer une erreur si le rate limit est dépassé', async () => {
      const mockResponse = {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
        message: 'Rate limit exceeded',
      };

      (supabase.functions.invoke as any).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const action = vi.fn().mockResolvedValue('success');

      try {
        await withRateLimit('default', action);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Rate limit exceeded');
        expect(action).not.toHaveBeenCalled();
      }
    });

    it('devrait retry avec exponential backoff si retry est activé', async () => {
      const mockResponseBlocked = {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      const mockResponseAllowed = {
        allowed: true,
        remaining: 90,
        resetAt: new Date(Date.now() + 60000).toISOString(),
        limit: 100,
      };

      (supabase.functions.invoke as any)
        .mockResolvedValueOnce({ data: mockResponseBlocked, error: null })
        .mockResolvedValueOnce({ data: mockResponseAllowed, error: null });

      const action = vi.fn().mockResolvedValue('success');

      // Note: Le retry avec backoff nécessite un délai réel, donc on vérifie juste que le retry fonctionne
      const result = await withRateLimit('default', action, {
        retry: true,
        maxRetries: 3,
        retryDelay: 10, // Délai court pour les tests
      });

      expect(result).toBe('success');
      expect(action).toHaveBeenCalledTimes(1);
      // Devrait avoir appelé checkRateLimit au moins 2 fois (premier bloqué, deuxième autorisé)
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
    });
  });

  describe('useRateLimit hook', () => {
    it('devrait initialiser avec les valeurs par défaut', () => {
      // Note: Ce test nécessiterait React Testing Library pour tester le hook
      // Pour l'instant, on vérifie juste que la fonction existe
      expect(typeof useRateLimit).toBe('function');
    });
  });
});


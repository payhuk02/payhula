/**
 * Edge Function: Rate Limiter
 * Protection contre les abus et attaques DDoS
 * 
 * Limites par défaut:
 * - Requêtes API: 100/minute par IP
 * - Authentification: 5/minute par IP
 * - Webhooks: 1000/minute par IP
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowSeconds: 60 },
  auth: { maxRequests: 5, windowSeconds: 60 },
  webhook: { maxRequests: 1000, windowSeconds: 60 },
  api: { maxRequests: 100, windowSeconds: 60 },
};

/**
 * Extraire l'IP du client
 */
function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Vérifier si la limite est dépassée
 */
async function checkRateLimit(
  supabase: any,
  ip: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);

  // Compter les requêtes dans la fenêtre
  const { count, error } = await supabase
    .from('rate_limit_log')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(now.getTime() + config.windowSeconds * 1000) };
  }

  const requestCount = count || 0;
  const allowed = requestCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const resetAt = new Date(now.getTime() + config.windowSeconds * 1000);

  // Logger la requête si autorisée
  if (allowed) {
    await supabase
      .from('rate_limit_log')
      .insert({
        ip_address: ip,
        endpoint: endpoint,
        created_at: now.toISOString()
      });
  }

  return { allowed, remaining, resetAt };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { endpoint = 'default' } = await req.json();
    const ip = getClientIp(req);
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;

    const result = await checkRateLimit(supabase, ip, endpoint, config);

    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
    };

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${config.windowSeconds} seconds.`,
          resetAt: result.resetAt
        }),
        { status: 429, headers }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: result.remaining,
        resetAt: result.resetAt
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


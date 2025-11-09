import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://payhula.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// PayDunya API URL (à vérifier avec la documentation officielle)
const PAYDUNYA_API_URL = Deno.env.get('PAYDUNYA_API_URL') || 'https://app.paydunya.com/api/v1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier les clés API
    const paydunyaMasterKey = Deno.env.get('PAYDUNYA_MASTER_KEY');
    const paydunyaPrivateKey = Deno.env.get('PAYDUNYA_PRIVATE_KEY');
    const paydunyaToken = Deno.env.get('PAYDUNYA_TOKEN');
    
    if (!paydunyaMasterKey || !paydunyaPrivateKey || !paydunyaToken) {
      console.error('PayDunya credentials are not configured');
      const missingKeys = [];
      if (!paydunyaMasterKey) missingKeys.push('PAYDUNYA_MASTER_KEY');
      if (!paydunyaPrivateKey) missingKeys.push('PAYDUNYA_PRIVATE_KEY');
      if (!paydunyaToken) missingKeys.push('PAYDUNYA_TOKEN');
      
      return new Response(
        JSON.stringify({ 
          error: 'Configuration API PayDunya manquante',
          message: `Les clés API PayDunya suivantes ne sont pas configurées: ${missingKeys.join(', ')}`,
          hint: 'Veuillez configurer les clés API dans Supabase Dashboard → Edge Functions → Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le JSON de la requête
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('Error parsing request JSON:', jsonError);
      return new Response(
        JSON.stringify({ 
          error: 'Requête invalide',
          message: 'Le corps de la requête n\'est pas un JSON valide',
          details: jsonError instanceof Error ? jsonError.message : 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = requestBody;
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action manquante', message: 'Le paramètre "action" est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('PayDunya request:', { action, hasData: !!data });

    let endpoint = '';
    let method = 'POST';
    let body = data;

    // Route vers les différents endpoints PayDunya
    switch (action) {
      case 'create_payment':
        endpoint = '/checkout-invoice/create';
        method = 'POST';
        break;
      
      case 'get_payment':
        endpoint = `/checkout-invoice/confirm/${data.paymentId}`;
        method = 'GET';
        body = null;
        break;
      
      case 'create_checkout':
        endpoint = '/checkout-invoice/create';
        method = 'POST';
        // Format PayDunya pour créer un checkout
        const siteUrl = Deno.env.get('SITE_URL') || 'https://payhula.vercel.app';
        body = {
          invoice: {
            items: [{
              name: data.description || 'Paiement',
              quantity: 1,
              unit_price: data.amount,
              total_price: data.amount,
            }],
            total_amount: data.amount,
            description: data.description,
          },
          store: {
            name: 'Payhula',
            tagline: 'Plateforme E-commerce',
            postal_address: '',
            phone: '',
            logo_url: '',
            website_url: siteUrl,
          },
          actions: {
            cancel_url: data.cancel_url,
            return_url: data.return_url,
            callback_url: data.return_url, // Webhook URL
          },
          custom_data: data.metadata || {},
        };
        break;
      
      case 'verify_payment':
        endpoint = `/checkout-invoice/confirm/${data.paymentId}`;
        method = 'GET';
        body = null;
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Appel à l'API PayDunya
    // Note: PayDunya utilise généralement Master Key, Private Key et Token pour l'authentification
    const authString = `Master-Key: ${paydunyaMasterKey}, Private-Key: ${paydunyaPrivateKey}, Token: ${paydunyaToken}`;
    
    const paydunyaResponse = await fetch(`${PAYDUNYA_API_URL}${endpoint}`, {
      method,
      headers: {
        'PAYDUNYA-MASTER-KEY': paydunyaMasterKey,
        'PAYDUNYA-PRIVATE-KEY': paydunyaPrivateKey,
        'PAYDUNYA-TOKEN': paydunyaToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });

    // Parser la réponse JSON
    let responseData;
    try {
      const responseText = await paydunyaResponse.text();
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Error parsing PayDunya response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur de réponse PayDunya',
          message: 'Impossible de parser la réponse de l\'API PayDunya',
          status: paydunyaResponse.status,
          statusText: paydunyaResponse.statusText
        }),
        { 
          status: paydunyaResponse.status || 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!paydunyaResponse.ok) {
      console.error('PayDunya API error:', {
        status: paydunyaResponse.status,
        statusText: paydunyaResponse.statusText,
        response: responseData
      });
      return new Response(
        JSON.stringify({ 
          error: 'Erreur PayDunya API',
          message: responseData.message || responseData.error || 'Erreur lors de l\'appel à l\'API PayDunya',
          details: responseData,
          status: paydunyaResponse.status
        }),
        { 
          status: paydunyaResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('PayDunya response success:', { action, status: paydunyaResponse.status });

    // Normaliser la réponse PayDunya pour correspondre au format attendu
    const normalizedResponse = {
      transaction_id: responseData.response?.invoice_token || responseData.response?.token,
      checkout_url: responseData.response?.invoice_url || responseData.response?.url,
      status: responseData.response?.status || responseData.status,
      ...responseData,
    };

    return new Response(
      JSON.stringify({ success: true, data: normalizedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne inconnue';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error in paydunya function:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne Edge Function',
        message: errorMessage,
        hint: 'Vérifiez les logs Supabase Edge Functions pour plus de détails'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


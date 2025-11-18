import { supabase } from "@/integrations/supabase/client";
import { logger } from './logger';

export interface PayDunyaPaymentData {
  amount: number;
  currency?: string;
  description?: string;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  metadata?: Record<string, unknown>;
  return_url?: string;
  cancel_url?: string;
}

export interface PayDunyaCheckoutData {
  amount: number;
  currency?: string;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  return_url: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
}

class PayDunyaClient {
  private async callFunction(action: string, data: Record<string, unknown>) {
    const { data: response, error } = await supabase.functions.invoke("paydunya", {
      body: { action, data },
    });

    if (error) {
      logger.error('[PayDunyaClient] Supabase function error', { error });
      const errorMessage = error.message || 'Erreur inconnue';
      
      // Vérifier si c'est une erreur Edge Function (non-2xx)
      if (errorMessage.includes('non-2xx') || errorMessage.includes('Edge Function')) {
        // L'erreur contient probablement des détails dans error.context ou error.data
        const errorDetails = (error as any)?.context || (error as any)?.data || {};
        const detailedMessage = errorDetails.message || errorDetails.error || errorMessage;
        
        // Vérifier si c'est une erreur de configuration API
        if (detailedMessage.includes('Configuration API') || 
            detailedMessage.includes('n\'est pas configurée')) {
          throw new Error(
            `${detailedMessage}. ` +
            `Veuillez configurer les clés API PayDunya dans Supabase Dashboard → Edge Functions → Secrets`
          );
        }
        
        throw new Error(detailedMessage || errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    if (!response?.success) {
      logger.error('[PayDunyaClient] PayDunya API error', { response });
      const responseError = response as { error?: string; message?: string; details?: unknown };
      const errorMessage = responseError.message || responseError.error || "Erreur lors de la requête PayDunya.";
      throw new Error(errorMessage);
    }

    return response.data;
  }

  /** 🔹 Créer un paiement direct */
  async createPayment(paymentData: PayDunyaPaymentData) {
    return this.callFunction("create_payment", paymentData);
  }

  /** 🔹 Récupérer les détails d'un paiement */
  async getPayment(paymentId: string) {
    return this.callFunction("get_payment", { paymentId });
  }

  /** 🔹 Initialiser une session de checkout PayDunya */
  async createCheckout(checkoutData: PayDunyaCheckoutData) {
    return this.callFunction("create_checkout", checkoutData);
  }

  /** 🔹 Vérifier le statut d'un paiement */
  async verifyPayment(paymentId: string) {
    return this.callFunction("verify_payment", { paymentId });
  }
}

export const paydunyaClient = new PayDunyaClient();



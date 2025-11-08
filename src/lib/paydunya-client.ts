import { supabase } from "@/integrations/supabase/client";

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
      console.error(`[PayDunyaClient] Supabase function error:`, error);
      throw new Error(error.message || "Erreur de communication avec le serveur.");
    }

    if (!response?.success) {
      console.error(`[PayDunyaClient] PayDunya API error:`, response);
      throw new Error(response?.error || "Erreur lors de la requête PayDunya.");
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


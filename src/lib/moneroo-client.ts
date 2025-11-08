import { supabase } from "@/integrations/supabase/client";
import {
  parseMonerooError,
  MonerooNetworkError,
  MonerooAPIError,
  MonerooTimeoutError,
  MonerooValidationError,
  MonerooAuthenticationError,
} from "./moneroo-errors";
import { Currency } from "./currency-converter";

export interface MonerooPaymentData {
  amount: number;
  currency?: Currency;
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

export interface MonerooCheckoutData {
  amount: number;
  currency?: Currency;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  return_url: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
}

export interface MonerooRefundData {
  paymentId: string;
  amount?: number; // Si non spécifié, remboursement total
  reason?: string;
}

export interface MonerooRefundResponse {
  refund_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

class MonerooClient {
  private async callFunction(action: string, data: Record<string, unknown>) {
    try {
      const { data: response, error } = await supabase.functions.invoke("moneroo", {
        body: { action, data },
      });

      if (error) {
        // Erreur de communication Supabase
        if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
          throw new MonerooTimeoutError(error.message);
        }
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          throw new MonerooNetworkError(error.message);
        }
        throw parseMonerooError(error);
      }

      if (!response?.success) {
        // Erreur API Moneroo
        const statusCode = (response as { statusCode?: number })?.statusCode || 500;
        const errorMessage = (response as { error?: string })?.error || "Erreur lors de la requête Moneroo.";
        
        if (statusCode === 401) {
          throw new MonerooAuthenticationError(errorMessage);
        }
        if (statusCode === 400) {
          throw new MonerooValidationError(errorMessage);
        }
        
        throw new MonerooAPIError(errorMessage, statusCode, response);
      }

      return response.data;
    } catch (error) {
      // Si c'est déjà une MonerooError, la relancer
      if (error instanceof MonerooNetworkError || 
          error instanceof MonerooAPIError ||
          error instanceof MonerooTimeoutError ||
          error instanceof MonerooValidationError ||
          error instanceof MonerooAuthenticationError) {
        throw error;
      }
      // Sinon, parser l'erreur
      throw parseMonerooError(error);
    }
  }

  /** 🔹 Créer un paiement direct */
  async createPayment(paymentData: MonerooPaymentData) {
    return this.callFunction("create_payment", paymentData);
  }

  /** 🔹 Récupérer les détails d'un paiement */
  async getPayment(paymentId: string) {
    return this.callFunction("get_payment", { paymentId });
  }

  /** 🔹 Initialiser une session de checkout Moneroo */
  async createCheckout(checkoutData: MonerooCheckoutData) {
    return this.callFunction("create_checkout", checkoutData);
  }

  /** 🔹 Vérifier le statut d'un paiement */
  async verifyPayment(paymentId: string) {
    return this.callFunction("verify_payment", { paymentId });
  }

  /** 🔹 Rembourser un paiement */
  async refundPayment(refundData: MonerooRefundData): Promise<MonerooRefundResponse> {
    return this.callFunction("refund_payment", refundData) as Promise<MonerooRefundResponse>;
  }

  /** 🔹 Annuler un paiement */
  async cancelPayment(paymentId: string) {
    return this.callFunction("cancel_payment", { paymentId });
  }
}

export const monerooClient = new MonerooClient();

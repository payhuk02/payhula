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
      // Vérifier l'authentification avant d'appeler l'Edge Function
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('[MonerooClient] Auth check warning:', authError);
      }
      
      console.log('[MonerooClient] Calling Edge Function:', { 
        action, 
        hasData: !!data,
        isAuthenticated: !!user,
        userId: user?.id,
      });
      
      // Vérifier que Supabase est configuré
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new MonerooNetworkError(
          'VITE_SUPABASE_URL n\'est pas configuré. Vérifiez vos variables d\'environnement.'
        );
      }
      
      console.log('[MonerooClient] Supabase URL:', supabaseUrl);
      console.log('[MonerooClient] Edge Function URL:', `${supabaseUrl}/functions/v1/moneroo`);
      
      // Appel à l'Edge Function avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
      
      try {
        const { data: response, error } = await supabase.functions.invoke("moneroo", {
          body: { action, data },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          // Erreur de communication Supabase
          const errorMessage = error.message || 'Erreur inconnue';
          console.error('[MonerooClient] Supabase function error:', {
            error,
            message: errorMessage,
            context: (error as any)?.context,
            data: (error as any)?.data,
            name: error.name,
            stack: (error as any)?.stack,
          });
          
          // Gérer l'erreur "Failed to fetch" spécifiquement
          if (errorMessage.includes('Failed to fetch') || 
              errorMessage.includes('fetch') ||
              errorMessage.includes('NetworkError') ||
              errorMessage.includes('network') ||
              errorMessage.toLowerCase().includes('network request failed')) {
            
            console.error('[MonerooClient] Network error details:', {
              errorMessage,
              error,
              supabaseUrl,
              edgeFunctionUrl: `${supabaseUrl}/functions/v1/moneroo`,
              action,
              timestamp: new Date().toISOString(),
            });
            
            throw new MonerooNetworkError(
              `Erreur de connexion: Impossible de se connecter à l'Edge Function Moneroo.\n\n` +
              `💡 Vérifiez:\n` +
              `1. Votre connexion Internet\n` +
              `2. Que l'Edge Function 'moneroo' est déployée dans Supabase Dashboard\n` +
              `3. Que l'Edge Function est accessible: ${supabaseUrl}/functions/v1/moneroo\n` +
              `4. Les logs Supabase Edge Functions → Logs → moneroo pour plus de détails\n\n` +
              `Erreur technique: ${errorMessage}`,
              { originalError: error, action, data, supabaseUrl }
            );
          }
          
          // Vérifier si c'est une erreur Edge Function (non-2xx)
          if (errorMessage.includes('non-2xx') || errorMessage.includes('Edge Function')) {
            // Essayer d'extraire les détails de l'erreur
            // Supabase peut retourner les détails dans différentes propriétés
            let errorDetails: any = {};
            let detailedMessage = errorMessage;
            
            // Essayer plusieurs emplacements pour les détails
            if ((error as any)?.context) {
              errorDetails = (error as any).context;
            } else if ((error as any)?.data) {
              errorDetails = (error as any).data;
            } else if ((error as any)?.body) {
              try {
                errorDetails = typeof (error as any).body === 'string' 
                  ? JSON.parse((error as any).body) 
                  : (error as any).body;
              } catch {
                errorDetails = { raw: (error as any).body };
              }
            }
            
            // Extraire le message détaillé
            if (errorDetails.message) {
              detailedMessage = errorDetails.message;
            } else if (errorDetails.error) {
              detailedMessage = typeof errorDetails.error === 'string' 
                ? errorDetails.error 
                : errorDetails.error?.message || errorMessage;
            } else if (errorDetails.hint) {
              detailedMessage = `${errorMessage}. ${errorDetails.hint}`;
            }
            
            // Vérifier si c'est une erreur de configuration API
            if (detailedMessage.includes('Configuration API manquante') || 
                detailedMessage.includes('n\'est pas configurée') ||
                detailedMessage.includes('MONEROO_API_KEY')) {
              throw new MonerooAuthenticationError(
                `Configuration API manquante: ${detailedMessage}. ` +
                `Veuillez configurer MONEROO_API_KEY dans Supabase Dashboard → Edge Functions → Secrets`
              );
            }
            
            // Créer un message d'erreur plus informatif
            const fullErrorMessage = errorDetails.hint 
              ? `${detailedMessage}\n\n💡 ${errorDetails.hint}`
              : detailedMessage;
            
            throw new MonerooAPIError(fullErrorMessage, errorDetails.status || 500, errorDetails);
          }
          
          if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
            throw new MonerooTimeoutError(errorMessage);
          }
          if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            throw new MonerooNetworkError(errorMessage);
          }
          throw parseMonerooError(error);
        }

        if (!response?.success) {
          // Erreur API Moneroo
          const responseError = response as { error?: string; message?: string; details?: unknown; status?: number };
          const statusCode = responseError.status || 500;
          const errorMessage = responseError.message || responseError.error || "Erreur lors de la requête Moneroo.";
          
          if (statusCode === 401) {
            throw new MonerooAuthenticationError(errorMessage);
          }
          if (statusCode === 400) {
            throw new MonerooValidationError(errorMessage);
          }
          
          throw new MonerooAPIError(errorMessage, statusCode, responseError.details || response);
        }

        return response.data;
      } catch (invokeError: any) {
        clearTimeout(timeoutId);
        
        // Si c'est une erreur d'abort (timeout), gérer spécifiquement
        if (invokeError?.name === 'AbortError' || invokeError?.message?.includes('aborted')) {
          throw new MonerooTimeoutError(
            'Timeout: L\'Edge Function Moneroo n\'a pas répondu dans les 30 secondes. ' +
            'Vérifiez que l\'Edge Function est déployée et fonctionne correctement.'
          );
        }
        
        // Si c'est déjà une MonerooError, la relancer
        if (invokeError instanceof MonerooNetworkError || 
            invokeError instanceof MonerooAPIError ||
            invokeError instanceof MonerooTimeoutError ||
            invokeError instanceof MonerooValidationError ||
            invokeError instanceof MonerooAuthenticationError) {
          throw invokeError;
        }
        
        // Vérifier si c'est une erreur réseau générique
        const errorMessage = invokeError instanceof Error ? invokeError.message : String(invokeError);
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('network request failed')) {
          throw new MonerooNetworkError(
            `Erreur de connexion réseau: ${errorMessage}\n\n` +
            `💡 Vérifiez votre connexion Internet et que l'Edge Function est déployée.`,
            { originalError: invokeError }
          );
        }
        
        // Sinon, parser l'erreur
        throw parseMonerooError(invokeError);
      }
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

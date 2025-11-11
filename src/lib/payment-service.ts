/**
 * Service de paiement unifié
 * Supporte Moneroo et PayDunya
 */
import { initiateMonerooPayment, verifyTransactionStatus as verifyMonerooTransaction } from "./moneroo-payment";
import { initiatePayDunyaPayment, verifyPayDunyaTransactionStatus } from "./paydunya-payment";
import { logger } from "./logger";

export type PaymentProvider = 'moneroo' | 'paydunya';

export interface PaymentOptions {
  storeId: string;
  productId?: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency?: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
  provider?: PaymentProvider; // Si non spécifié, utilise Moneroo par défaut
}

export interface PaymentResult {
  success: boolean;
  transaction_id: string;
  checkout_url: string;
  provider: PaymentProvider;
  provider_transaction_id?: string;
  error?: string;
}

/**
 * Initie un paiement avec le provider spécifié (ou Moneroo par défaut)
 */
export const initiatePayment = async (options: PaymentOptions): Promise<PaymentResult> => {
  const provider = options.provider || 'moneroo';

  try {
    let result;
    
    if (provider === 'paydunya') {
      logger.log('Initiating PayDunya payment', { orderId: options.orderId });
      const paydunyaResult = await initiatePayDunyaPayment(options);
      result = {
        success: paydunyaResult.success,
        transaction_id: paydunyaResult.transaction_id,
        checkout_url: paydunyaResult.checkout_url,
        provider: 'paydunya',
        provider_transaction_id: paydunyaResult.paydunya_transaction_id,
      };
    } else {
      logger.log('Initiating Moneroo payment', { orderId: options.orderId });
      const monerooResult = await initiateMonerooPayment(options);
      result = {
        success: monerooResult.success,
        transaction_id: monerooResult.transaction_id,
        checkout_url: monerooResult.checkout_url,
        provider: 'moneroo',
        provider_transaction_id: monerooResult.moneroo_transaction_id,
      };
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'initiation du paiement';
    logger.error('Payment initiation error:', error);
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider,
      error: errorMessage,
    };
  }
};

/**
 * Vérifie le statut d'une transaction
 */
export const verifyTransactionStatus = async (transactionId: string, provider?: PaymentProvider) => {
  // Si le provider n'est pas spécifié, le récupérer depuis la transaction
  if (!provider) {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: transaction } = await supabase
      .from("transactions")
      .select("payment_provider")
      .eq("id", transactionId)
      .single();
    
    provider = (transaction?.payment_provider as PaymentProvider) || 'moneroo';
  }

  if (provider === 'paydunya') {
    return verifyPayDunyaTransactionStatus(transactionId);
  } else {
    return verifyMonerooTransaction(transactionId);
  }
};








import { supabase } from "@/integrations/supabase/client";
import { paydunyaClient, PayDunyaCheckoutData } from "./paydunya-client";
import { logger } from './logger';

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
}

/**
 * Initie un paiement PayDunya complet avec tracking dans la base de données
 */
export const initiatePayDunyaPayment = async (options: PaymentOptions) => {
  const {
    storeId,
    productId,
    orderId,
    customerId,
    amount,
    currency = "XOF",
    description,
    customerEmail,
    customerName,
    customerPhone,
    metadata = {},
  } = options;

  try {
    // 1. Créer la transaction dans la base de données
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        store_id: storeId,
        product_id: productId,
        order_id: orderId,
        customer_id: customerId,
        amount,
        currency,
        status: "pending",
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        metadata,
        payment_provider: "paydunya", // Indiquer que c'est PayDunya
      })
      .select()
      .single();

    if (transactionError) {
      logger.error("Error creating transaction:", transactionError);
      // Afficher plus de détails sur l'erreur pour le debug
      const errorDetails = transactionError.message || JSON.stringify(transactionError);
      console.error("Transaction error details:", {
        error: transactionError,
        storeId,
        customerId,
        productId,
        amount,
        currency,
      });
      throw new Error(`Impossible de créer la transaction: ${errorDetails}`);
    }

    logger.log("Transaction created:", transaction.id);

    // 2. Log de création de transaction
    await supabase.from("transaction_logs").insert([{
      transaction_id: transaction.id,
      event_type: "created",
      status: "pending",
      request_data: JSON.parse(JSON.stringify(options)),
    }]);

    // 3. Initialiser le paiement PayDunya
    const checkoutData: PayDunyaCheckoutData = {
      amount,
      currency,
      description,
      customer_email: customerEmail,
      customer_name: customerName,
      return_url: `${window.location.origin}/checkout/success?transaction_id=${transaction.id}`,
      cancel_url: `${window.location.origin}/checkout/cancel?transaction_id=${transaction.id}`,
      metadata: {
        transaction_id: transaction.id,
        store_id: storeId,
        ...metadata,
      },
    };

    logger.log("Initiating PayDunya checkout:", checkoutData);

    const paydunyaResponse = await paydunyaClient.createCheckout(checkoutData);

    logger.log("PayDunya response:", paydunyaResponse);

    // 4. Mettre à jour la transaction avec les infos PayDunya
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        paydunya_transaction_id: paydunyaResponse.transaction_id || paydunyaResponse.id,
        paydunya_checkout_url: paydunyaResponse.checkout_url,
        paydunya_response: paydunyaResponse,
        status: "processing",
      })
      .eq("id", transaction.id);

    if (updateError) {
      logger.error("Error updating transaction:", updateError);
    }

    // 5. Log du paiement initié
    await supabase.from("transaction_logs").insert([{
      transaction_id: transaction.id,
      event_type: "payment_initiated",
      status: "processing",
      response_data: paydunyaResponse,
    }]);

    // 6. Retourner les données pour redirection
    return {
      success: true,
      transaction_id: transaction.id,
      checkout_url: paydunyaResponse.checkout_url,
      paydunya_transaction_id: paydunyaResponse.transaction_id || paydunyaResponse.id,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error("Payment initiation error:", error);
    throw new Error(errorMessage);
  }
};

/**
 * Vérifie le statut d'une transaction PayDunya et met à jour la base de données
 */
export const verifyPayDunyaTransactionStatus = async (transactionId: string) => {
  try {
    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error("Transaction introuvable");
    }

    // Si la transaction a déjà un statut final, retourner directement
    if (["completed", "failed", "cancelled"].includes(transaction.status)) {
      return transaction;
    }

    // Vérifier auprès de PayDunya si on a un ID de transaction
    if (transaction.paydunya_transaction_id) {
      try {
        const paydunyaStatus = await paydunyaClient.verifyPayment(
          transaction.paydunya_transaction_id
        );

        // Mettre à jour selon le statut PayDunya
        const statusMap: Record<string, string> = {
          completed: "completed",
          success: "completed",
          failed: "failed",
          pending: "processing",
          cancelled: "cancelled",
        };

        const newStatus = statusMap[paydunyaStatus.status] || "processing";

        const updates: Record<string, unknown> = {
          status: newStatus,
          paydunya_payment_method: paydunyaStatus.payment_method,
          paydunya_response: paydunyaStatus,
        };

        if (newStatus === "completed") {
          updates.completed_at = new Date().toISOString();
        } else if (newStatus === "failed") {
          updates.failed_at = new Date().toISOString();
          updates.error_message = paydunyaStatus.error_message || "Paiement échoué";
        }

        await supabase
          .from("transactions")
          .update(updates)
          .eq("id", transactionId);

        // Log de vérification
        await supabase.from("transaction_logs").insert([{
          transaction_id: transactionId,
          event_type: "status_updated",
          status: newStatus,
          response_data: paydunyaStatus,
        }]);

        return { ...transaction, ...updates };
      } catch (verifyError) {
        console.error("Error verifying with PayDunya:", verifyError);
        // Retourner la transaction actuelle si la vérification échoue
        return transaction;
      }
    }

    return transaction;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error("Transaction verification error:", errorMessage);
    throw new Error(errorMessage);
  }
};


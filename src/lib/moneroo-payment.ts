import { supabase } from "@/integrations/supabase/client";
import { monerooClient, MonerooCheckoutData } from "./moneroo-client";
import { logger } from './logger';
import {
  parseMonerooError,
  MonerooError,
  MonerooValidationError,
} from "./moneroo-errors";

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

export interface RefundOptions {
  transactionId: string;
  amount?: number; // Si non spécifié, remboursement total
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refund_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
}

/**
 * Initie un paiement Moneroo complet avec tracking dans la base de données
 */
export const initiateMonerooPayment = async (options: PaymentOptions) => {
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
        payment_provider: "moneroo", // Indiquer que c'est Moneroo
      })
      .select()
      .single();

    if (transactionError) {
      logger.error("Error creating transaction:", transactionError);
      throw new Error("Impossible de créer la transaction");
    }

    logger.log("Transaction created:", transaction.id);

    // 2. Log de création de transaction
    await supabase.from("transaction_logs").insert([{
      transaction_id: transaction.id,
      event_type: "created",
      status: "pending",
      request_data: JSON.parse(JSON.stringify(options)),
    }]);

    // 3. Initialiser le paiement Moneroo
    const checkoutData: MonerooCheckoutData = {
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

    logger.log("Initiating Moneroo checkout:", checkoutData);

    const monerooResponse = await monerooClient.createCheckout(checkoutData);

    logger.log("Moneroo response:", monerooResponse);

    // 4. Mettre à jour la transaction avec les infos Moneroo
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        moneroo_transaction_id: monerooResponse.transaction_id || monerooResponse.id,
        moneroo_checkout_url: monerooResponse.checkout_url,
        moneroo_response: monerooResponse,
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
      response_data: monerooResponse,
    }]);

    // 6. Retourner les données pour redirection
    return {
      success: true,
      transaction_id: transaction.id,
      checkout_url: monerooResponse.checkout_url,
      moneroo_transaction_id: monerooResponse.transaction_id || monerooResponse.id,
    };
  } catch (error: unknown) {
    const monerooError = parseMonerooError(error);
    logger.error("Payment initiation error:", {
      error: monerooError.message,
      code: monerooError.code,
      statusCode: monerooError.statusCode,
      details: monerooError.details,
    });
    throw monerooError;
  }
};

/**
 * Vérifie le statut d'une transaction et met à jour la base de données
 */
export const verifyTransactionStatus = async (transactionId: string) => {
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

    // Vérifier auprès de Moneroo si on a un ID de transaction
    if (transaction.moneroo_transaction_id) {
      try {
        const monerooStatus = await monerooClient.verifyPayment(
          transaction.moneroo_transaction_id
        );

        // Mettre à jour selon le statut Moneroo
        const statusMap: Record<string, string> = {
          completed: "completed",
          success: "completed",
          failed: "failed",
          pending: "processing",
          cancelled: "cancelled",
        };

        const newStatus = statusMap[monerooStatus.status] || "processing";

        const updates: any = {
          status: newStatus,
          moneroo_payment_method: monerooStatus.payment_method,
          moneroo_response: monerooStatus,
        };

        if (newStatus === "completed") {
          updates.completed_at = new Date().toISOString();
        } else if (newStatus === "failed") {
          updates.failed_at = new Date().toISOString();
          updates.error_message = monerooStatus.error_message || "Paiement échoué";
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
          response_data: monerooStatus,
        }]);

        return { ...transaction, ...updates };
      } catch (verifyError) {
        console.error("Error verifying with Moneroo:", verifyError);
        // Retourner la transaction actuelle si la vérification échoue
        return transaction;
      }
    }

    return transaction;
  } catch (error: unknown) {
    const monerooError = parseMonerooError(error);
    logger.error("Transaction verification error:", {
      error: monerooError.message,
      code: monerooError.code,
      transactionId,
    });
    throw monerooError;
  }
};

/**
 * Rembourse un paiement Moneroo
 */
export const refundMonerooPayment = async (options: RefundOptions): Promise<RefundResult> => {
  const { transactionId, amount, reason } = options;

  try {
    // Validation
    if (!transactionId) {
      throw new MonerooValidationError("Transaction ID is required");
    }

    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new MonerooValidationError("Transaction not found");
    }

    // Vérifier que la transaction est complétée
    if (transaction.status !== "completed") {
      throw new MonerooValidationError(
        `Cannot refund transaction with status: ${transaction.status}`
      );
    }

    // Vérifier que c'est une transaction Moneroo
    if (transaction.payment_provider !== "moneroo" || !transaction.moneroo_transaction_id) {
      throw new MonerooValidationError("Transaction is not a Moneroo payment");
    }

    // Vérifier le montant
    const refundAmount = amount || transaction.amount;
    if (refundAmount > transaction.amount) {
      throw new MonerooValidationError("Refund amount cannot exceed transaction amount");
    }

    // Log de début de remboursement
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "refund_initiated",
      status: "processing",
      request_data: { amount: refundAmount, reason },
    }]);

    // Appeler l'API Moneroo pour le remboursement
    const refundResponse = await monerooClient.refundPayment({
      paymentId: transaction.moneroo_transaction_id,
      amount: refundAmount,
      reason: reason || "Customer request",
    });

    // Mettre à jour la transaction avec les infos de remboursement
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "refunded",
        moneroo_refund_id: refundResponse.refund_id,
        moneroo_refund_amount: refundResponse.amount,
        moneroo_refund_reason: reason || "Customer request",
        refunded_at: new Date().toISOString(),
        metadata: {
          ...(transaction.metadata as Record<string, unknown> || {}),
          refund: {
            refund_id: refundResponse.refund_id,
            amount: refundResponse.amount,
            currency: refundResponse.currency,
            status: refundResponse.status,
            created_at: refundResponse.created_at,
            reason,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      logger.error("Error updating transaction with refund:", updateError);
    }

    // Log de remboursement complété
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "refund_completed",
      status: "completed",
      response_data: refundResponse,
    }]);

    logger.log("Refund completed:", {
      transactionId,
      refundId: refundResponse.refund_id,
      amount: refundResponse.amount,
    });

    return {
      success: true,
      refund_id: refundResponse.refund_id,
      amount: refundResponse.amount,
      currency: refundResponse.currency,
      status: refundResponse.status,
    };
  } catch (error: unknown) {
    const monerooError = parseMonerooError(error);
    
    // Log de l'erreur
    await supabase.from("transaction_logs").insert([{
      transaction_id: transactionId,
      event_type: "refund_failed",
      status: "failed",
      error_data: {
        error: monerooError.message,
        code: monerooError.code,
      },
    }]).catch((err) => console.error("Error logging refund failure:", err));

    logger.error("Refund error:", {
      error: monerooError.message,
      code: monerooError.code,
      transactionId,
    });

    return {
      success: false,
      error: monerooError.message,
    };
  }
};

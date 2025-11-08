/**
 * Service de gestion multi-stores pour le checkout
 * Gère la création de commandes séparées par boutique
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import type { CartItem as CartItemType } from '@/types/cart';

export interface CartItem extends CartItemType {
  store_id?: string; // À récupérer depuis le produit
}

export interface StoreGroup {
  store_id: string;
  store_name?: string;
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total: number;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  state?: string;
}

export interface CreateMultiStoreOrderOptions {
  shippingAddress: ShippingAddress;
  customerId: string;
  customerEmail: string;
  appliedCoupon?: {
    id: string;
    discountAmount: number;
    code: string;
    storeId?: string; // Si le coupon est spécifique à une boutique
  };
  appliedGiftCard?: {
    id: string;
    balance: number;
    code: string;
    storeId?: string; // Si la carte cadeau est spécifique à une boutique
  };
  taxRate?: number;
  shippingAmount?: number;
  affiliateInfo?: {
    affiliate_link_id: string | null;
    affiliate_id: string | null;
    product_id: string | null;
    tracking_cookie: string | null;
  };
}

export interface MultiStoreOrderResult {
  success: boolean;
  orders: Array<{
    order_id: string;
    order_number: string;
    store_id: string;
    store_name?: string;
    total_amount: number;
    items_count: number;
  }>;
  transactions: Array<{
    transaction_id: string;
    order_id: string;
    store_id: string;
    amount: number;
    provider: 'moneroo' | 'paydunya';
    checkout_url?: string;
  }>;
  error?: string;
  warning?: string; // Avertissement pour les succès partiels
}

/**
 * Résultat du groupement par boutique
 */
export interface GroupItemsByStoreResult {
  storeGroups: Map<string, StoreGroup>;
  skippedItems: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
}

/**
 * Groupe les items du panier par boutique
 * Retourne aussi les produits ignorés (sans store_id)
 */
export async function groupItemsByStore(
  items: CartItem[]
): Promise<GroupItemsByStoreResult> {
  const storeGroups = new Map<string, StoreGroup>();
  const skippedItems: GroupItemsByStoreResult['skippedItems'] = [];

  // Récupérer les store_id pour chaque produit
  const productIds = items.map(item => item.product_id);
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, store_id, name')
    .in('id', productIds);

  if (error) {
    logger.error('Error fetching products for store grouping:', error);
    throw new Error('Impossible de récupérer les informations des produits');
  }

  // Créer un map product_id -> store_id
  const productStoreMap = new Map<string, { store_id: string; name: string }>();
  const productNameMap = new Map<string, string>();
  
  products?.forEach(product => {
    productNameMap.set(product.id, product.name || 'Produit inconnu');
    if (product.store_id) {
      productStoreMap.set(product.id, {
        store_id: product.store_id,
        name: product.name || '',
      });
    }
  });

  // Grouper les items par store
  for (const item of items) {
    const productInfo = productStoreMap.get(item.product_id);
    
    if (!productInfo) {
      // Produit sans store_id - ajouter à la liste des produits ignorés
      const productName = productNameMap.get(item.product_id) || item.product_name || 'Produit inconnu';
      logger.warn(`Product ${item.product_id} (${productName}) has no store_id, skipping`, {
        product_id: item.product_id,
        product_name: productName,
        quantity: item.quantity,
      });
      
      skippedItems.push({
        product_id: item.product_id,
        product_name: productName,
        quantity: item.quantity,
      });
      continue;
    }

    const storeId = productInfo.store_id;
    
    if (!storeGroups.has(storeId)) {
      storeGroups.set(storeId, {
        store_id: storeId,
        store_name: productInfo.name,
        items: [],
        subtotal: 0,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        total: 0,
      });
    }

    const group = storeGroups.get(storeId)!;
    group.items.push({
      ...item,
      store_id: storeId,
    });

    // Calculer le subtotal pour cet item
    const itemSubtotal = (item.unit_price - (item.discount_amount || 0)) * item.quantity;
    group.subtotal += itemSubtotal;
  }

  return {
    storeGroups,
    skippedItems,
  };
}

/**
 * Calcule les taxes et frais de livraison pour chaque groupe de boutique
 */
export function calculateStoreTotals(
  storeGroups: Map<string, StoreGroup>,
  options: {
    taxRate?: number;
    shippingAmount?: number;
    appliedCoupon?: CreateMultiStoreOrderOptions['appliedCoupon'];
    appliedGiftCard?: CreateMultiStoreOrderOptions['appliedGiftCard'];
  }
): Map<string, StoreGroup> {
  const { taxRate = 0.18, shippingAmount = 0, appliedCoupon, appliedGiftCard } = options;

  // Calculer le total global avant application des réductions
  const globalSubtotal = Array.from(storeGroups.values()).reduce((sum, group) => sum + group.subtotal, 0);
  const numberOfStores = storeGroups.size;

  // Répartir les frais de livraison et les réductions entre les boutiques
  let remainingCouponAmount = appliedCoupon?.discountAmount || 0;
  let remainingGiftCardBalance = appliedGiftCard?.balance || 0;

  for (const [storeId, group] of storeGroups.entries()) {
    // Calculer les taxes sur le subtotal
    group.tax_amount = group.subtotal * taxRate;

    // Calculer les frais de livraison (diviser équitablement ou par poids/volume)
    // Pour l'instant, on divise les frais de livraison par le nombre de boutiques
    group.shipping_amount = numberOfStores > 0 ? shippingAmount / numberOfStores : 0;

    // Appliquer le coupon si spécifique à cette boutique ou global (répartir proportionnellement)
    if (appliedCoupon) {
      if (!appliedCoupon.storeId || appliedCoupon.storeId === storeId) {
        // Si le coupon est global, répartir proportionnellement au subtotal
        if (!appliedCoupon.storeId) {
          const proportion = globalSubtotal > 0 ? group.subtotal / globalSubtotal : 1 / numberOfStores;
          const couponAmountForStore = appliedCoupon.discountAmount * proportion;
          group.discount_amount += couponAmountForStore;
        } else {
          // Coupon spécifique à cette boutique
          group.discount_amount += appliedCoupon.discountAmount;
        }
      }
    }

    // Appliquer la carte cadeau si spécifique à cette boutique ou global (répartir proportionnellement)
    if (appliedGiftCard) {
      if (!appliedGiftCard.storeId || appliedGiftCard.storeId === storeId) {
        // Calculer le montant utilisable pour cette boutique
        const storeTotalBeforeGiftCard = group.subtotal + group.tax_amount + group.shipping_amount - group.discount_amount;
        
        if (!appliedGiftCard.storeId) {
          // Carte cadeau globale : répartir proportionnellement
          const proportion = globalSubtotal > 0 ? group.subtotal / globalSubtotal : 1 / numberOfStores;
          const giftCardAmountForStore = Math.min(
            remainingGiftCardBalance,
            storeTotalBeforeGiftCard,
            appliedGiftCard.balance * proportion
          );
          group.discount_amount += giftCardAmountForStore;
          remainingGiftCardBalance -= giftCardAmountForStore;
        } else {
          // Carte cadeau spécifique à cette boutique
          const giftCardAmount = Math.min(appliedGiftCard.balance, storeTotalBeforeGiftCard);
          group.discount_amount += giftCardAmount;
        }
      }
    }

    // Calculer le total final
    group.total = Math.max(0, 
      group.subtotal + 
      group.tax_amount + 
      group.shipping_amount - 
      group.discount_amount
    );
  }

  return storeGroups;
}

/**
 * Crée une commande pour chaque boutique
 */
export async function createMultiStoreOrders(
  storeGroups: Map<string, StoreGroup>,
  options: CreateMultiStoreOrderOptions
): Promise<MultiStoreOrderResult> {
  const { shippingAddress, customerId, customerEmail, appliedCoupon, appliedGiftCard } = options;
  const orders: MultiStoreOrderResult['orders'] = [];
  const transactions: MultiStoreOrderResult['transactions'] = [];
  const createdOrderIds: string[] = []; // Pour le rollback en cas d'échec

  // 🆕 Générer un group_id unique pour ce checkout multi-stores
  const groupId = `multi-store-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  try {
    // Récupérer les noms des stores pour améliorer l'affichage
    const storeIds = Array.from(storeGroups.keys());
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .in('id', storeIds);

    const storeNameMap = new Map<string, string>();
    stores?.forEach(store => {
      if (store.name) {
        storeNameMap.set(store.id, store.name);
      }
    });

    // Créer une commande pour chaque boutique avec gestion d'erreur par commande
    for (const [storeId, group] of storeGroups.entries()) {
      let orderCreated = false;
      let currentOrderId: string | null = null;

      try {
      // Générer numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}-${storeId.substring(0, 8)}`;

      // Utiliser le nom du store depuis la base de données si disponible
      const storeName = storeNameMap.get(storeId) || group.store_name;

      // Créer la commande avec metadata multi_store et group_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          total_amount: group.total,
          currency: 'XOF',
          payment_status: 'pending',
          status: 'pending',
          shipping_address: shippingAddress,
          metadata: {
            multi_store: true,
            group_id: groupId,
            total_stores: storeGroups.size,
            store_index: Array.from(storeGroups.keys()).indexOf(storeId) + 1,
          },
        })
        .select()
        .single();

        if (orderError) {
          logger.error(`Error creating order for store ${storeId}:`, orderError);
          throw new Error(`Impossible de créer la commande pour la boutique ${storeId}`);
        }

        orderCreated = true;
        currentOrderId = order.id;
        createdOrderIds.push(order.id);

        // Créer les order_items
        const orderItems = group.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_type: item.product_type,
          product_name: item.product_name,
          product_image_url: item.product_image_url,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          total_price: (item.unit_price - (item.discount_amount || 0)) * item.quantity,
          item_metadata: {},
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          logger.error(`Error creating order items for order ${order.id}:`, itemsError);
          // Rollback: supprimer la commande créée
          if (currentOrderId) {
            await supabase.from('orders').delete().eq('id', currentOrderId);
            createdOrderIds.pop();
          }
          throw new Error(`Impossible de créer les articles de commande pour ${orderNumber}`);
        }

        // Appliquer le coupon si spécifique à cette boutique
        if (appliedCoupon && (!appliedCoupon.storeId || appliedCoupon.storeId === storeId)) {
          try {
            // Récupérer le customer_id pour cette boutique si nécessaire
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('store_id', storeId)
              .eq('email', customerEmail)
              .single();

            if (customer?.id) {
              await supabase.rpc('apply_coupon_to_order' as any, {
                p_coupon_id: appliedCoupon.id,
                p_order_id: order.id,
                p_customer_id: customer.id,
                p_discount_amount: appliedCoupon.discountAmount,
              });
              logger.log(`Coupon applied to order ${order.id}`, { couponId: appliedCoupon.id });
            }
          } catch (couponError) {
            logger.error(`Error applying coupon to order ${order.id}:`, couponError);
            // Ne pas bloquer la commande si le coupon échoue
          }
        }

        // Rédimer la carte cadeau si spécifique à cette boutique
        if (appliedGiftCard && (!appliedGiftCard.storeId || appliedGiftCard.storeId === storeId)) {
          try {
            const giftCardAmount = Math.min(
              appliedGiftCard.balance,
              group.total
            );

            if (giftCardAmount > 0) {
              const { data: redeemResult, error: redeemError } = await supabase.rpc('redeem_gift_card' as any, {
                p_gift_card_id: appliedGiftCard.id,
                p_order_id: order.id,
                p_amount: giftCardAmount,
              });

              if (redeemError) {
                logger.error(`Error redeeming gift card for order ${order.id}:`, redeemError);
              } else {
                logger.log(`Gift card redeemed for order ${order.id}`, { amount: giftCardAmount });
              }
            }
          } catch (giftCardError) {
            logger.error(`Error redeeming gift card for order ${order.id}:`, giftCardError);
            // Ne pas bloquer la commande si la rédemption échoue
          }
        }

        // Créer automatiquement la facture
        try {
          const { data: invoiceId, error: invoiceError } = await supabase.rpc('create_invoice_from_order' as any, {
            p_order_id: order.id,
          });

          if (invoiceError) {
            logger.error(`Error creating invoice for order ${order.id}:`, invoiceError);
          } else {
            logger.log(`Invoice created for order ${order.id}:`, { invoiceId });
          }
        } catch (invoiceErr) {
          logger.error(`Error in invoice creation for order ${order.id}:`, invoiceErr);
          // Ne pas bloquer la commande
        }

        orders.push({
          order_id: order.id,
          order_number: orderNumber,
          store_id: storeId,
          store_name: storeName,
          total_amount: group.total,
          items_count: group.items.length,
        });

        logger.log(`Order created for store ${storeId}:`, {
          order_id: order.id,
          order_number: orderNumber,
          total: group.total,
          items_count: group.items.length,
          store_name: storeName,
        });
      } catch (orderError) {
        // Gérer l'erreur pour cette commande spécifique
        const errorMessage = orderError instanceof Error ? orderError.message : 'Erreur inconnue';
        logger.error(`Failed to create order for store ${storeId}:`, orderError);

        // Si on a créé la commande mais pas les items, rollback
        if (orderCreated && currentOrderId) {
          try {
            await supabase.from('orders').delete().eq('id', currentOrderId);
            createdOrderIds.pop();
            logger.log(`Rolled back order ${currentOrderId} for store ${storeId}`);
          } catch (rollbackError) {
            logger.error(`Failed to rollback order ${currentOrderId}:`, rollbackError);
          }
        }

        // Continuer avec les autres commandes si on en a créé au moins une
        // Sinon, retourner une erreur
        if (orders.length === 0) {
          // Aucune commande créée, retourner une erreur
          throw orderError;
        } else {
          // Certaines commandes ont été créées, continuer mais logger l'erreur
          logger.warn(`Partial failure: Could not create order for store ${storeId}, but ${orders.length} order(s) were created successfully`);
          // Ne pas throw, continuer avec les autres commandes
        }
      }
    }

    // Si au moins une commande a été créée, considérer comme succès partiel
    if (orders.length > 0) {
      return {
        success: true,
        orders,
        transactions: [], // Les transactions seront créées après
      };
    } else {
      // Aucune commande créée
      return {
        success: false,
        orders: [],
        transactions: [],
        error: 'Aucune commande n\'a pu être créée',
      };
    }
  } catch (error) {
    // En cas d'erreur critique, rollback toutes les commandes créées
    if (createdOrderIds.length > 0) {
      logger.warn(`Rolling back ${createdOrderIds.length} order(s) due to critical error`);
      try {
        await supabase.from('orders').delete().in('id', createdOrderIds);
        logger.log(`Rolled back ${createdOrderIds.length} order(s)`);
      } catch (rollbackError) {
        logger.error('Failed to rollback orders:', rollbackError);
        // Ne pas throw, on a déjà une erreur principale
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error creating multi-store orders:', error);
    return {
      success: false,
      orders: [],
      transactions: [],
      error: errorMessage,
    };
  }
}

/**
 * Crée les transactions de paiement pour chaque commande
 */
export async function createMultiStoreTransactions(
  orders: MultiStoreOrderResult['orders'],
  options: {
    provider: 'moneroo' | 'paydunya';
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    metadata?: Record<string, unknown>;
    affiliateInfo?: {
      affiliate_link_id: string | null;
      affiliate_id: string | null;
      product_id: string | null;
      tracking_cookie: string | null;
    };
  }
): Promise<MultiStoreOrderResult['transactions']> {
  const { provider, customerEmail, customerName, customerPhone, metadata = {}, affiliateInfo } = options;
  const transactions: MultiStoreOrderResult['transactions'] = [];
  const failedOrders: Array<{ order_id: string; order_number: string; error: string }> = [];

  try {
    // Importer dynamiquement le service de paiement approprié
    const { initiatePayment } = await import('./payment-service');

    // Créer les transactions avec gestion d'erreur individuelle
    for (const order of orders) {
      try {
        // Préparer les metadata avec les infos d'affiliation si disponibles
        const transactionMetadata: Record<string, unknown> = {
          ...metadata,
          order_number: order.order_number,
          items_count: order.items_count,
          store_name: order.store_name,
        };

        // Ajouter les infos d'affiliation si disponibles
        // Le tracking_cookie est crucial pour que les triggers SQL fonctionnent
        if (affiliateInfo?.tracking_cookie) {
          transactionMetadata.tracking_cookie = affiliateInfo.tracking_cookie;
          if (affiliateInfo.affiliate_link_id) {
            transactionMetadata.affiliate_link_id = affiliateInfo.affiliate_link_id;
          }
          if (affiliateInfo.affiliate_id) {
            transactionMetadata.affiliate_id = affiliateInfo.affiliate_id;
          }
          if (affiliateInfo.product_id) {
            transactionMetadata.product_id = affiliateInfo.product_id;
          }
          logger.log(`Adding affiliate tracking to transaction for order ${order.order_id}`, {
            tracking_cookie: affiliateInfo.tracking_cookie,
            affiliate_id: affiliateInfo.affiliate_id,
          });
        }

        const paymentResult = await initiatePayment({
          storeId: order.store_id,
          orderId: order.order_id,
          customerId: metadata.customerId as string,
          amount: order.total_amount,
          currency: 'XOF',
          description: `Commande ${order.order_number} - ${order.items_count} article(s)`,
          customerEmail,
          customerName,
          customerPhone,
          provider,
          metadata: transactionMetadata,
        });

        if (paymentResult.success && paymentResult.transaction_id) {
          transactions.push({
            transaction_id: paymentResult.transaction_id,
            order_id: order.order_id,
            store_id: order.store_id,
            amount: order.total_amount,
            provider,
            checkout_url: paymentResult.checkout_url,
          });
          logger.log(`Transaction created for order ${order.order_id}`, {
            transaction_id: paymentResult.transaction_id,
            provider,
          });
        } else {
          const errorMsg = paymentResult.error || 'Erreur inconnue lors de la création de la transaction';
          logger.error(`Failed to create transaction for order ${order.order_id}:`, errorMsg);
          failedOrders.push({
            order_id: order.order_id,
            order_number: order.order_number,
            error: errorMsg,
          });
          // Ne pas throw, continuer avec les autres commandes
        }
      } catch (transactionError) {
        const errorMsg = transactionError instanceof Error ? transactionError.message : 'Erreur inconnue';
        logger.error(`Error creating transaction for order ${order.order_id}:`, transactionError);
        failedOrders.push({
          order_id: order.order_id,
          order_number: order.order_number,
          error: errorMsg,
        });
        // Ne pas throw, continuer avec les autres commandes
      }
    }

    // Logger les résultats
    if (failedOrders.length > 0) {
      logger.warn(`Partial transaction creation: ${transactions.length} succeeded, ${failedOrders.length} failed`, {
        failedOrders: failedOrders.map(f => ({ order_number: f.order_number, error: f.error })),
      });
    }

    // Si au moins une transaction a été créée, retourner les transactions créées
    // Les commandes sans transaction pourront être payées plus tard depuis la page de résumé
    return transactions;
  } catch (error) {
    logger.error('Error creating multi-store transactions:', error);
    // Retourner les transactions créées jusqu'à présent plutôt que de throw
    // Cela permet à l'utilisateur de payer au moins certaines commandes
    return transactions;
  }
}

/**
 * Fonction principale pour créer des commandes multi-stores
 */
export async function processMultiStoreCheckout(
  items: CartItem[],
  options: CreateMultiStoreOrderOptions & {
    paymentProvider: 'moneroo' | 'paydunya';
    customerName: string;
    customerPhone: string;
  }
): Promise<MultiStoreOrderResult> {
  try {
    // 1. Grouper les items par boutique
    const { storeGroups, skippedItems } = await groupItemsByStore(items);

    // Si tous les produits ont été ignorés
    if (storeGroups.size === 0) {
      if (skippedItems.length > 0) {
        const productNames = skippedItems.map(item => item.product_name).join(', ');
        return {
          success: false,
          orders: [],
          transactions: [],
          error: `Aucun produit valide trouvé. Les produits suivants n'ont pas de boutique associée : ${productNames}`,
        };
      }
      return {
        success: false,
        orders: [],
        transactions: [],
        error: 'Aucun produit valide trouvé',
      };
    }

    // Si certains produits ont été ignorés, créer un avertissement
    let warningMessage: string | undefined;
    if (skippedItems.length > 0) {
      const productNames = skippedItems.map(item => `${item.product_name} (x${item.quantity})`).join(', ');
      warningMessage = `${skippedItems.length} produit(s) ignoré(s) car ils n'ont pas de boutique associée : ${productNames}. Veuillez contacter le support si vous pensez que c'est une erreur.`;
      logger.warn('Some products were skipped during multi-store checkout', {
        skippedCount: skippedItems.length,
        skippedProducts: skippedItems,
      });
    }

    // 2. Calculer les totaux pour chaque boutique
    const calculatedGroups = calculateStoreTotals(storeGroups, {
      taxRate: options.taxRate,
      shippingAmount: options.shippingAmount,
      appliedCoupon: options.appliedCoupon,
      appliedGiftCard: options.appliedGiftCard,
    });

    // 3. Créer les commandes pour chaque boutique
    const orderResult = await createMultiStoreOrders(calculatedGroups, options);

    if (!orderResult.success) {
      return orderResult;
    }

    // 4. Créer les transactions de paiement (même si certaines échouent)
    // Inclure les infos d'affiliation si disponibles
    const transactions = await createMultiStoreTransactions(orderResult.orders, {
      provider: options.paymentProvider,
      customerEmail: options.customerEmail,
      customerName: options.customerName,
      customerPhone: options.customerPhone,
      metadata: {
        customerId: options.customerId,
        multi_store: true,
        total_stores: orderResult.orders.length,
      },
      affiliateInfo: options.affiliateInfo,
    });

    // Si certaines transactions n'ont pas pu être créées, ce n'est pas bloquant
    // L'utilisateur pourra les créer depuis la page de résumé
    const result: MultiStoreOrderResult = {
      success: true,
      orders: orderResult.orders,
      transactions,
    };

    // Combiner les avertissements si nécessaire
    const warnings: string[] = [];
    
    if (warningMessage) {
      warnings.push(warningMessage);
    }
    
    if (transactions.length < orderResult.orders.length) {
      warnings.push(`${orderResult.orders.length - transactions.length} transaction(s) n'a/n'ont pas pu être créée(s). Vous pourrez les créer depuis la page de résumé.`);
      logger.warn(`Partial transaction creation: ${transactions.length}/${orderResult.orders.length} transactions created`);
    }

    if (warnings.length > 0) {
      result.warning = warnings.join(' | ');
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error processing multi-store checkout:', error);
    return {
      success: false,
      orders: [],
      transactions: [],
      error: errorMessage,
    };
  }
}


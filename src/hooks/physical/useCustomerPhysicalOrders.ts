/**
 * Customer Physical Orders Hooks
 * Date: 2025-01-27
 * 
 * Hooks pour récupérer les commandes de produits physiques d'un client
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface CustomerPhysicalOrder {
  id: string;
  order_number: string;
  store_id: string;
  customer_id: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  status: string;
  shipping_address: Record<string, any>;
  created_at: string;
  delivered_at?: string;
  order_items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_image_url?: string;
    variant_id?: string;
    variant_name?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shipments?: Array<{
    id: string;
    tracking_number?: string;
    tracking_url?: string;
    status: string;
    carrier_name?: string;
    estimated_delivery?: string;
    actual_delivery?: string;
  }>;
  returns?: Array<{
    id: string;
    return_number: string;
    status: string;
    return_reason: string;
    requested_at: string;
  }>;
}

/**
 * Liste toutes les commandes de produits physiques du client connecté
 */
export const useCustomerPhysicalOrders = () => {
  return useQuery({
    queryKey: ['customerPhysicalOrders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('useCustomerPhysicalOrders: User not authenticated.');
        return [];
      }

      // Récupérer le customer_id pour l'utilisateur
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerError || !customerData) {
        logger.error('useCustomerPhysicalOrders: Error fetching customer ID or customer not found.', { customerError });
        return [];
      }

      const customerId = customerData.id;

      // Récupérer les commandes avec produits physiques
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          store_id,
          customer_id,
          total_amount,
          currency,
          payment_status,
          status,
          shipping_address,
          created_at,
          delivered_at,
          order_items (
            id,
            product_id,
            quantity,
            price,
            variant_id,
            products (
              id,
              name,
              image_url,
              product_type
            ),
            physical_product_variants (
              id,
              name
            )
          )
        `)
        .eq('customer_id', customerId)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (ordersError) {
        logger.error('useCustomerPhysicalOrders: Error fetching orders.', { ordersError });
        throw ordersError;
      }

      // Filtrer pour ne garder que les commandes avec produits physiques
      const physicalOrders = (orders || []).filter((order: any) => {
        return order.order_items?.some((item: any) => 
          item.products?.product_type === 'physical'
        );
      });

      // Pour chaque commande, récupérer les shipments et returns
      const ordersWithDetails = await Promise.all(
        physicalOrders.map(async (order: any) => {
          // Récupérer les shipments
          const { data: shipments } = await supabase
            .from('shipments')
            .select('id, tracking_number, tracking_url, status, carrier_id, estimated_delivery, actual_delivery')
            .eq('order_id', order.id);

          // Récupérer le nom du carrier si disponible
          const shipmentsWithCarrier = await Promise.all(
            (shipments || []).map(async (shipment: any) => {
              if (shipment.carrier_id) {
                const { data: carrier } = await supabase
                  .from('shipping_carriers')
                  .select('name, code')
                  .eq('id', shipment.carrier_id)
                  .single();

                return {
                  ...shipment,
                  carrier_name: carrier?.name || carrier?.code || undefined,
                };
              }
              return shipment;
            })
          );

          // Récupérer les returns
          const { data: returns } = await supabase
            .from('product_returns')
            .select('id, return_number, status, return_reason, requested_at')
            .eq('order_id', order.id)
            .order('requested_at', { ascending: false });

          return {
            id: order.id,
            order_number: order.order_number || order.id,
            store_id: order.store_id,
            customer_id: order.customer_id,
            total_amount: order.total_amount,
            currency: order.currency || 'XOF',
            payment_status: order.payment_status,
            status: order.status,
            shipping_address: order.shipping_address || {},
            created_at: order.created_at,
            delivered_at: order.delivered_at,
            order_items: (order.order_items || []).map((item: any) => ({
              id: item.id,
              product_id: item.product_id,
              product_name: item.products?.name || 'Produit inconnu',
              product_image_url: item.products?.image_url,
              variant_id: item.variant_id,
              variant_name: item.physical_product_variants?.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
            shipments: shipmentsWithCarrier,
            returns: returns || [],
          } as CustomerPhysicalOrder;
        })
      );

      return ordersWithDetails;
    },
  });
};

/**
 * Récupère une commande spécifique avec tous ses détails
 */
export const useCustomerPhysicalOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['customerPhysicalOrder', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID manquant');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le customer_id
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customerData) throw new Error('Client non trouvé');

      // Récupérer la commande
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*),
            physical_product_variants (*)
          )
        `)
        .eq('id', orderId)
        .eq('customer_id', customerData.id)
        .single();

      if (error) throw error;

      // Récupérer shipments et returns
      const { data: shipments } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', orderId);

      const { data: returns } = await supabase
        .from('product_returns')
        .select('*')
        .eq('order_id', orderId);

      return {
        ...order,
        shipments: shipments || [],
        returns: returns || [],
      };
    },
    enabled: !!orderId,
  });
};





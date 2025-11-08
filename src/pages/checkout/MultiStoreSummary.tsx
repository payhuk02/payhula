/**
 * Page de résumé multi-commandes
 * Affiche toutes les commandes créées lors d'un checkout multi-stores
 * Permet de payer chaque commande séparément
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { safeRedirect } from '@/lib/url-validator';
import { logger } from '@/lib/logger';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Package,
  Store,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OrderSummary {
  order_id: string;
  order_number: string;
  store_id: string;
  store_name?: string;
  total_amount: number;
  items_count: number;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_id?: string;
  checkout_url?: string;
  provider?: 'moneroo' | 'paydunya';
  created_at: string;
}

export default function MultiStoreSummary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const orderIds = searchParams.get('orders')?.split(',') || [];
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const [processingAllPayments, setProcessingAllPayments] = useState(false);

  // Fonction pour récupérer les détails des commandes
  const fetchOrders = async () => {
    if (orderIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // 🔒 SÉCURITÉ: Vérifier que l'utilisateur est connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logger.error('User not authenticated', authError);
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour accéder à vos commandes',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // 🔒 SÉCURITÉ: Récupérer les commandes et vérifier que toutes appartiennent à l'utilisateur
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          store_id,
          customer_id,
          total_amount,
          payment_status,
          created_at,
          stores!inner(name)
        `)
        .in('id', orderIds)
        .eq('customer_id', user.id); // 🔒 Filtrer uniquement les commandes de l'utilisateur

      if (error) {
        logger.error('Error fetching orders:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les commandes',
          variant: 'destructive',
        });
        return;
      }

      // 🔒 SÉCURITÉ: Vérifier que toutes les commandes demandées ont été trouvées
      // Si certaines commandes n'ont pas été trouvées, c'est qu'elles n'appartiennent pas à l'utilisateur
      if (!ordersData || ordersData.length !== orderIds.length) {
        logger.warn('Security: Some orders not found or do not belong to user', {
          requested: orderIds.length,
          found: ordersData?.length || 0,
          userId: user.id,
        });
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'avez pas accès à certaines commandes demandées',
          variant: 'destructive',
        });
        navigate('/account/orders');
        return;
      }

      // Récupérer les transactions associées
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('id, order_id, status, checkout_url, payment_provider')
        .in('order_id', orderIds);

      // Récupérer le nombre d'items pour chaque commande
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('order_id')
        .in('order_id', orderIds);

      const transactionMap = new Map(
        transactionsData?.map(t => [t.order_id, t]) || []
      );

      // Compter les items par commande
      const itemsCountMap = new Map<string, number>();
      orderItemsData?.forEach(item => {
        itemsCountMap.set(item.order_id, (itemsCountMap.get(item.order_id) || 0) + 1);
      });

      const ordersWithDetails: OrderSummary[] = (ordersData || []).map((order: any) => {
        const transaction = transactionMap.get(order.id);
        return {
          order_id: order.id,
          order_number: order.order_number,
          store_id: order.store_id,
          store_name: order.stores?.name,
          total_amount: order.total_amount,
          items_count: itemsCountMap.get(order.id) || 0,
          payment_status: order.payment_status as OrderSummary['payment_status'],
          transaction_id: transaction?.id,
          checkout_url: transaction?.checkout_url || undefined,
          provider: transaction?.payment_provider as 'moneroo' | 'paydunya' | undefined,
          created_at: order.created_at,
        };
      });

      setOrders(ordersWithDetails);
    } catch (error) {
      logger.error('Error in fetchOrders:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les détails des commandes au chargement
  useEffect(() => {
    fetchOrders();
  }, [orderIds, toast]);

  // 🆕 Abonnement en temps réel aux changements des commandes et transactions
  useEffect(() => {
    if (orderIds.length === 0) return;

    // Canal pour les commandes
    const ordersChannel = supabase
      .channel(`multi-store-orders-${orderIds.join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=in.(${orderIds.join(',')})`,
        },
        (payload) => {
          logger.log('🔔 Order status updated in real-time:', payload);
          
          // Mettre à jour le statut de la commande
          setOrders(prev => prev.map(order => {
            if (order.order_id === payload.new.id) {
              const updatedOrder = { ...order };
              
              // Mapper le statut de payment_status
              if (payload.new.payment_status) {
                updatedOrder.payment_status = payload.new.payment_status as OrderSummary['payment_status'];
              }
              
              // Afficher une notification si le statut change vers "completed"
              if (payload.old?.payment_status !== 'completed' && payload.new.payment_status === 'completed') {
                toast({
                  title: 'Paiement réussi !',
                  description: `La commande ${payload.new.order_number} a été payée avec succès`,
                });
              }
              
              // Afficher une notification si le statut change vers "failed"
              if (payload.old?.payment_status !== 'failed' && payload.new.payment_status === 'failed') {
                toast({
                  title: 'Paiement échoué',
                  description: `Le paiement de la commande ${payload.new.order_number} a échoué`,
                  variant: 'destructive',
                });
              }
              
              return updatedOrder;
            }
            return order;
          }));
        }
      )
      .subscribe();

    // Canal pour les transactions
    const transactionsChannel = supabase
      .channel(`multi-store-transactions-${orderIds.join('-')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `order_id=in.(${orderIds.join(',')})`,
        },
        (payload) => {
          logger.log('🔔 Transaction updated in real-time:', payload);
          
          // Mettre à jour les informations de transaction
          setOrders(prev => prev.map(order => {
            if (order.order_id === (payload.new as any).order_id) {
              return {
                ...order,
                transaction_id: (payload.new as any).id,
                checkout_url: (payload.new as any).checkout_url || order.checkout_url,
                provider: (payload.new as any).payment_provider as 'moneroo' | 'paydunya' | undefined,
              };
            }
            return order;
          }));
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [orderIds, toast]);

  // Rafraîchir les statuts des commandes (manuel)
  const refreshOrders = async () => {
    setLoading(true);
    await fetchOrders();
  };

  // Payer une commande
  const handlePayOrder = async (order: OrderSummary) => {
    setProcessingPayments(prev => new Set(prev).add(order.order_id));

    try {
      // Si la transaction n'existe pas ou n'a pas d'URL, créer une nouvelle transaction
      if (!order.checkout_url) {
        // Récupérer les informations nécessaires pour créer le paiement
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          toast({
            title: 'Authentification requise',
            description: 'Veuillez vous connecter pour continuer',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        // 🔒 SÉCURITÉ: Vérifier que la commande appartient à l'utilisateur
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('shipping_address, customer_id')
          .eq('id', order.order_id)
          .eq('customer_id', user.id) // 🔒 Vérifier que la commande appartient à l'utilisateur
          .single();

        if (orderError || !orderData) {
          logger.error('Security: Order not found or does not belong to user', {
            orderId: order.order_id,
            userId: user.id,
            error: orderError,
          });
          toast({
            title: 'Accès refusé',
            description: 'Vous n\'avez pas accès à cette commande',
            variant: 'destructive',
          });
          navigate('/account/orders');
          return;
        }

        // Créer une nouvelle transaction de paiement
        const { initiatePayment } = await import('@/lib/payment-service');
        const { getAffiliateInfo } = await import('@/lib/affiliation-tracking');
        
        // Déterminer le provider (par défaut Moneroo)
        const provider = order.provider || 'moneroo';

        // Récupérer les infos d'affiliation si disponibles
        const affiliateInfo = await getAffiliateInfo();

        const shippingAddress = orderData.shipping_address as {
          email?: string;
          full_name?: string;
          phone?: string;
        };

        // Préparer les metadata avec les infos d'affiliation
        const transactionMetadata: Record<string, unknown> = {
          order_number: order.order_number,
          items_count: order.items_count,
          store_name: order.store_name,
          multi_store: true,
        };

        // Ajouter les infos d'affiliation si disponibles
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
          customerId: orderData.customer_id || user.id,
          amount: order.total_amount,
          currency: 'XOF',
          description: `Commande ${order.order_number} - ${order.items_count} article(s)`,
          customerEmail: shippingAddress?.email || user.email || '',
          customerName: shippingAddress?.full_name || user.user_metadata?.full_name || '',
          customerPhone: shippingAddress?.phone || '',
          provider,
          metadata: transactionMetadata,
        });

        if (paymentResult.success && paymentResult.checkout_url) {
          // Mettre à jour l'ordre localement
          setOrders(prev => prev.map(o => 
            o.order_id === order.order_id 
              ? { ...o, checkout_url: paymentResult.checkout_url, transaction_id: paymentResult.transaction_id, provider }
              : o
          ));

          // Rediriger vers l'URL de paiement
          safeRedirect(paymentResult.checkout_url, () => {
            toast({
              title: 'Erreur',
              description: 'URL de paiement invalide',
              variant: 'destructive',
            });
          });
        } else {
          throw new Error(paymentResult.error || 'Impossible de créer le paiement');
        }
      } else {
        // Rediriger vers l'URL de paiement existante
        safeRedirect(order.checkout_url, () => {
          toast({
            title: 'Erreur',
            description: 'URL de paiement invalide',
            variant: 'destructive',
          });
        });
      }
    } catch (error) {
      logger.error('Error paying order:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de procéder au paiement',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.order_id);
        return newSet;
      });
    }
  };

  // 🆕 Payer toutes les commandes en attente
  const handlePayAllOrders = async () => {
    const pendingOrders = orders.filter(o => 
      o.payment_status === 'pending' || o.payment_status === 'processing'
    );

    if (pendingOrders.length === 0) {
      toast({
        title: 'Information',
        description: 'Aucune commande en attente de paiement',
      });
      return;
    }

    setProcessingAllPayments(true);

    try {
      // 🔒 SÉCURITÉ: Vérifier que l'utilisateur est connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour continuer',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Récupérer les infos d'affiliation une seule fois pour toutes les commandes
      const { getAffiliateInfo } = await import('@/lib/affiliation-tracking');
      const affiliateInfo = await getAffiliateInfo();

      const { initiatePayment } = await import('@/lib/payment-service');
      const paymentPromises = pendingOrders.map(async (order) => {
        try {
          // 🔒 SÉCURITÉ: Vérifier que la commande appartient à l'utilisateur
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('shipping_address, customer_id')
            .eq('id', order.order_id)
            .eq('customer_id', user.id) // 🔒 Vérifier que la commande appartient à l'utilisateur
            .single();

          if (orderError || !orderData) {
            logger.error('Security: Order not found or does not belong to user', {
              orderId: order.order_id,
              userId: user.id,
              error: orderError,
            });
            throw new Error(`Commande ${order.order_number} non trouvée ou accès refusé`);
          }

          const shippingAddress = orderData.shipping_address as {
            email?: string;
            full_name?: string;
            phone?: string;
          };

          const provider = order.provider || 'moneroo';

          // Préparer les metadata avec les infos d'affiliation
          const transactionMetadata: Record<string, unknown> = {
            order_number: order.order_number,
            items_count: order.items_count,
            store_name: order.store_name,
            multi_store: true,
            grouped_payment: true,
          };

          // Ajouter les infos d'affiliation si disponibles
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
            logger.log(`Adding affiliate tracking to grouped payment for order ${order.order_id}`, {
              tracking_cookie: affiliateInfo.tracking_cookie,
              affiliate_id: affiliateInfo.affiliate_id,
            });
          }

          const paymentResult = await initiatePayment({
            storeId: order.store_id,
            orderId: order.order_id,
            customerId: orderData.customer_id || user.id,
            amount: order.total_amount,
            currency: 'XOF',
            description: `Commande ${order.order_number} - ${order.items_count} article(s)`,
            customerEmail: shippingAddress?.email || user.email || '',
            customerName: shippingAddress?.full_name || user.user_metadata?.full_name || '',
            customerPhone: shippingAddress?.phone || '',
            provider,
            metadata: transactionMetadata,
          });

          if (paymentResult.success && paymentResult.checkout_url) {
            // Mettre à jour l'ordre localement
            setOrders(prev => prev.map(o => 
              o.order_id === order.order_id 
                ? { ...o, checkout_url: paymentResult.checkout_url, transaction_id: paymentResult.transaction_id, provider }
                : o
            ));

            return { order_id: order.order_id, checkout_url: paymentResult.checkout_url, success: true };
          } else {
            throw new Error(paymentResult.error || 'Impossible de créer le paiement');
          }
        } catch (error) {
          logger.error(`Error creating payment for order ${order.order_id}:`, error);
          return { order_id: order.order_id, success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
        }
      });

      const results = await Promise.allSettled(paymentPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      if (successful > 0) {
        // Rediriger vers le premier paiement réussi
        const firstSuccess = results.find(r => 
          r.status === 'fulfilled' && r.value.success
        ) as PromiseFulfilledResult<{ checkout_url: string }> | undefined;

        if (firstSuccess?.value.checkout_url) {
          toast({
            title: 'Paiements créés',
            description: `${successful} paiement(s) créé(s)${failed > 0 ? `, ${failed} échec(s)` : ''}. Redirection vers le premier paiement...`,
          });

          // Attendre un peu avant de rediriger pour que l'utilisateur voie le message
          setTimeout(() => {
            safeRedirect(firstSuccess.value.checkout_url, () => {
              toast({
                title: 'Erreur',
                description: 'URL de paiement invalide',
                variant: 'destructive',
              });
            });
          }, 1000);
        }
      } else {
        toast({
          title: 'Erreur',
          description: 'Aucun paiement n\'a pu être créé',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error in handlePayAllOrders:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de créer les paiements',
        variant: 'destructive',
      });
    } finally {
      setProcessingAllPayments(false);
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: OrderSummary['payment_status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Payée</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Échouée</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  // Calculer les statistiques
  const stats = {
    total: orders.reduce((sum, o) => sum + o.total_amount, 0),
    completed: orders.filter(o => o.payment_status === 'completed').length,
    pending: orders.filter(o => o.payment_status === 'pending' || o.payment_status === 'processing').length,
    failed: orders.filter(o => o.payment_status === 'failed').length,
  };

  if (loading && orders.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (orders.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aucune commande trouvée</AlertTitle>
                <AlertDescription>
                  Aucune commande n'a été trouvée. Vous pouvez retourner au panier pour réessayer.
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/cart')} className="mt-4">
                Retour au panier
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ShoppingBag className="h-8 w-8" />
                    Résumé des commandes
                  </h1>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Temps réel
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {orders.length} commande{orders.length > 1 ? 's' : ''} créée{orders.length > 1 ? 's' : ''} pour {new Set(orders.map(o => o.store_id)).size} boutique{new Set(orders.map(o => o.store_id)).size > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les statuts sont mis à jour automatiquement en temps réel
                </p>
              </div>
              <Button
                variant="outline"
                onClick={refreshOrders}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total</CardDescription>
                  <CardTitle className="text-2xl">{stats.total.toLocaleString('fr-FR')} XOF</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Payées</CardDescription>
                  <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>En attente</CardDescription>
                  <CardTitle className="text-2xl text-orange-600">{stats.pending}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Échouées</CardDescription>
                  <CardTitle className="text-2xl text-red-600">{stats.failed}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Alert si toutes les commandes sont payées */}
            {stats.completed === orders.length && stats.completed > 0 && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  Toutes les commandes sont payées !
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Vous pouvez consulter vos commandes dans votre compte.
                </AlertDescription>
              </Alert>
            )}

            {/* Liste des commandes */}
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.order_id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {order.store_name || `Boutique ${order.store_id.substring(0, 8)}`}
                          </CardTitle>
                          <CardDescription>
                            Commande {order.order_number} • {order.items_count} article{order.items_count > 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.payment_status)}
                        <div className="text-right">
                          <p className="text-2xl font-bold">{order.total_amount.toLocaleString('fr-FR')} XOF</p>
                          {order.provider && (
                            <p className="text-xs text-muted-foreground">
                              {order.provider === 'moneroo' ? 'Moneroo' : 'PayDunya'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Créée le {new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {order.payment_status !== 'completed' && (
                        <Button
                          onClick={() => handlePayOrder(order)}
                          disabled={!order.checkout_url || processingPayments.has(order.order_id)}
                          className="ml-auto"
                        >
                          {processingPayments.has(order.order_id) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Traitement...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Payer maintenant
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                      {order.payment_status === 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/account/orders`)}
                        >
                          Voir la commande
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total général */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Total général</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Montant total de toutes les commandes</span>
                  <span className="text-3xl font-bold text-primary">
                    {stats.total.toLocaleString('fr-FR')} XOF
                  </span>
                </div>
                {stats.pending > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats.pending} commande{stats.pending > 1 ? 's' : ''} en attente de paiement
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/account/orders')}
                className="flex-1 min-w-[150px]"
              >
                Voir toutes mes commandes
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/account/orders/multi-store')}
                className="flex-1 min-w-[150px]"
              >
                Historique multi-stores
              </Button>
              {stats.pending > 0 && (
                <Button
                  onClick={handlePayAllOrders}
                  disabled={processingAllPayments || stats.pending === 0}
                  className="flex-1 min-w-[150px] bg-primary"
                >
                  {processingAllPayments ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payer toutes ({stats.pending})
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => navigate('/marketplace')}
                className="flex-1 min-w-[150px]"
                variant="outline"
              >
                Continuer mes achats
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


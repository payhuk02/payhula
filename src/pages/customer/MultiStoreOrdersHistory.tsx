/**
 * Page d'historique des commandes multi-stores
 * Affiche toutes les commandes multi-stores de l'utilisateur
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Package,
  Store,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ArrowRight,
  Eye,
  Download,
  Menu,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface MultiStoreOrderGroup {
  id: string; // Identifiant unique du groupe (basé sur la date ou un hash)
  orders: Array<{
    order_id: string;
    order_number: string;
    store_id: string;
    store_name?: string;
    total_amount: number;
    items_count: number;
    payment_status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    transaction_id?: string;
    provider?: 'moneroo' | 'paydunya';
  }>;
  total_amount: number;
  stores_count: number;
  created_at: string;
  all_paid: boolean;
  all_failed: boolean;
  has_pending: boolean;
}

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Hamburger Menu - Très visible */}
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50" aria-hidden="true" />
        </button>
        
        {/* Titre avec Icône */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" aria-hidden="true" />
          <h1 className="text-sm sm:text-base font-bold truncate text-gray-900 dark:text-gray-50">
            Commandes Multi-Stores
          </h1>
        </div>
      </div>
    </header>
  );
}

export default function MultiStoreOrdersHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderGroups, setOrderGroups] = useState<MultiStoreOrderGroup[]>([]);

  // Récupérer l'utilisateur actuel
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Récupérer les commandes multi-stores de l'utilisateur
  const fetchMultiStoreOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les commandes de l'utilisateur avec metadata multi_store
      // Utiliser une jointure LEFT pour éviter les erreurs si certaines commandes n'ont pas de store
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          store_id,
          total_amount,
          payment_status,
          created_at,
          metadata,
          stores(name)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        logger.error('Error fetching multi-store orders:', ordersError);
        setError('Impossible de charger les commandes. Veuillez réessayer plus tard.');
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les commandes',
          variant: 'destructive',
        });
        setOrderGroups([]);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrderGroups([]);
        setError(null);
        return;
      }

      // Filtrer les commandes multi-stores (celles avec metadata.multi_store = true)
      const multiStoreOrders = ordersData.filter((order: any) => {
        try {
          let metadata = order.metadata;
          
          // Parser les metadata si c'est une string
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              // Si le parsing échoue, ce n'est probablement pas une commande multi-store
              return false;
            }
          }
          
          // Vérifier si c'est une commande multi-store
          return metadata?.multi_store === true || 
                 metadata?.multi_store === 'true' ||
                 metadata?.is_multi_store === true ||
                 metadata?.is_multi_store === 'true';
        } catch (e) {
          logger.warn('Error parsing metadata for order:', order.id, e);
          return false;
        }
      });

      if (multiStoreOrders.length === 0) {
        setOrderGroups([]);
        setError(null);
        return;
      }

      // Récupérer les transactions associées
      const orderIds = multiStoreOrders.map((o: any) => o.id);
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('id, order_id, status, payment_provider')
        .in('order_id', orderIds);

      const transactionMap = new Map(
        transactionsData?.map(t => [t.order_id, t]) || []
      );

      // Récupérer le nombre d'items pour chaque commande
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('order_id')
        .in('order_id', orderIds);

      const itemsCountMap = new Map<string, number>();
      orderItemsData?.forEach(item => {
        itemsCountMap.set(item.order_id, (itemsCountMap.get(item.order_id) || 0) + 1);
      });

      // Grouper les commandes par date (même jour) ou par metadata.group_id si disponible
      const groupsMap = new Map<string, MultiStoreOrderGroup>();

      multiStoreOrders.forEach((order: any) => {
        const transaction = transactionMap.get(order.id);
        const orderDate = new Date(order.created_at);
        const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Parser les metadata si c'est une string
        let metadata = order.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            metadata = {};
          }
        }
        
        // Utiliser group_id si disponible, sinon utiliser la date
        const groupId = metadata?.group_id || `group-${dateKey}`;

        if (!groupsMap.has(groupId)) {
          groupsMap.set(groupId, {
            id: groupId,
            orders: [],
            total_amount: 0,
            stores_count: 0,
            created_at: order.created_at,
            all_paid: true,
            all_failed: true,
            has_pending: false,
          });
        }

        const group = groupsMap.get(groupId)!;
        group.orders.push({
          order_id: order.id,
          order_number: order.order_number,
          store_id: order.store_id,
          store_name: order.stores?.name,
          total_amount: order.total_amount,
          items_count: itemsCountMap.get(order.id) || 0,
          payment_status: order.payment_status,
          created_at: order.created_at,
          transaction_id: transaction?.id,
          provider: transaction?.payment_provider as 'moneroo' | 'paydunya' | undefined,
        });

        group.total_amount += order.total_amount;
        group.stores_count = new Set([...group.orders.map(o => o.store_id)]).size;
        
        // Mettre à jour les statuts du groupe
        if (order.payment_status !== 'completed') {
          group.all_paid = false;
        }
        if (order.payment_status !== 'failed') {
          group.all_failed = false;
        }
        if (order.payment_status === 'pending' || order.payment_status === 'processing') {
          group.has_pending = true;
        }
      });

      // Convertir en tableau et trier par date
      const groups = Array.from(groupsMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrderGroups(groups);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement';
      logger.error('Error in fetchMultiStoreOrders:', error);
      setError(errorMessage);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      setOrderGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultiStoreOrders();
  }, [user?.id, toast]);

  // Filtrer et rechercher
  const filteredGroups = useMemo(() => {
    let filtered = orderGroups;

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => {
        if (statusFilter === 'pending') return group.has_pending;
        if (statusFilter === 'completed') return group.all_paid;
        if (statusFilter === 'failed') return group.all_failed;
        return true;
      });
    }

    // Filtrer par date
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(group => {
        const groupDate = new Date(group.created_at);
        if (dateFilter === 'today') {
          return groupDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return groupDate >= weekAgo;
        }
        if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return groupDate >= monthAgo;
        }
        if (dateFilter === 'year') {
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return groupDate >= yearAgo;
        }
        return true;
      });
    }

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.orders.some(order =>
          order.order_number.toLowerCase().includes(query) ||
          order.store_name?.toLowerCase().includes(query)
        )
      );
    }

    return filtered;
  }, [orderGroups, statusFilter, dateFilter, searchQuery]);

  // Obtenir le badge de statut pour un groupe
  const getGroupStatusBadge = (group: MultiStoreOrderGroup) => {
    if (group.all_paid) {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Toutes payées</Badge>;
    }
    if (group.all_failed) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Toutes échouées</Badge>;
    }
    if (group.has_pending) {
      return <Badge className="bg-orange-500"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Mixte</Badge>;
  };

  // Obtenir le badge de statut pour une commande
  const getOrderStatusBadge = (status: string) => {
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

  // Statistiques globales
  const stats = useMemo(() => {
    const allOrders = orderGroups.flatMap(g => g.orders);
    return {
      total: orderGroups.length,
      totalAmount: orderGroups.reduce((sum, g) => sum + g.total_amount, 0),
      completed: allOrders.filter(o => o.payment_status === 'completed').length,
      pending: allOrders.filter(o => o.payment_status === 'pending' || o.payment_status === 'processing').length,
      failed: allOrders.filter(o => o.payment_status === 'failed').length,
    };
  }, [orderGroups]);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header - Loading State */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
                <div className="h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse border border-gray-300 dark:border-gray-600" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <Skeleton className="h-5 w-40 sm:w-48" />
                </div>
              </div>
            </header>
            <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
              <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header - Desktop seulement */}
                <div className="hidden lg:block space-y-2">
                  <Skeleton className="h-10 w-80" />
                  <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
                <Skeleton className="h-96" />
              </div>
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
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header avec Hamburger et Icône */}
          <MobileHeader />
          
          {/* Contenu principal */}
          <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
            <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Header - Desktop seulement */}
              <div className="hidden lg:block space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-50">
                  <ShoppingBag className="h-8 w-8 lg:h-10 lg:w-10 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>Historique des commandes multi-stores</span>
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Consultez toutes vos commandes multi-boutiques
                </p>
              </div>

              {/* Message d'erreur */}
              {error && (
                <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Statistiques */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardDescription className="text-xs sm:text-sm">Total groupes</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl text-gray-900 dark:text-gray-50">{stats.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardDescription className="text-xs sm:text-sm">Montant total</CardDescription>
                    <CardTitle className="text-lg sm:text-2xl text-gray-900 dark:text-gray-50 break-words">
                      {stats.totalAmount.toLocaleString('fr-FR')} XOF
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardDescription className="text-xs sm:text-sm">Payées</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl text-green-600 dark:text-green-400">{stats.completed}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardDescription className="text-xs sm:text-sm">En attente</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl text-orange-600 dark:text-orange-400">{stats.pending}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Filtres et recherche */}
              <Card className="border shadow-sm">
                <CardHeader className="pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                    <Filter className="h-5 w-5 text-primary" />
                    Filtres
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Recherche</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par numéro de commande ou boutique..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                      <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                        <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base touch-manipulation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="completed">Payées</SelectItem>
                          <SelectItem value="failed">Échouées</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Période</label>
                      <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                        <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base touch-manipulation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les périodes</SelectItem>
                          <SelectItem value="today">Aujourd'hui</SelectItem>
                          <SelectItem value="week">7 derniers jours</SelectItem>
                          <SelectItem value="month">30 derniers jours</SelectItem>
                          <SelectItem value="year">Cette année</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des groupes de commandes */}
              {error ? null : filteredGroups.length === 0 ? (
                <Alert className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Package className="h-4 w-4" />
                  <AlertDescription className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    {orderGroups.length === 0
                      ? "Vous n'avez aucune commande multi-stores pour le moment."
                      : "Aucune commande ne correspond à vos critères de recherche."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {filteredGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {new Date(group.created_at).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {group.orders.length} commande{group.orders.length > 1 ? 's' : ''} • {group.stores_count} boutique{group.stores_count > 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          {getGroupStatusBadge(group)}
                          <div className="text-right">
                            <p className="text-2xl font-bold">{group.total_amount.toLocaleString('fr-FR')} XOF</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.orders.map((order) => (
                          <div
                            key={order.order_id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Store className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{order.store_name || `Boutique ${order.store_id.substring(0, 8)}`}</p>
                                  {getOrderStatusBadge(order.payment_status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {order.order_number} • {order.items_count} article{order.items_count > 1 ? 's' : ''}
                                </p>
                                {order.provider && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Paiement: {order.provider === 'moneroo' ? 'Moneroo' : 'PayDunya'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-semibold">{order.total_amount.toLocaleString('fr-FR')} XOF</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/account/orders`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Total du groupe: <span className="font-semibold text-foreground">{group.total_amount.toLocaleString('fr-FR')} XOF</span>
                        </div>
                        {group.has_pending && (
                          <Button
                            onClick={() => {
                              const orderIds = group.orders.map(o => o.order_id).join(',');
                              navigate(`/checkout/multi-store-summary?orders=${orderIds}`);
                            }}
                            size="sm"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payer les commandes en attente
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


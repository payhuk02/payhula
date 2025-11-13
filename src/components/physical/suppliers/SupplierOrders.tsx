/**
 * Supplier Orders Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des commandes fournisseurs (création, suivi, réception)
 */

import { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplierOrders, useCreateSupplierOrder, useSuppliers, SupplierOrder } from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Plus, Package, Calendar, DollarSign, Search, X, MoreVertical, Eye, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ORDER_STATUSES: { value: SupplierOrder['status'] | 'all'; label: string; shortLabel: string; color: string; icon?: any }[] = [
  { value: 'all', label: 'Tous', shortLabel: 'Tous', color: 'from-purple-600 to-pink-600' },
  { value: 'draft', label: 'Brouillon', shortLabel: 'Brouillon', color: 'from-gray-600 to-gray-600' },
  { value: 'pending', label: 'En attente', shortLabel: 'Attente', color: 'from-yellow-600 to-orange-600' },
  { value: 'sent', label: 'Envoyée', shortLabel: 'Envoyée', color: 'from-blue-600 to-cyan-600' },
  { value: 'confirmed', label: 'Confirmée', shortLabel: 'Confirmée', color: 'from-green-600 to-emerald-600' },
  { value: 'processing', label: 'En traitement', shortLabel: 'Traitement', color: 'from-purple-600 to-pink-600' },
  { value: 'shipped', label: 'Expédiée', shortLabel: 'Expédiée', color: 'from-indigo-600 to-indigo-600' },
  { value: 'partially_received', label: 'Partiellement reçue', shortLabel: 'Partielle', color: 'from-orange-600 to-orange-600' },
  { value: 'received', label: 'Reçue', shortLabel: 'Reçue', color: 'from-green-600 to-emerald-600' },
  { value: 'cancelled', label: 'Annulée', shortLabel: 'Annulée', color: 'from-red-600 to-rose-600' },
  { value: 'completed', label: 'Terminée', shortLabel: 'Terminée', color: 'from-emerald-600 to-emerald-600' },
];

export default function SupplierOrders() {
  const { store } = useStore();
  const { data: orders, isLoading } = useSupplierOrders(store?.id);
  const { data: suppliers } = useSuppliers(store?.id);
  const createOrder = useCreateSupplierOrder();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SupplierOrder['status'] | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  const [orderItems, setOrderItems] = useState<Array<{
    supplier_product_id?: string;
    product_id?: string;
    variant_id?: string;
    quantity: number;
    unit_cost: number;
  }>>([{ quantity: 1, unit_cost: 0 }]);
  const [notes, setNotes] = useState('');

  // Animations
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const ordersRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders;

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtrer par recherche
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        (order.supplier as any)?.name?.toLowerCase().includes(query) ||
        (order.supplier as any)?.company_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, statusFilter, debouncedSearch]);

  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(order => ['draft', 'pending', 'sent'].includes(order.status)).length;
    const receivedOrders = filteredOrders.filter(order => ['received', 'partially_received', 'completed'].includes(order.status)).length;
    const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      receivedOrders,
      totalAmount,
    };
  }, [filteredOrders]);

  const displayCurrency = useMemo(() => filteredOrders[0]?.currency ?? 'XOF', [filteredOrders]);

  const statsCards = useMemo(() => [
    {
      label: 'Total commandes',
      value: stats.totalOrders.toString(),
      description: 'Toutes les commandes fournisseurs',
      icon: Package,
      gradient: 'from-purple-600 to-pink-600',
      iconGradient: 'from-purple-500/10 to-pink-500/5',
      iconBorder: 'border-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'En cours',
      value: stats.pendingOrders.toString(),
      description: 'Brouillon, en attente ou envoyée',
      icon: Calendar,
      gradient: 'from-amber-500 to-orange-500',
      iconGradient: 'from-amber-500/10 to-orange-500/5',
      iconBorder: 'border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Réceptionnées',
      value: stats.receivedOrders.toString(),
      description: 'Partiellement ou totalement reçues',
      icon: CheckCircle,
      gradient: 'from-green-600 to-emerald-600',
      iconGradient: 'from-green-500/10 to-emerald-500/5',
      iconBorder: 'border-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Total engagements',
      value: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: displayCurrency,
        maximumFractionDigits: 0,
      }).format(stats.totalAmount),
      description: 'Montant cumulé des commandes',
      icon: DollarSign,
      gradient: 'from-blue-600 to-cyan-600',
      iconGradient: 'from-blue-500/10 to-cyan-500/5',
      iconBorder: 'border-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ], [displayCurrency, stats.pendingOrders, stats.receivedOrders, stats.totalAmount, stats.totalOrders]);

  // Gestion du clavier pour la recherche
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setSearchInput('');
      searchInputRef.current?.blur();
    }
  }, []);

  const handleAddItem = useCallback(() => {
    setOrderItems([...orderItems, { quantity: 1, unit_cost: 0 }]);
  }, [orderItems]);

  const handleRemoveItem = useCallback((index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }, [orderItems]);

  const handleUpdateItem = useCallback((index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  }, [orderItems]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !selectedSupplier) {
      toast({
        title: '❌ Erreur',
        description: 'Veuillez sélectionner un fournisseur',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createOrder.mutateAsync({
        storeId: store.id,
        supplierId: selectedSupplier,
        items: orderItems.filter(item => item.quantity > 0 && item.unit_cost > 0),
        notes,
      });
      setIsDialogOpen(false);
      setOrderItems([{ quantity: 1, unit_cost: 0 }]);
      setNotes('');
      setSelectedSupplier('');
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    }
  }, [store?.id, selectedSupplier, orderItems, notes, createOrder, toast]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: SupplierOrder['status']) => {
    try {
      const { error } = await supabase
        .from('supplier_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de la commande a été mis à jour',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  }, [queryClient, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-auto" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Actions */}
      <div
        ref={actionsRef}
        className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 items-stretch sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm flex-1 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher par numéro de commande ou fournisseur..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base touch-manipulation"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted"
                  onClick={() => setSearchInput('')}
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden lg:flex items-center gap-1.5 pointer-events-none">
                <Badge variant="outline" className="text-xs font-mono">
                  ⌘K
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="h-9 sm:h-10 lg:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:scale-105 text-xs sm:text-sm px-4 sm:px-6"
        >
          <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Nouvelle commande</span>
          <span className="sm:hidden">Nouvelle</span>
        </Button>
      </div>

      {/* Stats */}
      <div
        ref={statsRef}
        className="grid gap-2.5 sm:gap-3.5 lg:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardHeader className="pb-2 sm:pb-3 p-2.5 sm:p-3 lg:p-4">
                <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${stat.iconGradient} border ${stat.iconBorder} flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.iconColor}`} />
                  </div>
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2.5 sm:p-3 lg:p-4 pt-0 space-y-1 sm:space-y-1.5">
                <div className={`text-lg xs:text-xl sm:text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Filters as Tabs */}
      <div
        ref={tabsRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as SupplierOrder['status'] | 'all')} className="w-full">
          <div className="relative">
            {/* Indicateur de scroll à gauche (mobile uniquement) */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
            
            {/* Indicateur de scroll à droite (mobile uniquement) */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
            
            <div className="overflow-x-auto scrollbar-hide scroll-smooth -mx-3 sm:-mx-4 lg:mx-0 px-3 sm:px-4 lg:px-0">
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-max min-w-full sm:min-w-0 sm:w-auto inline-flex gap-1 sm:gap-1.5 lg:gap-2">
                {ORDER_STATUSES.map((status) => (
                  <TabsTrigger
                    key={status.value}
                    value={status.value}
                    className="flex-none gap-1 sm:gap-1.5 px-2 sm:px-2.5 lg:px-3 xl:px-4 py-1.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] lg:min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap shrink-0 touch-manipulation"
                  >
                    <span className="hidden lg:inline">{status.label}</span>
                    <span className="lg:hidden">{status.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Orders List */}
      <div
        ref={ordersRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {filteredOrders.length === 0 ? (
          <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center px-3 sm:px-6">
              <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-2">
                {searchInput ? 'Aucune commande trouvée' : 'Aucune commande'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {searchInput
                  ? 'Essayez de modifier votre recherche'
                  : 'Créez une nouvelle commande pour commencer'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm overflow-hidden hidden lg:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto scroll-smooth scrollbar-orders">
                  <Table className="min-w-[800px] w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap min-w-[140px] px-3 sm:px-4">Numéro</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap min-w-[150px] px-3 sm:px-4">Fournisseur</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap min-w-[120px] px-3 sm:px-4">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap min-w-[120px] px-3 sm:px-4">Montant</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap min-w-[160px] px-3 sm:px-4">Statut</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap min-w-[150px] px-3 sm:px-4">Livraison prévue</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap min-w-[80px] px-3 sm:px-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const status = ORDER_STATUSES.find(s => s.value === order.status);
                        return (
                          <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap min-w-[140px] px-3 sm:px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                                  <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                </div>
                                <span className="truncate">{order.order_number}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap min-w-[150px] px-3 sm:px-4">
                              <span className="truncate block">
                                {(order.supplier as any)?.name || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap min-w-[120px] px-3 sm:px-4">
                              {format(new Date(order.order_date), 'dd MMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap min-w-[120px] px-3 sm:px-4">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-semibold">
                                  {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: order.currency || 'XOF',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(order.total_amount)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap min-w-[160px] px-3 sm:px-4">
                              <Select
                                value={order.status}
                                onValueChange={(value: SupplierOrder['status']) =>
                                  handleStatusUpdate(order.id, value)
                                }
                              >
                                <SelectTrigger className="w-full max-w-[160px] h-8 sm:h-9 text-xs sm:text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {ORDER_STATUSES.filter(s => s.value !== 'all').map((s) => (
                                    <SelectItem key={s.value} value={s.value} className="text-xs sm:text-sm">
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap min-w-[150px] px-3 sm:px-4">
                              {order.expected_delivery_date ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span>
                                    {format(new Date(order.expected_delivery_date), 'dd MMM yyyy', { locale: fr })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">Non définie</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap min-w-[80px] px-3 sm:px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem className="text-xs sm:text-sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusUpdate(order.id, 'completed')}
                                    className="text-xs sm:text-sm"
                                    disabled={order.status === 'completed'}
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    Marquer comme terminée
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {filteredOrders.map((order, index) => {
                const status = ORDER_STATUSES.find(s => s.value === order.status);
                return (
                  <Card
                    key={order.id}
                    className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader className="pb-3 px-3 sm:px-4 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg mb-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="truncate">{order.order_number}</span>
                          </CardTitle>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="truncate">{(order.supplier as any)?.name || 'N/A'}</span>
                            <span>•</span>
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{format(new Date(order.order_date), 'dd MMM yyyy', { locale: fr })}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-xs sm:text-sm">
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(order.id, 'completed')}
                              className="text-xs sm:text-sm"
                              disabled={order.status === 'completed'}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Marquer comme terminée
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Montant</span>
                        <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: order.currency || 'XOF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(order.total_amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Statut</span>
                        <Select
                          value={order.status}
                          onValueChange={(value: SupplierOrder['status']) =>
                            handleStatusUpdate(order.id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {ORDER_STATUSES.filter(s => s.value !== 'all').map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {order.expected_delivery_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-muted-foreground">Livraison prévue</span>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{format(new Date(order.expected_delivery_date), 'dd MMM yyyy', { locale: fr })}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Dialog Create Order */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg lg:text-xl">Nouvelle commande fournisseur</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Créez une nouvelle commande auprès d'un fournisseur
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-xs sm:text-sm font-medium">Fournisseur *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id} className="text-xs sm:text-sm">
                        {supplier.name} {supplier.company_name && `(${supplier.company_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-medium">Articles</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8 sm:h-9 text-xs sm:text-sm">
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Ajouter un article</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                </div>

                {orderItems.map((item, index) => (
                  <Card key={index} className="border border-border/50 bg-card/50 backdrop-blur-sm p-3 sm:p-4">
                    <div className="space-y-3 sm:space-y-0">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2">
                        <div className="col-span-1 sm:col-span-5 space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">Produit / SKU</Label>
                          <Input
                            placeholder="ID produit ou SKU"
                            value={item.product_id || item.supplier_product_id || ''}
                            onChange={(e) =>
                              handleUpdateItem(index, item.product_id ? 'product_id' : 'supplier_product_id', e.target.value)
                            }
                            className="text-xs sm:text-sm h-9 sm:h-10"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2 space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)
                            }
                            className="text-xs sm:text-sm h-9 sm:h-10"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-3 space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">Coût unitaire</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_cost}
                            onChange={(e) =>
                              handleUpdateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)
                            }
                            className="text-xs sm:text-sm h-9 sm:h-10"
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2 space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">Total</Label>
                          <div className="flex items-center h-9 sm:h-10 px-3 bg-muted/50 rounded-md text-xs sm:text-sm font-medium">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(item.quantity * item.unit_cost)}
                          </div>
                        </div>
                      </div>
                      {orderItems.length > 1 && (
                        <div className="flex justify-end pt-2 border-t border-border/50 sm:pt-0 sm:border-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 sm:h-9 w-full sm:w-auto px-3 text-xs sm:text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-0" />
                            <span className="sm:hidden">Supprimer cet article</span>
                            <span className="hidden sm:inline">×</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                <div className="flex justify-between sm:justify-end items-center pt-3 sm:pt-2 border-t border-border/50">
                  <span className="text-sm sm:text-base font-medium text-muted-foreground sm:hidden">Total:</span>
                  <div className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Total: {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(
                      orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes supplémentaires sur la commande..."
                  className="text-xs sm:text-sm resize-none"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                Annuler
              </Button>
              <Button type="submit" disabled={createOrder.isPending} className="w-full sm:w-auto h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 hover:scale-105 text-xs sm:text-sm">
                {createOrder.isPending ? 'Création...' : 'Créer la commande'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

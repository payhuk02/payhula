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
import { Plus, Package, Calendar, DollarSign, Search, X, MoreVertical, Eye } from 'lucide-react';
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

const ORDER_STATUSES: { value: SupplierOrder['status'] | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Tous', color: 'from-purple-600 to-pink-600' },
  { value: 'draft', label: 'Brouillon', color: 'from-gray-600 to-gray-600' },
  { value: 'pending', label: 'En attente', color: 'from-yellow-600 to-orange-600' },
  { value: 'sent', label: 'Envoyée', color: 'from-blue-600 to-cyan-600' },
  { value: 'confirmed', label: 'Confirmée', color: 'from-green-600 to-emerald-600' },
  { value: 'processing', label: 'En traitement', color: 'from-purple-600 to-pink-600' },
  { value: 'shipped', label: 'Expédiée', color: 'from-indigo-600 to-indigo-600' },
  { value: 'partially_received', label: 'Partiellement reçue', color: 'from-orange-600 to-orange-600' },
  { value: 'received', label: 'Reçue', color: 'from-green-600 to-emerald-600' },
  { value: 'cancelled', label: 'Annulée', color: 'from-red-600 to-rose-600' },
  { value: 'completed', label: 'Terminée', color: 'from-emerald-600 to-emerald-600' },
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
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher par numéro de commande ou fournisseur..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-9 h-10 sm:h-11 text-sm"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchInput('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-1.5 pointer-events-none">
            <Badge variant="outline" className="text-xs font-mono">
              ⌘K
            </Badge>
          </div>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle commande</span>
          <span className="sm:hidden">Nouvelle</span>
        </Button>
      </div>

      {/* Status Filters as Tabs */}
      <div
        ref={tabsRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as SupplierOrder['status'] | 'all')} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-max min-w-full sm:w-auto sm:min-w-0 inline-flex">
              {ORDER_STATUSES.map((status) => (
                <TabsTrigger
                  key={status.value}
                  value={status.value}
                  className="flex-none gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap"
                >
                  {status.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Orders List */}
      <div
        ref={ordersRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {filteredOrders.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                {searchInput ? 'Aucune commande trouvée' : 'Aucune commande'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {searchInput
                  ? 'Essayez de modifier votre recherche'
                  : 'Créez une nouvelle commande pour commencer'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Numéro</TableHead>
                    <TableHead className="text-xs sm:text-sm">Fournisseur</TableHead>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Montant</TableHead>
                    <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                    <TableHead className="text-xs sm:text-sm">Livraison prévue</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const status = ORDER_STATUSES.find(s => s.value === order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs sm:text-sm font-medium">{order.order_number}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {(order.supplier as any)?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {format(new Date(order.order_date), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: order.currency || 'XOF',
                            }).format(order.total_amount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <Select
                            value={order.status}
                            onValueChange={(value: SupplierOrder['status']) =>
                              handleStatusUpdate(order.id, value)
                            }
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.filter(s => s.value !== 'all').map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {order.expected_delivery_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(order.expected_delivery_date), 'dd MMM yyyy', { locale: fr })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Non définie</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'completed')}>
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredOrders.map((order) => {
                const status = ORDER_STATUSES.find(s => s.value === order.status);
                return (
                  <Card
                    key={order.id}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                              <h3 className="font-medium text-sm sm:text-base truncate">
                                {order.order_number}
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {(order.supplier as any)?.name || 'N/A'}
                            </p>
                          </div>
                          <Badge variant={status?.value === 'all' ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {status?.label || order.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">
                            {format(new Date(order.order_date), 'PPP', { locale: fr })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: order.currency || 'XOF',
                            }).format(order.total_amount)}
                          </span>
                        </div>

                        {order.expected_delivery_date && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                              Livraison: {format(new Date(order.expected_delivery_date), 'PPP', { locale: fr })}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                          <Select
                            value={order.status}
                            onValueChange={(value: SupplierOrder['status']) =>
                              handleStatusUpdate(order.id, value)
                            }
                          >
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.filter(s => s.value !== 'all').map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Nouvelle commande fournisseur</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Créez une nouvelle commande auprès d'un fournisseur
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-xs sm:text-sm">Fournisseur *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.company_name && `(${supplier.company_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm">Articles</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="text-xs sm:text-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un article
                  </Button>
                </div>

                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="col-span-1 sm:col-span-4">
                      <Label className="text-xs sm:text-sm">Produit / SKU</Label>
                      <Input
                        placeholder="ID produit ou SKU"
                        value={item.product_id || item.supplier_product_id || ''}
                        onChange={(e) =>
                          handleUpdateItem(index, item.product_id ? 'product_id' : 'supplier_product_id', e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                      <Label className="text-xs sm:text-sm">Coût unitaire</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost}
                        onChange={(e) =>
                          handleUpdateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-xs sm:text-sm">Total</Label>
                      <Input
                        value={(item.quantity * item.unit_cost).toFixed(2)}
                        disabled
                        className="bg-muted text-sm"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1">
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-10 w-full"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2 border-t">
                  <div className="text-base sm:text-lg font-semibold">
                    Total: {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                    }).format(
                      orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes supplémentaires sur la commande..."
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto text-sm">
                Annuler
              </Button>
              <Button type="submit" disabled={createOrder.isPending} className="w-full sm:w-auto text-sm">
                Créer la commande
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

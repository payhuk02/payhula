/**
 * Composant amélioré de gestion des backorders
 * Date: 28 Janvier 2025
 * Avec alertes automatiques, priorisation, suivi fournisseurs
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Package,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  TrendingUp,
  Truck,
  Factory,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import {
  useBackorders,
  useBackorderCustomers,
  useUpdateBackorder,
  useReceiveBackorderStock,
  useNotifyBackorderCustomers,
  useMarkBackorderOrdered,
  Backorder,
  BackorderStatus,
  BackorderPriority,
} from '@/hooks/physical/useBackorders';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function BackordersManager() {
  const { store } = useStore();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<BackorderStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<BackorderPriority | 'all'>('all');
  const [selectedBackorder, setSelectedBackorder] = useState<Backorder | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [receiveQuantity, setReceiveQuantity] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'quantity'>('priority');

  const filters = useMemo(() => {
    const f: any = {};
    if (statusFilter !== 'all') f.status = statusFilter;
    if (priorityFilter !== 'all') f.priority = priorityFilter;
    return f;
  }, [statusFilter, priorityFilter]);

  const { data: backorders, isLoading } = useBackorders(store?.id || null, filters);
  const { data: customers } = useBackorderCustomers(showCustomers ? selectedBackorder?.id || null : null);
  const updateBackorder = useUpdateBackorder();
  const receiveStock = useReceiveBackorderStock();
  const notifyCustomers = useNotifyBackorderCustomers();
  const markOrdered = useMarkBackorderOrdered();

  // Stats calculées
  const stats = useMemo(() => {
    if (!backorders) return null;

    return {
      total: backorders.length,
      pending: backorders.filter((b) => b.status === 'pending').length,
      ordered: backorders.filter((b) => b.status === 'ordered').length,
      in_transit: backorders.filter((b) => b.status === 'in_transit').length,
      urgent: backorders.filter((b) => b.priority === 'urgent' && b.status !== 'fulfilled').length,
      total_customers: backorders.reduce((sum, b) => sum + b.total_customers, 0),
      pending_units: backorders.reduce((sum, b) => sum + b.pending_quantity, 0),
      in_transit_units: backorders
        .filter((b) => b.status === 'in_transit' || b.status === 'ordered')
        .reduce((sum, b) => sum + b.ordered_quantity, 0),
    };
  }, [backorders]);

  // Backorders triés
  const sortedBackorders = useMemo(() => {
    if (!backorders) return [];

    const sorted = [...backorders];
    switch (sortBy) {
      case 'priority':
        const priorityOrder: Record<BackorderPriority, number> = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'date':
        sorted.sort((a, b) => new Date(b.first_request_date).getTime() - new Date(a.first_request_date).getTime());
        break;
      case 'quantity':
        sorted.sort((a, b) => b.pending_quantity - a.pending_quantity);
        break;
    }
    return sorted;
  }, [backorders, sortBy]);

  const getStatusBadge = (status: BackorderStatus) => {
    const config: Record<BackorderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'En attente', icon: Clock },
      ordered: { variant: 'outline', label: 'Commandé', icon: Package },
      in_transit: { variant: 'outline', label: 'En transit', icon: Truck },
      partially_received: { variant: 'default', label: 'Partiellement reçu', icon: TrendingUp },
      received: { variant: 'default', label: 'Reçu', icon: CheckCircle2 },
      fulfilled: { variant: 'default', label: 'Rempli', icon: CheckCircle2 },
    };

    const { variant, label, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: BackorderPriority) => {
    const config: Record<BackorderPriority, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      low: { variant: 'outline', label: 'Basse' },
      medium: { variant: 'default', label: 'Moyenne' },
      high: { variant: 'default', label: 'Haute' },
      urgent: { variant: 'destructive', label: 'Urgente' },
    };

    const { variant, label } = config[priority];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleReceiveStock = async () => {
    if (!selectedBackorder || receiveQuantity <= 0) return;

    await receiveStock.mutateAsync({
      backorderId: selectedBackorder.id,
      quantity: receiveQuantity,
    });

    setShowReceiveDialog(false);
    setReceiveQuantity(0);
    setSelectedBackorder(null);
  };

  const handleMarkOrdered = async () => {
    if (!selectedBackorder || orderQuantity <= 0) return;

    await markOrdered.mutateAsync({
      backorderId: selectedBackorder.id,
      orderedQuantity: orderQuantity,
      purchaseOrderId: purchaseOrderId || undefined,
      supplierName: supplierName || undefined,
    });

    setShowOrderDialog(false);
    setOrderQuantity(0);
    setPurchaseOrderId('');
    setSupplierName('');
    setSelectedBackorder(null);
  };

  const handleNotifyCustomers = async () => {
    if (!selectedBackorder) return;

    await notifyCustomers.mutateAsync(selectedBackorder.id);
    setShowNotifyDialog(false);
    setSelectedBackorder(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-2xl font-bold">{stats.total_customers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unités en attente</p>
                  <p className="text-2xl font-bold">{stats.pending_units}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestion des Backorders
              </CardTitle>
              <CardDescription>
                Gérez les commandes en rupture de stock avec priorisation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Statut:</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="ordered">Commandé</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="partially_received">Partiellement reçu</SelectItem>
                  <SelectItem value="received">Reçu</SelectItem>
                  <SelectItem value="fulfilled">Rempli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Priorité:</Label>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <Label>Trier par:</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="quantity">Quantité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {!sortedBackorders || sortedBackorders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun backorder trouvé avec ces filtres
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Demande</TableHead>
                  <TableHead>Commandé</TableHead>
                  <TableHead>Reçu</TableHead>
                  <TableHead>En attente</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date prévue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBackorders.map((backorder) => (
                  <TableRow key={backorder.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {backorder.product?.name || 'N/A'}
                        </p>
                        {backorder.variant && (
                          <p className="text-xs text-muted-foreground">
                            {backorder.variant.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(backorder.priority)}</TableCell>
                    <TableCell>{getStatusBadge(backorder.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {backorder.customer_demand}
                      </div>
                    </TableCell>
                    <TableCell>{backorder.ordered_quantity}</TableCell>
                    <TableCell>{backorder.received_quantity}</TableCell>
                    <TableCell>
                      <span className={backorder.pending_quantity > 0 ? 'font-semibold text-orange-500' : ''}>
                        {backorder.pending_quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {backorder.supplier_name ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Factory className="h-3 w-3" />
                          {backorder.supplier_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {backorder.expected_restock_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(backorder.expected_restock_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackorder(backorder);
                            setShowCustomers(true);
                          }}
                        >
                          Clients
                        </Button>
                        {backorder.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackorder(backorder);
                              setOrderQuantity(backorder.pending_quantity);
                              setShowOrderDialog(true);
                            }}
                          >
                            Marquer commandé
                          </Button>
                        )}
                        {(backorder.status === 'ordered' || backorder.status === 'in_transit' || backorder.status === 'partially_received') && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedBackorder(backorder);
                              setReceiveQuantity(0);
                              setShowReceiveDialog(true);
                            }}
                          >
                            Recevoir stock
                          </Button>
                        )}
                        {backorder.status === 'received' && !backorder.auto_fulfill_on_arrival && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackorder(backorder);
                              setShowNotifyDialog(true);
                            }}
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            Notifier
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Clients */}
      <Dialog open={showCustomers} onOpenChange={setShowCustomers}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Clients - {selectedBackorder?.product?.name}
            </DialogTitle>
            <DialogDescription>
              Liste des clients en attente pour ce backorder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {customers && customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Quantité demandée</TableHead>
                    <TableHead>Quantité remplie</TableHead>
                    <TableHead>Notifié</TableHead>
                    <TableHead>Rempli</TableHead>
                    <TableHead>Date demande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {customer.customer?.full_name || 'Client'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.customer?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.order?.order_number || customer.order_id}
                      </TableCell>
                      <TableCell>{customer.quantity_requested}</TableCell>
                      <TableCell>{customer.quantity_fulfilled}</TableCell>
                      <TableCell>
                        {customer.is_notified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.is_fulfilled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(customer.requested_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun client pour ce backorder
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Recevoir Stock */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recevoir du Stock</DialogTitle>
            <DialogDescription>
              Enregistrer une réception de stock pour {selectedBackorder?.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantité reçue</Label>
              <Input
                type="number"
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                min="1"
                max={selectedBackorder?.pending_quantity || 0}
              />
              <p className="text-xs text-muted-foreground">
                Quantité en attente: {selectedBackorder?.pending_quantity || 0}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleReceiveStock}
              disabled={receiveStock.isPending || receiveQuantity <= 0}
            >
              {receiveStock.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Marquer Commandé */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme Commandé</DialogTitle>
            <DialogDescription>
              Enregistrer la commande au fournisseur pour {selectedBackorder?.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantité commandée</Label>
              <Input
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Nom du fournisseur (optionnel)</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="space-y-2">
              <Label>Numéro de commande (optionnel)</Label>
              <Input
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
                placeholder="PO-12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleMarkOrdered}
              disabled={markOrdered.isPending || orderQuantity <= 0}
            >
              {markOrdered.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Notification */}
      <AlertDialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notifier les clients</AlertDialogTitle>
            <AlertDialogDescription>
              Envoyer une notification à tous les clients de ce backorder pour les informer de la disponibilité du produit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNotifyCustomers}
              disabled={notifyCustomers.isPending}
            >
              {notifyCustomers.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Notifier
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


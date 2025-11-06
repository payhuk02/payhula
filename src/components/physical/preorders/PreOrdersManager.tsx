/**
 * Composant de gestion des précommandes
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from 'lucide-react';
import {
  usePreOrders,
  usePreOrderCustomers,
  useUpdatePreOrder,
  useConvertPreOrderToOrders,
  useNotifyPreOrderCustomers,
  PreOrder,
} from '@/hooks/physical/usePreOrders';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function PreOrdersManager() {
  const { store } = useStore();
  const { data: preOrders, isLoading } = usePreOrders(store?.id || null);
  const updatePreOrder = useUpdatePreOrder();
  const convertToOrders = useConvertPreOrderToOrders();
  const notifyCustomers = useNotifyPreOrderCustomers();

  const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);

  const { data: customers } = usePreOrderCustomers(showCustomers ? selectedPreOrder?.id || null : null);

  const getStatusBadge = (status: PreOrder['status']) => {
    const variants: Record<PreOrder['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      pending_arrival: { variant: 'secondary', label: 'En attente' },
      arrived: { variant: 'outline', label: 'Arrivée' },
      fulfilled: { variant: 'default', label: 'Remplie' },
      cancelled: { variant: 'destructive', label: 'Annulée' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleConvertToOrders = async () => {
    if (!selectedPreOrder) return;
    await convertToOrders.mutateAsync(selectedPreOrder.id);
    setShowConvertDialog(false);
    setSelectedPreOrder(null);
  };

  const handleNotifyCustomers = async () => {
    if (!selectedPreOrder) return;
    await notifyCustomers.mutateAsync(selectedPreOrder.id);
    setShowNotifyDialog(false);
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestion des Précommandes
              </CardTitle>
              <CardDescription>
                Gérez les précommandes de vos produits physiques
              </CardDescription>
            </div>
            <Badge variant="outline">
              {preOrders?.length || 0} précommande(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!preOrders || preOrders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune précommande pour le moment
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date prévue</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preOrders.map((preOrder) => (
                  <TableRow key={preOrder.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {preOrder.product?.name || 'N/A'}
                        </p>
                        {preOrder.variant && (
                          <p className="text-xs text-muted-foreground">
                            {preOrder.variant.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(preOrder.status)}</TableCell>
                    <TableCell>
                      {preOrder.expected_availability_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(preOrder.expected_availability_date), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Non définie</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {preOrder.current_pre_orders}
                      </div>
                    </TableCell>
                    <TableCell>
                      {preOrder.pre_order_limit ? (
                        <span>{preOrder.pre_order_limit}</span>
                      ) : (
                        <span className="text-muted-foreground">Illimité</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPreOrder(preOrder);
                            setShowCustomers(true);
                          }}
                        >
                          Clients
                        </Button>
                        {preOrder.status === 'arrived' && !preOrder.notification_sent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPreOrder(preOrder);
                              setShowNotifyDialog(true);
                            }}
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            Notifier
                          </Button>
                        )}
                        {preOrder.status === 'arrived' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedPreOrder(preOrder);
                              setShowConvertDialog(true);
                            }}
                          >
                            Convertir
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Clients - {selectedPreOrder?.product?.name}
            </DialogTitle>
            <DialogDescription>
              Liste des clients ayant effectué une précommande
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {customers && customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Dépôt</TableHead>
                    <TableHead>Notifié</TableHead>
                    <TableHead>Date</TableHead>
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
                      <TableCell>{customer.quantity}</TableCell>
                      <TableCell>
                        {customer.deposit_paid ? (
                          <Badge variant="default">Payé</Badge>
                        ) : (
                          <Badge variant="outline">Non payé</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.notified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun client pour cette précommande
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conversion */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en commandes</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir cette précommande en commandes réelles ?
              Les clients seront automatiquement notifiés et les commandes seront créées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToOrders}
              disabled={convertToOrders.isPending}
            >
              {convertToOrders.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conversion...
                </>
              ) : (
                'Convertir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Notification */}
      <AlertDialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notifier les clients</AlertDialogTitle>
            <AlertDialogDescription>
              Envoyer une notification à tous les clients de cette précommande pour les informer de l'arrivée du produit.
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


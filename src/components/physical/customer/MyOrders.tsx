/**
 * MyOrders - Liste des commandes produits physiques du client
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Truck,
  Calendar,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useCustomerPhysicalOrders } from '@/hooks/physical/useCustomerPhysicalOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export const MyOrders = () => {
  const { data: orders, isLoading, error } = useCustomerPhysicalOrders();
  const navigate = useNavigate();

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus !== 'paid') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          En attente de paiement
        </Badge>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <CheckCircle2 className="h-3 w-3" />
            Confirmée
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="gap-1 bg-yellow-500">
            <Package className="h-3 w-3" />
            En traitement
          </Badge>
        );
      case 'shipped':
        return (
          <Badge variant="default" className="gap-1 bg-purple-500">
            <Truck className="h-3 w-3" />
            Expédiée
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Livrée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Annulée
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  interface Shipment {
    status: string;
    tracking_number?: string;
    carrier?: string;
    estimated_delivery?: string;
  }

  const getShipmentStatus = (shipments: Shipment[] | null | undefined) => {
    if (!shipments || shipments.length === 0) {
      return { text: 'Non expédié', icon: Package, variant: 'secondary' as const };
    }

    const latestShipment = shipments[shipments.length - 1];
    switch (latestShipment.status) {
      case 'label_created':
        return { text: 'Étiquette créée', icon: Package, variant: 'default' as const };
      case 'picked_up':
      case 'in_transit':
        return { text: 'En transit', icon: Truck, variant: 'default' as const };
      case 'out_for_delivery':
        return { text: 'En livraison', icon: Truck, variant: 'default' as const };
      case 'delivered':
        return { text: 'Livré', icon: CheckCircle2, variant: 'default' as const };
      default:
        return { text: latestShipment.status, icon: Package, variant: 'secondary' as const };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement de vos commandes. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Mes Commandes Produits Physiques
        </CardTitle>
        <CardDescription>
          Suivez toutes vos commandes de produits physiques
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!orders || orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore de commandes de produits physiques
            </p>
            <Button onClick={() => navigate('/physical')}>
              Parcourir les produits
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const shipmentStatus = getShipmentStatus(order.shipments || []);
              const ShipmentIcon = shipmentStatus.icon;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Commande #{order.order_number}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {order.order_items.length} article{order.order_items.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(order.status, order.payment_status)}
                        <div className="text-lg font-semibold">
                          {order.total_amount.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: order.currency || 'XOF',
                          })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Items */}
                    <div className="mb-4">
                      <div className="space-y-2">
                        {order.order_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            {item.product_image_url && (
                              <img
                                src={item.product_image_url}
                                alt={item.product_name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{item.product_name}</div>
                              {item.variant_name && (
                                <div className="text-xs text-muted-foreground">
                                  {item.variant_name}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Quantité: {item.quantity} × {item.price.toLocaleString('fr-FR', {
                                  style: 'currency',
                                  currency: order.currency || 'XOF',
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div className="text-sm text-muted-foreground text-center">
                            + {order.order_items.length - 3} autre(s) article(s)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipment Info */}
                    {order.shipments && order.shipments.length > 0 && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShipmentIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{shipmentStatus.text}</span>
                          </div>
                          {order.shipments[0].tracking_number && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (order.shipments?.[0]?.tracking_url) {
                                  window.open(order.shipments[0].tracking_url, '_blank');
                                }
                              }}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              Suivre
                            </Button>
                          )}
                        </div>
                        {order.shipments[0].estimated_delivery && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Livraison estimée: {format(new Date(order.shipments[0].estimated_delivery), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {order.returns && order.returns.length > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <RotateCcw className="h-3 w-3" />
                            {order.returns.length} retour{order.returns.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                        {order.status === 'delivered' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/returns/new?order_id=${order.id}`)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Demander un retour
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

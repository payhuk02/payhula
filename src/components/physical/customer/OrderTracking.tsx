/**
 * OrderTracking - Suivi visuel de commande produits physiques
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useCustomerPhysicalOrder } from '@/hooks/physical/useCustomerPhysicalOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useParams } from 'react-router-dom';

interface OrderTrackingProps {
  orderId?: string;
}

export const OrderTracking = ({ orderId: orderIdProp }: OrderTrackingProps) => {
  const { orderId: orderIdParam } = useParams<{ orderId: string }>();
  const orderId = orderIdProp || orderIdParam;
  const { data: order, isLoading, error } = useCustomerPhysicalOrder(orderId);

  const getStatusSteps = () => {
    const steps = [
      { id: 'pending', label: 'Commande créée', icon: Package },
      { id: 'confirmed', label: 'Commande confirmée', icon: CheckCircle2 },
      { id: 'processing', label: 'En préparation', icon: Package },
      { id: 'shipped', label: 'Expédiée', icon: Truck },
      { id: 'delivered', label: 'Livrée', icon: CheckCircle2 },
    ];

    const currentStatus = order?.status || 'pending';
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
      const stepIndex = statusOrder.indexOf(step.id);
      const isCompleted = stepIndex <= currentIndex;
      const isCurrent = stepIndex === currentIndex;

      return {
        ...step,
        isCompleted,
        isCurrent,
      };
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement de la commande. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  const steps = getStatusSteps();
  const latestShipment = order.shipments?.[order.shipments.length - 1];

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Commande #{order.order_number || order.id}</CardTitle>
              <CardDescription>
                Passée le {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              {order.total_amount.toLocaleString('fr-FR', {
                style: 'currency',
                currency: order.currency || 'XOF',
              })}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi de la commande</CardTitle>
          <CardDescription>Suivez l'avancement de votre commande</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {steps.map((step, index) => {
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="relative pb-8">
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-5 top-10 h-full w-0.5 ${
                        step.isCompleted ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        step.isCompleted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : step.isCurrent
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted bg-muted text-muted-foreground'
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`font-medium ${
                              step.isCompleted || step.isCurrent ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.isCurrent && latestShipment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {latestShipment.tracking_number && (
                                <>Numéro de suivi: {latestShipment.tracking_number}</>
                              )}
                            </p>
                          )}
                        </div>
                        {step.isCurrent && (
                          <Badge variant="default">En cours</Badge>
                        )}
                        {step.isCompleted && !step.isCurrent && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Terminé
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Details */}
      {latestShipment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Informations d'expédition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestShipment.tracking_number && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Numéro de suivi</span>
                  {latestShipment.tracking_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(latestShipment.tracking_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Suivre sur le site du transporteur
                    </Button>
                  )}
                </div>
                <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                  {latestShipment.tracking_number}
                </div>
              </div>
            )}

            {latestShipment.carrier_name && (
              <div>
                <span className="text-sm font-medium">Transporteur</span>
                <p className="text-sm text-muted-foreground">{latestShipment.carrier_name}</p>
              </div>
            )}

            {latestShipment.estimated_delivery && (
              <div>
                <span className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Livraison estimée
                </span>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(latestShipment.estimated_delivery), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}

            {latestShipment.actual_delivery && (
              <div>
                <span className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Livré le
                </span>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(latestShipment.actual_delivery), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shipping Address */}
      {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {order.shipping_address.street && (
                <p>{order.shipping_address.street}</p>
              )}
              <p>
                {order.shipping_address.city}
                {order.shipping_address.state && `, ${order.shipping_address.state}`}
                {order.shipping_address.postal_code && ` ${order.shipping_address.postal_code}`}
              </p>
              {order.shipping_address.country && (
                <p>{order.shipping_address.country}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Articles commandés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                {item.products?.image_url && (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.products?.name || 'Produit'}</h4>
                  {item.physical_product_variants?.name && (
                    <p className="text-sm text-muted-foreground">
                      Variante: {item.physical_product_variants.name}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Quantité: {item.quantity}</span>
                    <span>
                      Prix unitaire: {item.price.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: order.currency || 'XOF',
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {(item.price * item.quantity).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: order.currency || 'XOF',
                    })}
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-semibold">
                {order.total_amount.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: order.currency || 'XOF',
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

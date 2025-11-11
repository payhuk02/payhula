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

    return steps.map((step) => {
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
    <div className="space-y-4 sm:space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg lg:text-xl break-words">
                Commande #{order.order_number || order.id}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Passée le {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm sm:text-base lg:text-lg px-3 sm:px-4 py-1.5 sm:py-2 self-start sm:self-auto whitespace-nowrap">
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
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Suivi de la commande</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Suivez l'avancement de votre commande</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="relative">
            {steps.map((step, index) => {
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="relative pb-6 sm:pb-8">
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-4 sm:left-5 top-8 sm:top-10 h-full w-0.5 ${
                        step.isCompleted ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                        step.isCompleted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : step.isCurrent
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted bg-muted text-muted-foreground'
                      }`}
                    >
                      <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm sm:text-base font-medium break-words ${
                              step.isCompleted || step.isCurrent ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.isCurrent && latestShipment && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                              {(latestShipment as any).tracking_number && (
                                <>Numéro de suivi: {(latestShipment as any).tracking_number}</>
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {step.isCurrent && (
                            <Badge variant="default" className="text-xs">En cours</Badge>
                          )}
                          {step.isCompleted && !step.isCurrent && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <CheckCircle2 className="h-3 w-3" />
                              Terminé
                            </Badge>
                          )}
                        </div>
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
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Informations d'expédition</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
            {(latestShipment as any).tracking_number && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2">
                  <span className="text-xs sm:text-sm font-medium">Numéro de suivi</span>
                  {(latestShipment as any).tracking_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open((latestShipment as any).tracking_url, '_blank')}
                      className="min-h-[36px] sm:min-h-[32px] touch-manipulation w-full sm:w-auto"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                      Suivre sur le site du transporteur
                    </Button>
                  )}
                </div>
                <div className="p-2.5 sm:p-3 bg-muted rounded-lg font-mono text-xs sm:text-sm break-all">
                  {(latestShipment as any).tracking_number}
                </div>
              </div>
            )}

            {(latestShipment as any).carrier_name && (
              <div>
                <span className="text-xs sm:text-sm font-medium block mb-1">Transporteur</span>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{(latestShipment as any).carrier_name}</p>
              </div>
            )}

            {(latestShipment as any).estimated_delivery && (
              <div>
                <span className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-1">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  Livraison estimée
                </span>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {format(new Date((latestShipment as any).estimated_delivery), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}

            {(latestShipment as any).actual_delivery && (
              <div>
                <span className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  Livré le
                </span>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {format(new Date((latestShipment as any).actual_delivery), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shipping Address */}
      {(order as any).shipping_address && Object.keys((order as any).shipping_address).length > 0 && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Adresse de livraison</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="space-y-1 text-xs sm:text-sm">
              {(order as any).shipping_address.street && (
                <p className="break-words">{(order as any).shipping_address.street}</p>
              )}
              <p className="break-words">
                {(order as any).shipping_address.city}
                {(order as any).shipping_address.state && `, ${(order as any).shipping_address.state}`}
                {(order as any).shipping_address.postal_code && ` ${(order as any).shipping_address.postal_code}`}
              </p>
              {(order as any).shipping_address.country && (
                <p className="break-words">{(order as any).shipping_address.country}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Articles commandés</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="space-y-3 sm:space-y-4">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-start gap-2 sm:gap-4 pb-3 sm:pb-4 border-b last:border-0">
                {item.products?.image_url && (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-medium break-words">{item.products?.name || 'Produit'}</h4>
                  {item.physical_product_variants?.name && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-words">
                      Variante: {item.physical_product_variants.name}
                    </p>
                  )}
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                    <span>Quantité: {item.quantity}</span>
                    <span>
                      Prix unitaire: {item.price.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: order.currency || 'XOF',
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm sm:text-base font-semibold whitespace-nowrap">
                    {(item.price * item.quantity).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: order.currency || 'XOF',
                    })}
                  </div>
                </div>
              </div>
            ))}
            <Separator className="my-3 sm:my-4" />
            <div className="flex justify-between items-center pt-2">
              <span className="text-base sm:text-lg font-semibold">Total</span>
              <span className="text-base sm:text-lg font-semibold whitespace-nowrap">
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

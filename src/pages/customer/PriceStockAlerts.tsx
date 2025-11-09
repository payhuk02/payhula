import { useEffect, useState } from 'react';
import { usePriceAlerts, useStockAlerts, useDeletePriceAlert, useDeleteStockAlert, PriceAlert, StockAlert } from '@/hooks/usePriceStockAlerts';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, BellOff, DollarSign, Package, Trash2, ExternalLink, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useToast } from '@/hooks/use-toast';
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

export default function PriceStockAlerts() {
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingPriceAlert, setDeletingPriceAlert] = useState<string | null>(null);
  const [deletingStockAlert, setDeletingStockAlert] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const { data: priceAlerts, isLoading: priceAlertsLoading } = usePriceAlerts(userId);
  const { data: stockAlerts, isLoading: stockAlertsLoading } = useStockAlerts(userId);
  const deletePriceAlert = useDeletePriceAlert();
  const deleteStockAlert = useDeleteStockAlert();

  const handleDeletePriceAlert = async (alert: PriceAlert) => {
    if (!userId) return;

    try {
      await deletePriceAlert.mutateAsync({
        alertId: alert.id,
        userId,
      });
      setDeletingPriceAlert(null);
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleDeleteStockAlert = async (alert: StockAlert) => {
    if (!userId) return;

    try {
      await deleteStockAlert.mutateAsync({
        alertId: alert.id,
        userId,
      });
      setDeletingStockAlert(null);
    } catch (error) {
      // Error already handled in mutation
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Veuillez vous connecter pour voir vos alertes
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes alertes</h1>
        <p className="text-muted-foreground">
          Gérez vos alertes de prix et de stock pour ne rien manquer
        </p>
      </div>

      {/* Alertes de prix */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Alertes de prix
          </CardTitle>
          <CardDescription>
            Vous serez notifié lorsque le prix d'un produit atteint votre objectif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {priceAlertsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : priceAlerts && priceAlerts.length > 0 ? (
            <div className="space-y-4">
              {priceAlerts.map((alert) => {
                const product = alert.products;
                if (!product) return null;

                const currentPrice = alert.current_price;
                const targetPrice = alert.target_price;
                const priceDifference = currentPrice - targetPrice;
                const priceDifferencePercent = ((priceDifference / targetPrice) * 100).toFixed(1);

                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {product.image_url && (
                      <Link
                        to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                        className="flex-shrink-0"
                      >
                        <OptimizedImage
                          src={product.image_url}
                          alt={product.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Prix actuel:</span>{' '}
                          <span className="text-foreground font-semibold">
                            {currentPrice.toLocaleString('fr-FR')} {alert.currency}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Prix cible:</span>{' '}
                          <span className="text-foreground font-semibold">
                            {targetPrice.toLocaleString('fr-FR')} {alert.currency}
                          </span>
                        </div>
                        {priceDifference <= 0 && (
                          <Badge className="bg-green-500 text-white">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Objectif atteint ! ({Math.abs(parseFloat(priceDifferencePercent))}% de réduction)
                          </Badge>
                        )}
                        {priceDifference > 0 && (
                          <Badge variant="outline">
                            Encore {priceDifference.toLocaleString('fr-FR')} {alert.currency} à économiser
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link
                          to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir le produit
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingPriceAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Vous n'avez aucune alerte de prix active
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertes de stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            Alertes de stock
          </CardTitle>
          <CardDescription>
            Vous serez notifié lorsque un produit sera de nouveau en stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockAlertsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : stockAlerts && stockAlerts.length > 0 ? (
            <div className="space-y-4">
              {stockAlerts.map((alert) => {
                const product = alert.products;
                if (!product) return null;

                const isInStock = product.stock_quantity !== null && product.stock_quantity > 0;

                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {product.image_url && (
                      <Link
                        to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                        className="flex-shrink-0"
                      >
                        <OptimizedImage
                          src={product.image_url}
                          alt={product.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {isInStock ? (
                          <Badge className="bg-green-500 text-white">
                            <Package className="h-3 w-3 mr-1" />
                            En stock ! ({product.stock_quantity} disponible{product.stock_quantity > 1 ? 's' : ''})
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Package className="h-3 w-3 mr-1" />
                            En rupture de stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link
                          to={`/stores/${product.stores?.slug || 'default'}/products/${product.slug}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir le produit
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingStockAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Vous n'avez aucune alerte de stock active
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs de confirmation de suppression */}
      <AlertDialog open={deletingPriceAlert !== null} onOpenChange={(open) => !open && setDeletingPriceAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'alerte de prix ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette alerte de prix ? Vous ne recevrez plus de notifications pour ce produit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const alert = priceAlerts?.find((a) => a.id === deletingPriceAlert);
                if (alert && userId) {
                  handleDeletePriceAlert(alert);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingStockAlert !== null} onOpenChange={(open) => !open && setDeletingStockAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'alerte de stock ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette alerte de stock ? Vous ne recevrez plus de notifications pour ce produit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const alert = stockAlerts?.find((a) => a.id === deletingStockAlert);
                if (alert && userId) {
                  handleDeleteStockAlert(alert);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




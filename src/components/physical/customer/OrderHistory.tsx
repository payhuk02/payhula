/**
 * OrderHistory - Historique des achats avec timeline visuelle
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { useCustomerPhysicalOrders } from '@/hooks/physical/useCustomerPhysicalOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export const OrderHistory = () => {
  const { data: orders, isLoading, error } = useCustomerPhysicalOrders();
  const navigate = useNavigate();

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
          Erreur lors du chargement de votre historique. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculer les statistiques
  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Grouper par mois
  const ordersByMonth = orders?.reduce((acc, order) => {
    const monthKey = format(new Date(order.created_at), 'MMMM yyyy', { locale: fr });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(order);
    return acc;
  }, {} as Record<string, typeof orders>);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Commandes produits physiques
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépensé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSpent.toLocaleString('fr-FR', {
                style: 'currency',
                currency: orders?.[0]?.currency || 'XOF',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur tous vos achats
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageOrderValue.toLocaleString('fr-FR', {
                style: 'currency',
                currency: orders?.[0]?.currency || 'XOF',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Par commande
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique des Achats
          </CardTitle>
          <CardDescription>
            Timeline de toutes vos commandes de produits physiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
              <p className="text-muted-foreground">
                Vous n'avez pas encore de commandes
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(ordersByMonth || {}).map(([month, monthOrders]) => (
                <div key={month}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{month}</h3>
                      <p className="text-sm text-muted-foreground">
                        {monthOrders.length} commande{monthOrders.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {monthOrders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: orders[0]?.currency || 'XOF',
                      })}
                    </Badge>
                  </div>
                  <div className="space-y-3 ml-4 border-l-2 border-muted pl-4">
                    {monthOrders.map((order) => (
                      <div key={order.id} className="relative">
                        <div className="absolute -left-7 top-2 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">
                                    Commande #{order.order_number}
                                  </h4>
                                  <Badge variant="outline">
                                    {order.order_items.length} article{order.order_items.length > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                </p>
                                {order.order_items.slice(0, 2).map((item) => (
                                  <div key={item.id} className="flex items-center gap-2 mt-2 text-sm">
                                    {item.product_image_url && (
                                      <img
                                        src={item.product_image_url}
                                        alt={item.product_name}
                                        className="w-6 h-6 rounded object-cover"
                                      />
                                    )}
                                    <span>{item.product_name}</span>
                                    {item.variant_name && (
                                      <span className="text-muted-foreground">
                                        ({item.variant_name})
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {order.order_items.length > 2 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    + {order.order_items.length - 2} autre(s) article(s)
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-semibold mb-2">
                                  {order.total_amount.toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: order.currency || 'XOF',
                                  })}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  Voir détails
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-6" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};





/**
 * Page Customer Portal - Dashboard client complet
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Vue d'ensemble tous achats (4 types)
 * - Statistiques personnelles
 * - Navigation vers sections détaillées
 * - Support complet 4 types produits
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Download,
  BookOpen,
  Calendar,
  Package,
  TrendingUp,
  FileText,
  User,
  MapPin,
  CreditCard,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import CustomerMyReturns from './CustomerMyReturns';
import CustomerLoyalty from './CustomerLoyalty';
import CustomerMyGiftCards from './CustomerMyGiftCards';
import { DownloadsTab } from '@/components/customer/DownloadsTab';
import { LicensesTab } from '@/components/customer/LicensesTab';
import { UpdatesTab } from '@/components/customer/UpdatesTab';
import { FavoritesTab } from '@/components/customer/FavoritesTab';

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  digitalProducts: number;
  physicalProducts: number;
  services: number;
  courses: number;
  activeSubscriptions: number;
}

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch customer statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['customer-stats', user?.id],
    queryFn: async (): Promise<CustomerStats> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Total orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      // Total spent
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, payment_status')
        .eq('customer_id', user.id)
        .eq('payment_status', 'completed');

      const totalSpent = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Count by product type
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_type')
        .in('order_id', 
          await supabase
            .from('orders')
            .select('id')
            .eq('customer_id', user.id)
            .then(({ data }) => data?.map(o => o.id) || [])
        );

      const typeCounts = {
        digital: orderItems?.filter(item => item.product_type === 'digital').length || 0,
        physical: orderItems?.filter(item => item.product_type === 'physical').length || 0,
        service: orderItems?.filter(item => item.product_type === 'service').length || 0,
        course: orderItems?.filter(item => item.product_type === 'course').length || 0,
      };

      // Active subscriptions (if exists)
      const { count: subscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or('status.eq.trialing,status.eq.past_due');

      return {
        totalOrders: ordersCount || 0,
        totalSpent,
        digitalProducts: typeCounts.digital,
        physicalProducts: typeCounts.physical,
        services: typeCounts.service,
        courses: typeCounts.course,
        activeSubscriptions: subscriptionsCount || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (statsLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
                <Skeleton className="h-4 sm:h-5 w-64 sm:w-80" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 sm:h-32" />
                ))}
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
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span>Mon Espace Client</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Gérez vos achats, téléchargements et informations personnelles
              </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50">
                    Total Commandes
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {stats?.totalOrders || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Commandes passées</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50">
                    Total Dépensé
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {(stats?.totalSpent || 0).toLocaleString('fr-FR')} XOF
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Depuis le début</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50">
                    Produits Digitaux
                  </CardTitle>
                  <Download className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {stats?.digitalProducts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Achetés</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50">
                    Cours En Ligne
                  </CardTitle>
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {stats?.courses || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Inscrit(e)s</p>
                </CardContent>
              </Card>
            </div>

            {/* Sections principales */}
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 flex-nowrap sm:flex-wrap gap-1 sm:gap-2 p-1 h-auto">
                  <TabsTrigger 
                    value="overview" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Vue d'ensemble
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Commandes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="downloads" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Téléchargements
                  </TabsTrigger>
                  <TabsTrigger 
                    value="licenses" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Licences
                  </TabsTrigger>
                  <TabsTrigger 
                    value="updates" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Mises à jour
                  </TabsTrigger>
                  <TabsTrigger 
                    value="courses" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Mes Cours
                  </TabsTrigger>
                  <TabsTrigger 
                    value="wishlist" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Favoris
                  </TabsTrigger>
                  <TabsTrigger 
                    value="loyalty" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Fidélité
                  </TabsTrigger>
                  <TabsTrigger 
                    value="gift-cards" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Cartes Cadeaux
                  </TabsTrigger>
                  <TabsTrigger 
                    value="returns" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Mes Retours
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap"
                  >
                    Mon Profil
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Vue d'ensemble */}
              <TabsContent value="overview" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Mes Commandes */}
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate('/account/orders')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                        <Package className="h-5 w-5 text-primary" />
                        Mes Commandes
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Consultez toutes vos commandes et leur statut
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs sm:text-sm">Voir toutes mes commandes</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Téléchargements */}
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate('/account/downloads')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                        <Download className="h-5 w-5 text-primary" />
                        Mes Téléchargements
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Accédez à vos produits digitaux achetés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs sm:text-sm">Accéder aux téléchargements</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Cours */}
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate('/account/courses')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Mes Cours
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Continuez votre apprentissage
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs sm:text-sm">Voir mes cours</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Réservations */}
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate('/account/bookings')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                        <Calendar className="h-5 w-5 text-primary" />
                        Mes Réservations
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Gérez vos réservations de services
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs sm:text-sm">Voir mes réservations</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Factures */}
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate('/account/invoices')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                        <FileText className="h-5 w-5 text-primary" />
                        Mes Factures
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Téléchargez vos factures et reçus
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs sm:text-sm">Voir mes factures</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Ma Wishlist */}
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate('/account/wishlist')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                        <Heart className="h-5 w-5 text-red-500" />
                        Ma Wishlist
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Consultez vos produits favoris
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs sm:text-sm">Voir ma wishlist</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mon Profil */}
                  <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate('/account/profile')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                        <User className="h-5 w-5 text-primary" />
                        Mon Profil
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Gérez vos informations personnelles
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-xs sm:text-sm">Modifier mon profil</span>
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Redirections vers pages détaillées */}
              <TabsContent value="orders" className="mt-4 sm:mt-6">
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Redirection vers Mes Commandes...</p>
                </div>
              </TabsContent>
              <TabsContent value="downloads" className="mt-4 sm:mt-6">
                <DownloadsTab />
              </TabsContent>
              <TabsContent value="courses" className="mt-4 sm:mt-6">
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Redirection vers Mes Cours...</p>
                </div>
              </TabsContent>
              <TabsContent value="wishlist" className="mt-4 sm:mt-6">
                <FavoritesTab />
              </TabsContent>
              <TabsContent value="loyalty" className="mt-4 sm:mt-6">
                <CustomerLoyalty />
              </TabsContent>
              <TabsContent value="gift-cards" className="mt-4 sm:mt-6">
                <CustomerMyGiftCards />
              </TabsContent>
              <TabsContent value="returns" className="mt-4 sm:mt-6">
                <CustomerMyReturns />
              </TabsContent>
              <TabsContent value="profile" className="mt-4 sm:mt-6">
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Redirection vers Mon Profil...</p>
                </div>
              </TabsContent>
              
              {/* Nouveaux onglets */}
              <TabsContent value="licenses" className="mt-4 sm:mt-6">
                <LicensesTab />
              </TabsContent>
              <TabsContent value="updates" className="mt-4 sm:mt-6">
                <UpdatesTab />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


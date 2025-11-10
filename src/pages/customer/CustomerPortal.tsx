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

import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
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
  ArrowRight,
  Heart,
  Menu,
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

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Hamburger Menu - Très visible */}
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50" aria-hidden="true" />
        </button>
        
        {/* Titre avec Icône */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" aria-hidden="true" />
          <h1 className="text-base sm:text-lg font-bold truncate text-gray-900 dark:text-gray-50">
            Mon Espace Client
          </h1>
        </div>
      </div>
    </header>
  );
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

      // Get all orders for customer (for total spent and product type counting)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, total_amount, payment_status')
        .eq('customer_id', user.id);

      // Calculate total spent from completed orders
      const totalSpent = allOrders
        ?.filter(order => order.payment_status === 'completed')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Get order IDs for product type counting
      const orderIds = allOrders?.map(o => o.id) || [];

      let typeCounts = {
        digital: 0,
        physical: 0,
        service: 0,
        course: 0,
      };

      if (orderIds.length > 0) {
        // Récupérer les order_items avec jointure vers products pour obtenir product_type
        const { data: orderItemsWithProducts } = await supabase
          .from('order_items')
          .select(`
            id,
            product_id,
            products (
              product_type
            )
          `)
          .in('order_id', orderIds);

        // Compter par type de produit
        if (orderItemsWithProducts) {
          orderItemsWithProducts.forEach((item: any) => {
            const productType = item.products?.product_type;
            if (productType === 'digital') typeCounts.digital++;
            else if (productType === 'physical') typeCounts.physical++;
            else if (productType === 'service') typeCounts.service++;
            else if (productType === 'course') typeCounts.course++;
          });
        }
      }

      // Active subscriptions - Table n'existe pas, retourner 0
      // TODO: Implémenter lorsque la table subscriptions sera créée
      const subscriptionsCount = 0;

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
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header avec SidebarTrigger et Icône - Loading State */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
                {/* Hamburger Menu Skeleton */}
                <div className="h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse border border-gray-300 dark:border-gray-600" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <Skeleton className="h-5 w-40 sm:w-48" />
                </div>
              </div>
            </header>
            
            {/* Contenu principal */}
            <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header - Desktop seulement */}
                <div className="hidden lg:block space-y-2">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 sm:h-32" />
                  ))}
                </div>
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
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header avec Hamburger et Icône */}
          <MobileHeader />
          
          {/* Contenu principal */}
          <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Header - Desktop seulement */}
              <div className="hidden lg:block space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-50">
                  <User className="h-8 w-8 text-primary" />
                  <span>Mon Espace Client</span>
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Gérez vos achats, téléchargements et informations personnelles
                </p>
              </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200 touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                  <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                    Total Commandes
                  </CardTitle>
                  <ShoppingBag className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-1" />
                </CardHeader>
                <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {stats?.totalOrders || 0}
                  </div>
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">Commandes passées</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200 touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                  <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                    Total Dépensé
                  </CardTitle>
                  <TrendingUp className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-1" />
                </CardHeader>
                <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50 break-words">
                    {(stats?.totalSpent || 0).toLocaleString('fr-FR')} XOF
                  </div>
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">Depuis le début</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200 touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                  <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                    Produits Digitaux
                  </CardTitle>
                  <Download className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-1" />
                </CardHeader>
                <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {stats?.digitalProducts || 0}
                  </div>
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">Achetés</p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200 touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                  <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                    Cours En Ligne
                  </CardTitle>
                  <BookOpen className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-1" />
                </CardHeader>
                <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                  <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {stats?.courses || 0}
                  </div>
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">Inscrit(e)s</p>
                </CardContent>
              </Card>
            </div>

            {/* Sections principales */}
            <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
              {/* Container pour tabs avec scroll horizontal sur mobile */}
              <div className="relative w-full">
                {/* Indicateur de scroll à gauche (mobile uniquement) */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
                
                {/* Indicateur de scroll à droite (mobile uniquement) */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
                
                {/* Tabs avec scroll horizontal */}
                <div 
                  className="overflow-x-auto overflow-y-hidden -mx-2.5 sm:-mx-3 md:mx-0 px-2.5 sm:px-3 md:px-0 scrollbar-hide scroll-smooth"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <TabsList className="inline-flex min-w-max sm:w-auto sm:min-w-0 flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 p-1.5 sm:p-2 h-auto touch-manipulation bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <TabsTrigger 
                      value="overview" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Vue d'ensemble
                    </TabsTrigger>
                    <TabsTrigger 
                      value="orders" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Commandes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="downloads" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Téléchargements
                    </TabsTrigger>
                    <TabsTrigger 
                      value="licenses" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Licences
                    </TabsTrigger>
                    <TabsTrigger 
                      value="updates" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Mises à jour
                    </TabsTrigger>
                    <TabsTrigger 
                      value="courses" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Mes Cours
                    </TabsTrigger>
                    <TabsTrigger 
                      value="wishlist" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Favoris
                    </TabsTrigger>
                    <TabsTrigger 
                      value="loyalty" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Fidélité
                    </TabsTrigger>
                    <TabsTrigger 
                      value="gift-cards" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Cartes Cadeaux
                    </TabsTrigger>
                    <TabsTrigger 
                      value="returns" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Mes Retours
                    </TabsTrigger>
                    <TabsTrigger 
                      value="profile" 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[40px] sm:min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                    >
                      Mon Profil
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Vue d'ensemble */}
              <TabsContent value="overview" className="space-y-2.5 sm:space-y-3 md:space-y-4 mt-3 sm:mt-4 md:mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                  {/* Mes Commandes */}
                  <Card className="border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer group touch-manipulation" onClick={() => navigate('/account/orders')}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-50">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span>Mes Commandes</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 leading-snug">
                        Consultez toutes vos commandes et leur statut
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm">
                        <span className="truncate">Voir toutes mes commandes</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Téléchargements */}
                  <Card className="border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer group touch-manipulation" onClick={() => navigate('/account/downloads')}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-50">
                        <Download className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span>Mes Téléchargements</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 leading-snug">
                        Accédez à vos produits digitaux achetés
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm">
                        <span className="truncate">Accéder aux téléchargements</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Cours */}
                  <Card className="border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer group touch-manipulation" onClick={() => navigate('/account/courses')}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-50">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span>Mes Cours</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 leading-snug">
                        Continuez votre apprentissage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm">
                        <span className="truncate">Voir mes cours</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mes Réservations */}
                  <Card className="border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer group touch-manipulation" onClick={() => navigate('/account/bookings')}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-50">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span>Mes Réservations</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 leading-snug">
                        Gérez vos réservations de services
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm">
                        <span className="truncate">Voir mes réservations</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Factures */}
                  <Card className="border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer group touch-manipulation" onClick={() => navigate('/account/invoices')}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-50">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span>Mes Factures</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 leading-snug">
                        Téléchargez vos factures et reçus
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm">
                        <span className="truncate">Voir mes factures</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Ma Wishlist */}
                  <Card className="border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer group touch-manipulation" onClick={() => navigate('/account/wishlist')}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-50">
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                        <span>Ma Wishlist</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 leading-snug">
                        Consultez vos produits favoris
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm">
                        <span className="truncate">Voir ma wishlist</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Mon Profil */}
                  <Card className="border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer group touch-manipulation" onClick={() => navigate('/account/profile')}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-50">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span>Mon Profil</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 leading-snug">
                        Gérez vos informations personnelles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm">
                        <span className="truncate">Modifier mon profil</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Redirections vers pages détaillées */}
              <TabsContent value="orders" className="mt-3 sm:mt-4 md:mt-6">
                <div className="text-center py-6 sm:py-8 md:py-12">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Redirection vers Mes Commandes...</p>
                </div>
              </TabsContent>
              <TabsContent value="downloads" className="mt-3 sm:mt-4 md:mt-6">
                <DownloadsTab />
              </TabsContent>
              <TabsContent value="courses" className="mt-3 sm:mt-4 md:mt-6">
                <div className="text-center py-6 sm:py-8 md:py-12">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Redirection vers Mes Cours...</p>
                </div>
              </TabsContent>
              <TabsContent value="wishlist" className="mt-3 sm:mt-4 md:mt-6">
                <FavoritesTab />
              </TabsContent>
              <TabsContent value="loyalty" className="mt-3 sm:mt-4 md:mt-6">
                <CustomerLoyalty />
              </TabsContent>
              <TabsContent value="gift-cards" className="mt-3 sm:mt-4 md:mt-6">
                <CustomerMyGiftCards />
              </TabsContent>
              <TabsContent value="returns" className="mt-3 sm:mt-4 md:mt-6">
                <CustomerMyReturns />
              </TabsContent>
              <TabsContent value="profile" className="mt-3 sm:mt-4 md:mt-6">
                <div className="text-center py-6 sm:py-8 md:py-12">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">Redirection vers Mon Profil...</p>
                </div>
              </TabsContent>
              
              {/* Nouveaux onglets */}
              <TabsContent value="licenses" className="mt-3 sm:mt-4 md:mt-6">
                <LicensesTab />
              </TabsContent>
              <TabsContent value="updates" className="mt-3 sm:mt-4 md:mt-6">
                <UpdatesTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
    </SidebarProvider>
  );
}


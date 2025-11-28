/**
 * Page Admin Gestion des Lots et Expiration
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpirationAlerts } from '@/components/physical/lots';
import { Package, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LotsManager } from '@/components/physical/lots';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function PhysicalProductsLots() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Get current user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['current-user-store'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get physical products for selection
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['store-physical-products', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const { data, error } = await supabase
        .from('physical_products')
        .select('id, product:products!inner(id, name, store_id)')
        .eq('product.store_id', store.id)
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  if (storeLoading || productsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Lots et Expiration
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Gérez les lots de produits avec dates d'expiration et rotation FIFO/LIFO/FEFO
                </p>
              </div>
            </div>

            <Tabs defaultValue="alerts" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="alerts"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <AlertTriangle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Alertes d'Expiration</span>
                  <span className="xs:hidden">Alertes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="lots"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Package className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Gestion des Lots</span>
                  <span className="xs:hidden">Lots</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="alerts" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <ExpirationAlerts />
              </TabsContent>

              <TabsContent value="lots" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <Label className="text-xs sm:text-sm whitespace-nowrap">Sélectionner un Produit</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="w-full sm:w-[300px] min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm">
                        <SelectValue placeholder="Choisir un produit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product: any) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.product?.name || `Produit ${product.id.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProductId ? (
                    <LotsManager physicalProductId={selectedProductId} />
                  ) : (
                    <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg border-border/50 bg-card/50 backdrop-blur-sm">
                      <div className="text-center p-6">
                        <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                        <p className="text-sm sm:text-base text-muted-foreground">
                          Sélectionnez un produit pour gérer ses lots
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

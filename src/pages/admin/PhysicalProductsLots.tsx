/**
 * Page Admin Gestion des Lots et Expiration
 * Date: 28 Janvier 2025
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

export default function PhysicalProductsLots() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Get current user's store
  const { data: store } = useQuery({
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
  const { data: products } = useQuery({
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

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Package className="h-8 w-8" />
                Gestion des Lots et Expiration
              </h1>
              <p className="text-muted-foreground">
                Gérez les lots de produits avec dates d'expiration et rotation FIFO/LIFO/FEFO
              </p>
            </div>

            <Tabs defaultValue="alerts" className="space-y-4">
              <TabsList>
                <TabsTrigger value="alerts">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Alertes d'Expiration
                </TabsTrigger>
                <TabsTrigger value="lots">
                  <Package className="mr-2 h-4 w-4" />
                  Gestion des Lots
                </TabsTrigger>
              </TabsList>

              <TabsContent value="alerts" className="space-y-4">
                <ExpirationAlerts />
              </TabsContent>

              <TabsContent value="lots" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label>Sélectionner un Produit</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="w-[300px]">
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
                    <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        Sélectionnez un produit pour gérer ses lots
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


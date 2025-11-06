/**
 * Page Admin Analytics Produits Physiques
 * Date: 28 Janvier 2025
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { PhysicalAnalyticsDashboard } from '@/components/physical/analytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3 } from 'lucide-react';

export default function PhysicalProductsAnalytics() {
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
                <BarChart3 className="h-8 w-8" />
                Analytics Produits Physiques
              </h1>
              <p className="text-muted-foreground">
                Analysez les performances de vos produits physiques avec des rapports détaillés
              </p>
            </div>

            <PhysicalAnalyticsDashboard storeId={store.id} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}



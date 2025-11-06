/**
 * Page de gestion des bundles de produits physiques
 * Date: 28 Janvier 2025
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BundlesManager } from '@/components/physical/bundles/BundlesManager';

export default function PhysicalBundles() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion des Bundles</h1>
              <p className="text-muted-foreground">
                Créez et gérez des bundles de produits avec promotions automatiques et prix dynamiques
              </p>
            </div>

            <BundlesManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


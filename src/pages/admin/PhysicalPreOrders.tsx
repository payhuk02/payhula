/**
 * Page de gestion des précommandes
 * Date: 28 Janvier 2025
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { PreOrdersManager } from '@/components/physical/preorders/PreOrdersManager';

export default function PhysicalPreOrders() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion des Précommandes</h1>
              <p className="text-muted-foreground">
                Gérez les précommandes de vos produits physiques avec notifications automatiques
              </p>
            </div>

            <PreOrdersManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


/**
 * Page de gestion des backorders
 * Date: 28 Janvier 2025
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BackordersManager } from '@/components/physical/backorders/BackordersManager';

export default function PhysicalBackorders() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion des Backorders</h1>
              <p className="text-muted-foreground">
                Gérez les commandes en rupture de stock avec priorisation et alertes automatiques
              </p>
            </div>

            <BackordersManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


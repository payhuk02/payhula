/**
 * Page de gestion multi-devises
 * Date: 28 Janvier 2025
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CurrencyManager } from '@/components/physical/currencies/CurrencyManager';
import { CurrencyConverter } from '@/components/physical/currencies/CurrencyConverter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PhysicalMultiCurrency() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion Multi-devises</h1>
              <p className="text-muted-foreground">
                Gérez les devises, taux de change et prix régionaux
              </p>
            </div>

            <Tabs defaultValue="manager" className="space-y-4">
              <TabsList>
                <TabsTrigger value="manager">Devises & Taux</TabsTrigger>
                <TabsTrigger value="converter">Convertisseur</TabsTrigger>
              </TabsList>

              <TabsContent value="manager">
                <CurrencyManager />
              </TabsContent>

              <TabsContent value="converter">
                <CurrencyConverter />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


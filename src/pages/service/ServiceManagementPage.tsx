/**
 * Service Management Page
 * Date: 30 Janvier 2025
 * 
 * Page complète pour la gestion des services (calendrier, disponibilité, conflits)
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AdvancedServiceCalendar,
  StaffAvailabilityManager,
  ResourceConflictDetector,
} from '@/components/service';
import { useStore } from '@/hooks/useStore';
import { Calendar, Users, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ServiceManagementPage() {
  const { store, isLoading } = useStore();

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6 space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96 w-full" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">
                    Aucune boutique trouvée. Veuillez créer une boutique pour gérer vos services.
                  </p>
                </CardContent>
              </Card>
            </main>
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
              <h1 className="text-3xl font-bold tracking-tight">
                Gestion des Services
              </h1>
              <p className="text-muted-foreground">
                Gérez vos réservations, la disponibilité du staff et détectez les conflits
              </p>
            </div>

            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendrier
                </TabsTrigger>
                <TabsTrigger value="availability">
                  <Users className="h-4 w-4 mr-2" />
                  Disponibilité
                </TabsTrigger>
                <TabsTrigger value="conflicts">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Conflits
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="space-y-4">
                <AdvancedServiceCalendar
                  enableDragDrop={true}
                  enableFilters={true}
                  defaultView="week"
                />
              </TabsContent>

              <TabsContent value="availability" className="space-y-4">
                <StaffAvailabilityManager storeId={store.id} />
              </TabsContent>

              <TabsContent value="conflicts" className="space-y-4">
                <ResourceConflictDetector
                  storeId={store.id}
                  autoDetect={true}
                />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


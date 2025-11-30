/**
 * Store Team Management Page
 * Date: 2 Février 2025
 * 
 * Page principale pour gérer l'équipe d'une boutique (membres et tâches)
 */

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreMembersList } from '@/components/team/StoreMembersList';
import { Users, CheckSquare, BarChart3 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreTasksList } from '@/components/team/StoreTasksList';
import { StoreTeamStats } from '@/components/team/StoreTeamStats';
import { StoreTeamAnalytics } from '@/components/team/StoreTeamAnalytics';

const StoreTeamManagement = () => {
  const { store, loading } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
                <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
                <Skeleton className="h-6 w-48" />
              </div>
            </header>
            <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
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
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
                <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              </div>
            </header>
            <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucune boutique sélectionnée
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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header
            ref={headerRef}
            className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm"
          >
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 flex items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Gestion d'équipe
                </h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-background overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
              {/* Statistiques */}
              <StoreTeamStats storeId={store.id} />

              {/* Tabs */}
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto">
                  <TabsTrigger
                    value="members"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Membres</span>
                    <span className="sm:hidden">Membres</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
                  >
                    <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Tâches</span>
                    <span className="sm:hidden">Tâches</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Statistiques</span>
                    <span className="sm:hidden">Stats</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4 sm:space-y-6">
                  <StoreMembersList />
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4 sm:space-y-6">
                  <StoreTasksList storeId={store.id} />
                </TabsContent>

                <TabsContent value="stats" className="space-y-4 sm:space-y-6">
                  <StoreTeamAnalytics storeId={store.id} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StoreTeamManagement;


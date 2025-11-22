import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tag, TrendingUp, Percent, Calendar } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { usePromotions } from "@/hooks/usePromotions";
import { CreatePromotionDialog } from "@/components/promotions/CreatePromotionDialog";
import { PromotionsTable } from "@/components/promotions/PromotionsTable";
import { PromotionFilters } from "@/components/promotions/PromotionFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Promotions = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const { promotions, loading: promotionsLoading, refetch } = usePromotions(store?.id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  const filteredPromotions = useMemo(() => {
    if (!promotions) return [];
    
    return promotions.filter((promo) => {
      const matchesSearch = 
        promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "active" && promo.is_active) ||
        (statusFilter === "inactive" && !promo.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [promotions, searchQuery, statusFilter]);

  // Stats calculées
  const stats = useMemo(() => {
    if (!promotions) return { total: 0, active: 0, totalUses: 0, averageDiscount: 0 };
    
    const total = promotions.length;
    const active = promotions.filter(p => p.is_active).length;
    const totalUses = promotions.reduce((sum, p) => sum + (p.used_count || 0), 0);
    const totalDiscount = promotions.reduce((sum, p) => {
      if (p.discount_type === "percentage") {
        return sum + p.discount_value;
      }
      return sum;
    }, 0);
    const averageDiscount = total > 0 ? totalDiscount / total : 0;
    
    return { total, active, totalUses, averageDiscount };
  }, [promotions]);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />
              <Skeleton className="h-96 w-full" />
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
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t('promotions.noStore.title')}</CardTitle>
                  <CardDescription>
                    {t('promotions.noStore.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
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
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Tag className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('promotions.title')}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('promotions.description')}
                </p>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('promotions.createButton')}</span>
                <span className="sm:hidden">{t('promotions.createButtonShort')}</span>
              </Button>
            </div>

            {/* Stats Cards - Responsive */}
            {!promotionsLoading && (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('promotions.stats.total')}</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {stats.total}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                        <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('promotions.stats.active')}</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {stats.active}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('promotions.stats.totalUses')}</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {stats.totalUses}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('promotions.stats.averageDiscount')}</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          {stats.averageDiscount.toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                        <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <PromotionFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />

            {/* Promotions Table */}
            {promotionsLoading ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : filteredPromotions && filteredPromotions.length > 0 ? (
              <PromotionsTable promotions={filteredPromotions} onUpdate={refetch} />
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500">
                    <Tag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('promotions.empty.title')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
                    {searchQuery || statusFilter !== "all"
                      ? t('promotions.empty.noResults')
                      : t('promotions.empty.description')}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('promotions.createButton')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <CreatePromotionDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={refetch}
            storeId={store.id}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Promotions;

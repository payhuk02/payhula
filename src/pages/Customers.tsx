import { useState, useEffect, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useCustomers } from "@/hooks/useCustomers";
import { CreateCustomerDialog } from "@/components/customers/CreateCustomerDialog";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Customers = () => {
  const { store, loading: storeLoading } = useStore();
  const {
    customers,
    loading: customersLoading,
    refetch,
    setCustomers,
  } = useCustomers(store?.id);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");

  // --- 🔄 Realtime pour les clients du store ---
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel(`realtime:customers:${store.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers", filter: `store_id=eq.${store.id}` },
        (payload) => {
          console.log("🧩 Realtime customers payload:", payload);

          setCustomers((prev: any[]) => {
            if (payload.eventType === "INSERT") {
              return [payload.new, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((c) => (c.id === payload.new.id ? payload.new : c));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id, setCustomers]);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  // --- 🔍 Filtrage + tri optimisé ---
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return [...customers]
      .filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.includes(query)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "orders":
            return (b.total_orders || 0) - (a.total_orders || 0);
          case "spent":
            return (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0);
          default:
            return 0;
        }
      });
  }, [customers, searchQuery, sortBy]);

  // Stats calculées
  const stats = useMemo(() => {
    if (!customers) return { total: 0, totalOrders: 0, totalSpent: 0, averageSpent: 0 };
    
    const total = customers.length;
    const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
    const totalSpent = customers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);
    const averageSpent = total > 0 ? totalSpent / total : 0;
    
    return { total, totalOrders, totalSpent, averageSpent };
  }, [customers]);

  // --- 🧱 Loading du store ---
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

  // --- ❌ Pas de boutique configurée ---
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Boutique non configurée</CardTitle>
                  <CardDescription>
                    Veuillez d'abord créer votre boutique pour gérer vos clients.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // --- ✅ Interface principale ---
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
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Clients
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Gérez et fidélisez votre clientèle
                </p>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Nouveau client</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>

            {/* Stats Cards - Responsive */}
            {!customersLoading && (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Clients</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {stats.total}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Commandes</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {stats.totalOrders}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Dépensé</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {stats.totalSpent.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Moyenne</p>
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          {stats.averageSpent.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filtres */}
            <CustomerFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Table ou état vide */}
            {customersLoading ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : filteredCustomers.length > 0 ? (
              <CustomersTable customers={filteredCustomers} onUpdate={refetch} />
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500">
                    <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucun client</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
                    {searchQuery
                      ? "Aucun client ne correspond à votre recherche"
                      : "Commencez par ajouter votre premier client"}
                  </p>
                  {!searchQuery && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un client
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Modale création client */}
          <CreateCustomerDialog
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

export default Customers;

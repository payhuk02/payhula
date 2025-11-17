import { useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store as StoreIcon, ExternalLink, Plus, Settings } from "lucide-react";
import { useStores } from "@/hooks/useStores";
import StoreDetails from "@/components/store/StoreDetails";
import { useNavigate, Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Store = () => {
  const { stores, loading } = useStores();
  const navigate = useNavigate();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  const handleCreateStoreRedirect = useCallback(() => {
    navigate('/dashboard/settings?tab=boutique&action=create');
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header - Simple et fonctionnel */}
          <header ref={headerRef} className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center animate-in fade-in slide-in-from-top-4">
                  <StoreIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Boutique
                </h1>
              </div>
              {!loading && stores.length > 0 && (
                <Link
                  to={`/stores/${stores[0].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-manipulation min-h-[44px] whitespace-nowrap text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-0 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label={`Ouvrir la boutique ${stores[0].name} dans un nouvel onglet`}
                >
                  <ExternalLink className="h-3 w-3 mr-1 sm:mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Voir ma boutique</span>
                  <span className="sm:hidden">Voir</span>
                </Link>
              )}
            </div>
          </header>

          {/* Main Content - Simple et fonctionnel */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-background overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
              {loading ? (
                <Card className="shadow-sm border border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                  <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">Chargement de vos boutiques...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : stores.length > 0 ? (
                <Tabs defaultValue="manage" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto" role="tablist" aria-label="Navigation des boutiques">
                    <TabsTrigger value="manage" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]" role="tab" aria-label="Gérer mes boutiques">
                      <StoreIcon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Gérer mes boutiques</span>
                      <span className="sm:hidden">Gérer</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="create" 
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm touch-manipulation min-h-[44px]"
                      onClick={handleCreateStoreRedirect}
                      role="tab"
                      aria-label="Créer une nouvelle boutique"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Créer ma boutique</span>
                      <span className="sm:hidden">Créer</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manage" className="space-y-4 sm:space-y-6">
                    {stores.map((store) => (
                      <StoreDetails key={store.id} store={store} />
                    ))}
                  </TabsContent>

                  <TabsContent value="create" className="space-y-4 sm:space-y-6">
                    <Card className="shadow-sm border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                      <CardHeader className="text-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
                        <div className="flex justify-center mb-6 sm:mb-8">
                          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 flex items-center justify-center">
                            <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 dark:text-purple-400" />
                          </div>
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Créer une nouvelle boutique</CardTitle>
                        <CardDescription className="mt-4 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground">
                          {stores.length === 0
                            ? "Configurez votre nouvelle boutique dans les paramètres."
                            : "Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur. Supprimez votre boutique existante si vous souhaitez en créer une nouvelle."
                          }
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6">
                        <div className="space-y-6 sm:space-y-8">
                          {stores.length === 0 ? (
                            <Button
                              onClick={handleCreateStoreRedirect}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 touch-manipulation text-xs sm:text-sm px-6 sm:px-8 py-2 sm:py-3 transition-all duration-300 hover:scale-105"
                            >
                              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Aller aux paramètres
                            </Button>
                          ) : (
                            <div className="p-4 sm:p-6 lg:p-8 bg-muted/30 rounded-xl text-left max-w-2xl mx-auto border border-border/50">
                              <p className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-destructive">Boutique existante</p>
                              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4">
                                Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur. 
                                Pour créer une nouvelle boutique, vous devez d'abord supprimer votre boutique existante.
                              </p>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                <p className="font-medium mb-2">Votre boutique actuelle :</p>
                                <ul className="space-y-1">
                                  {stores.map((store) => (
                                    <li key={store.id} className="flex items-center gap-2">
                                      <span className="text-primary">•</span>
                                      <span>{store.name}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="shadow-sm border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                  <CardHeader className="text-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6">
                    <div className="flex justify-center mb-6 sm:mb-8">
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 flex items-center justify-center">
                        <StoreIcon className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Créez votre première boutique</CardTitle>
                    <CardDescription className="mt-4 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground">
                      Configurez votre boutique pour commencer à vendre vos produits digitaux et services en Afrique
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6">
                    <div className="space-y-6 sm:space-y-8">
                      <Button
                        onClick={handleCreateStoreRedirect}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 touch-manipulation text-xs sm:text-sm px-6 sm:px-8 py-2 sm:py-3 transition-all duration-300 hover:scale-105"
                      >
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Aller aux paramètres
                      </Button>
                      <div className="mt-6 sm:mt-8 p-4 sm:p-6 lg:p-8 bg-muted/30 rounded-xl text-left max-w-2xl mx-auto border border-border/50">
                        <p className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 lg:mb-6">Qu'est-ce qu'une boutique Payhula ?</p>
                        <ul className="text-xs sm:text-sm lg:text-base text-muted-foreground space-y-2 sm:space-y-3 lg:space-y-4">
                          <li className="flex items-start gap-2 sm:gap-3">
                            <span className="text-primary font-bold text-base sm:text-lg">✓</span>
                            <span>Un lien unique et personnalisable pour votre activité</span>
                          </li>
                          <li className="flex items-start gap-2 sm:gap-3">
                            <span className="text-primary font-bold text-base sm:text-lg">✓</span>
                            <span>Vendez plusieurs produits et services</span>
                          </li>
                          <li className="flex items-start gap-2 sm:gap-3">
                            <span className="text-primary font-bold text-base sm:text-lg">✓</span>
                            <span>Acceptez les paiements en FCFA et autres devises</span>
                          </li>
                          <li className="flex items-start gap-2 sm:gap-3">
                            <span className="text-primary font-bold text-base sm:text-lg">✓</span>
                            <span>Gérez tout depuis votre tableau de bord</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Store;

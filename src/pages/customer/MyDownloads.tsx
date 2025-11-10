/**
 * Page My Downloads - Mes Téléchargements (Customer Portal)
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste tous téléchargements produits digitaux
 * - Statistiques téléchargements
 * - Filtres par statut (réussi/échoué)
 * - Recherche par produit
 * - Bouton re-télécharger
 * - Historique complet
 */

import { useState, useEffect } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  FileText,
  Package,
  RefreshCw,
  Menu,
  ArrowRight,
} from 'lucide-react';
import { useUserDownloads } from '@/hooks/digital/useDownloads';
import { DigitalDownloadButton } from '@/components/digital';

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Hamburger Menu - Très visible */}
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50" aria-hidden="true" />
        </button>
        
        {/* Titre avec Icône */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Download className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" aria-hidden="true" />
          <h1 className="text-sm sm:text-base font-bold truncate text-gray-900 dark:text-gray-50">
            Mes Téléchargements
          </h1>
        </div>
      </div>
    </header>
  );
}

export default function MyDownloads() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch downloads using existing hook
  const { data: downloads, isLoading } = useUserDownloads();

  // Filter downloads
  const filteredDownloads = downloads?.filter((d: any) => {
    const productName = d.digital_product?.product?.name || '';
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'success' && d.download_success) ||
      (statusFilter === 'failed' && !d.download_success);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: downloads?.length || 0,
    successful: downloads?.filter((d: any) => d.download_success).length || 0,
    failed: downloads?.filter((d: any) => !d.download_success).length || 0,
    uniqueProducts: new Set(downloads?.map((d: any) => d.digital_product_id)).size || 0,
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header - Loading State */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
                <div className="h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse border border-gray-300 dark:border-gray-600" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <Skeleton className="h-5 w-40 sm:w-48" />
                </div>
              </div>
            </header>
            <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header - Desktop seulement */}
                <div className="hidden lg:block space-y-2">
                  <Skeleton className="h-10 w-80" />
                  <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
                <Skeleton className="h-96" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header avec Hamburger et Icône */}
          <MobileHeader />
          
          {/* Contenu principal */}
          <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Header - Desktop seulement */}
              <div className="hidden lg:block space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-50">
                  <Download className="h-8 w-8 lg:h-10 lg:w-10 text-primary flex-shrink-0" aria-hidden="true" />
                  <span>Mes Téléchargements</span>
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Accédez à tous vos produits digitaux achetés
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
                <Card className="border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Total Téléchargements</CardTitle>
                    <Download className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">{stats.total}</div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">Depuis le début</p>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Réussis</CardTitle>
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
                    <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.successful}</div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                      {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% de succès
                    </p>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Échoués</CardTitle>
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
                    <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">À réessayer</p>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Produits Uniques</CardTitle>
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">{stats.uniqueProducts}</div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">Produits différents</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="border shadow-sm">
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un produit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
                      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 flex-nowrap sm:flex-wrap gap-1 sm:gap-2 p-1 h-auto bg-gray-100 dark:bg-gray-800">
                          <TabsTrigger 
                            value="all" 
                            className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[36px] sm:min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                          >
                            Tous
                          </TabsTrigger>
                          <TabsTrigger 
                            value="success" 
                            className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[36px] sm:min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                          >
                            Réussis
                          </TabsTrigger>
                          <TabsTrigger 
                            value="failed" 
                            className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[36px] sm:min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
                          >
                            Échoués
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Downloads List */}
              <Card className="border shadow-sm">
                <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-50">
                    {filteredDownloads?.length || 0} {filteredDownloads?.length === 1 ? 'téléchargement' : 'téléchargements'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                  {!filteredDownloads || filteredDownloads.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Download className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900 dark:text-gray-50">Aucun téléchargement</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Aucun téléchargement ne correspond à vos critères'
                          : 'Vous n\'avez pas encore téléchargé de produits digitaux'}
                      </p>
                      {!searchQuery && statusFilter === 'all' && (
                        <Button 
                          onClick={() => navigate('/marketplace')}
                          className="min-h-[44px] touch-manipulation"
                        >
                          Découvrir les produits digitaux
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredDownloads.map((download: any) => (
                        <Card key={download.id} className="hover:shadow-lg transition-shadow border">
                          <CardContent className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              {/* Product Info */}
                              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                                {download.digital_product?.product?.image_url && (
                                  <img
                                    src={download.digital_product.product.image_url}
                                    alt={download.digital_product?.product?.name || 'Produit'}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0 border"
                                  />
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 text-gray-900 dark:text-gray-50 break-words">
                                    {download.digital_product?.product?.name || 'Produit inconnu'}
                                  </h3>
                                  
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
                                    <Badge variant={download.download_success ? 'default' : 'destructive'} className="text-xs">
                                      {download.download_success ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Réussi
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Échoué
                                        </>
                                      )}
                                    </Badge>
                                    
                                    <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                      {new Date(download.download_date).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>

                                    {download.download_duration_seconds && (
                                      <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        {download.download_duration_seconds}s
                                      </span>
                                    )}

                                    {download.file_version && (
                                      <Badge variant="outline" className="text-xs">
                                        Version {download.file_version}
                                      </Badge>
                                    )}
                                  </div>

                                  {download.error_message && (
                                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-2 break-words">
                                      ❌ Erreur: {download.error_message}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="flex-shrink-0 w-full sm:w-auto">
                                {download.digital_product_id && (
                                  <DigitalDownloadButton
                                    digitalProductId={download.digital_product_id}
                                    fileId={download.file_id}
                                    fileName={download.digital_product?.product?.name || 'Fichier'}
                                    fileSize={0}
                                    variant="default"
                                    size="sm"
                                    showRemainingDownloads={false}
                                    className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                                  />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


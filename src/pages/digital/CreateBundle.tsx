/**
 * Page Création Bundle - Interface pour créer des bundles de produits digitaux
 * Date: 26 Janvier 2025
 */

import React, { useCallback } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStore } from '@/hooks/useStore';
import { DigitalBundleManager } from '@/components/digital/DigitalBundleManager';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCreateBundle } from '@/hooks/digital/useDigitalBundles';
import { generateSlug } from '@/lib/store-utils';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';

export default function CreateBundle() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, isLoading: storeLoading } = useStore();
  const createBundle = useCreateBundle();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les produits digitaux de la boutique depuis la table products
  const [digitalProducts, setDigitalProducts] = React.useState<any[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!store?.id) {
      setProductsLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setError(null);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, currency, image_url, category, is_active, is_draft')
          .eq('store_id', store.id)
          .eq('product_type', 'digital')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDigitalProducts(data || []);
        logger.info('Produits digitaux chargés pour bundle', {
          productsCount: data?.length || 0,
          storeId: store.id,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur lors du chargement des produits');
        setError(err);
        logger.error(err, {
          error,
          storeId: store.id,
        });
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les produits digitaux. Veuillez réessayer.',
          variant: 'destructive',
        });
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [store?.id, toast]);

  // Convertir les produits au format attendu par DigitalBundleManager
  const availableProducts = (digitalProducts || []).map((product: any) => ({
    id: product.id,
    name: product.name || 'Produit sans nom',
    description: product.description,
    price: product.price || 0,
    currency: product.currency || 'XOF',
    category: product.category || 'Autre',
    thumbnail: product.image_url,
    isAvailable: product.is_active !== false && product.is_draft !== true,
  }));

  const handleSave = useCallback(async (bundle: any) => {
    if (!store?.id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non trouvée',
        variant: 'destructive',
      });
      logger.error('Boutique non trouvée lors de la création du bundle', {
        storeId: store?.id,
      });
      return;
    }

    try {
      const slug = generateSlug(bundle.name);
      
      await createBundle.mutateAsync({
        store_id: store.id,
        name: bundle.name,
        slug,
        description: bundle.description,
        short_description: bundle.description?.substring(0, 200),
        original_price: bundle.originalTotalPrice || 0,
        bundle_price: bundle.discountedPrice || 0,
        discount_type: bundle.discountType === 'percentage' ? 'percentage' : bundle.discountType === 'fixed' ? 'fixed' : 'custom',
        discount_value: bundle.discountValue || 0,
        product_ids: bundle.productIds || [],
      });

      logger.info('Bundle créé avec succès', {
        bundleName: bundle.name,
        storeId: store.id,
        productCount: bundle.productIds?.length || 0,
      });

      navigate(`/dashboard/digital-products/bundles`);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error('Erreur lors de la création du bundle');
      logger.error(err, {
        error,
        bundleName: bundle.name,
        storeId: store.id,
      });
      // Error handled by hook
    }
  }, [store?.id, createBundle, navigate, toast]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (storeLoading || productsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Vous devez créer une boutique avant de créer un bundle.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header avec animation - Style Inventaire et Mes Cours */}
            <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mr-1 sm:mr-2" />
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Créer un Bundle de Produits Digitaux
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                    Regroupez plusieurs produits et offrez-les à prix réduit
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert - Style Inventaire */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error ? error.message : 'Erreur lors du chargement des produits digitaux'}
                </AlertDescription>
              </Alert>
            )}

            {/* Bundle Manager */}
            <div ref={contentRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Configuration du Bundle</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Sélectionnez les produits à inclure et configurez la remise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {createBundle.isPending ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <span className="ml-2 text-sm text-muted-foreground">Création du bundle...</span>
                    </div>
                  ) : (
                    <DigitalBundleManager
                      availableProducts={availableProducts}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      mode="create"
                    />
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


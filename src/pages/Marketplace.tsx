import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";
import { ProductGrid } from "@/components/ui/ProductGrid";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Search, 
  ShoppingCart, 
  ArrowRight, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Heart, 
  Share2, 
  Eye,
  Star,
  TrendingUp,
  Clock,
  Users,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
  Sparkles,
  Crown,
  DollarSign,
  Loader2,
  Rocket
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import AdvancedFilters from "@/components/marketplace/AdvancedFilters";
import ProductComparison from "@/components/marketplace/ProductComparison";
import FavoritesManager from "@/components/marketplace/FavoritesManager";
import ProductCardProfessional from "@/components/marketplace/ProductCardProfessional";
import { logger } from '@/lib/logger';
import { Product, FilterState, PaginationState } from '@/types/marketplace';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useDebounce } from '@/hooks/useDebounce';
import '@/styles/marketplace-professional.css';
import { SEOMeta, WebsiteSchema } from '@/components/seo';

const Marketplace = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Hook personnalisé pour favoris synchronisés
  const {
    favorites,
    favoritesCount,
    loading: favoritesLoading,
    toggleFavorite,
    clearAllFavorites,
    isFavorite,
  } = useMarketplaceFavorites();
  
  // États principaux
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<Set<string>>(new Set());
  
  // États des filtres
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    productType: "all",
    priceRange: "all",
    rating: "all",
    sortBy: "created_at",
    sortOrder: "desc",
    viewMode: "grid",
    tags: [],
    verifiedOnly: false,
    featuredOnly: false,
    inStock: true
  });

  // État local pour l'input de recherche (non debounced)
  const [searchInput, setSearchInput] = useState("");
  
  // Valeur debounced pour éviter trop d'appels API
  const debouncedSearch = useDebounce(searchInput, 500);
  
  // État de pagination
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0
  });
  
  // États des modales et UI
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(() => {
    // Charger la comparaison depuis localStorage
    const saved = localStorage.getItem('marketplace-comparison');
    return saved ? JSON.parse(saved) : [];
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // Constantes pour les filtres (traduites)
  const PRICE_RANGES = useMemo(() => [
    { value: "all", label: t('marketplace.priceRanges.all') },
    { value: "0-5000", label: t('marketplace.priceRanges.0-5000') },
    { value: "5000-15000", label: t('marketplace.priceRanges.5000-15000') },
    { value: "15000-50000", label: t('marketplace.priceRanges.15000-50000') },
    { value: "50000-100000", label: t('marketplace.priceRanges.50000-100000') },
    { value: "100000+", label: t('marketplace.priceRanges.100000+') }
  ], [t]);

  const SORT_OPTIONS = useMemo(() => [
    { value: "created_at", label: t('marketplace.sort.newest'), icon: Clock },
    { value: "price", label: t('marketplace.sort.price'), icon: DollarSign },
    { value: "rating", label: t('marketplace.sort.rating'), icon: Star },
    { value: "sales_count", label: t('marketplace.sort.sales'), icon: TrendingUp },
    { value: "name", label: t('marketplace.sort.name'), icon: Eye },
    { value: "popularity", label: t('marketplace.sort.popularity'), icon: Zap }
  ], [t]);

  const PRODUCT_TAGS = useMemo(() => [
    t('marketplace.tags.new'), t('marketplace.tags.popular'), t('marketplace.tags.sale'), 
    t('marketplace.tags.recommended'), t('marketplace.tags.trending'),
    t('marketplace.tags.premium'), t('marketplace.tags.fastShipping'), t('marketplace.tags.support'), 
    t('marketplace.tags.warranty'), t('marketplace.tags.training'), t('marketplace.tags.updates'), 
    t('marketplace.tags.community')
  ], [t]);

  // Synchroniser debouncedSearch avec filters.search
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Chargement des produits avec pagination côté serveur
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculer les indices de pagination
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;
      
      let query = supabase
        .from("products")
        .select(`
          *,
          stores!inner (
            id,
            name,
            slug,
            logo_url,
            created_at
          )
        `, { count: 'exact' }) // Obtenir le count total
        .eq("is_active", true)
        .eq("is_draft", false); // Seulement les produits publiés

      // Appliquer les filtres
      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      
      if (filters.productType !== "all") {
        query = query.eq("product_type", filters.productType);
      }
      
      if (filters.priceRange !== "all") {
        const [min, max] = filters.priceRange.split("-").map(Number);
        if (max) {
          query = query.gte("price", min).lte("price", max);
        } else {
          query = query.gte("price", min);
        }
      }
      
      if (filters.rating !== "all") {
        query = query.gte("rating", Number(filters.rating));
      }

      // Appliquer le tri
      if (filters.sortBy === "sales_count") {
        // Tri par nombre de ventes (approximatif avec reviews_count)
        query = query.order("reviews_count", { ascending: filters.sortOrder === "asc" });
      } else {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === "asc" });
      }

      // Appliquer la pagination côté serveur
      query = query.range(startIndex, endIndex);

      const { data, error, count } = await query;
      
      if (error) {
        logger.error("Erreur Supabase lors du chargement des produits:", error);
        throw error;
      }
      
      logger.info(`${data?.length || 0} produits chargés (page ${pagination.currentPage}/${Math.ceil((count || 0) / pagination.itemsPerPage)})`);
      setProducts((data || []) as unknown as Product[]);
      setPagination(prev => ({ ...prev, totalItems: count || 0 }));
      
    } catch (error) {
      logger.error("❌ Erreur lors du chargement des produits :", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, toast]);

  // Abonnement temps réel
  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("realtime:products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          logger.debug("🔁 Changement temps réel détecté sur products:", payload.eventType);

          if (payload.eventType === "INSERT") {
            setProducts((prev) => [payload.new as Product, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Product) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setProducts((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  // Filtrage des produits (côté client pour recherche textuelle et tags)
  // Note: La pagination est maintenant gérée côté serveur
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Recherche textuelle (côté client car nécessite full-text search)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const descMatch = product.description?.toLowerCase().includes(searchLower);
        const storeMatch = product.stores?.name.toLowerCase().includes(searchLower);
        const categoryMatch = product.category?.toLowerCase().includes(searchLower);
        const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        return nameMatch || descMatch || storeMatch || categoryMatch || tagsMatch;
      });
    }

    // Filtrage par tags (côté client car complexe avec arrays)
    if (filters.tags.length > 0) {
      filtered = filtered.filter(product => 
        filters.tags.some(tag => product.tags?.includes(tag))
      );
    }

    return filtered;
  }, [products, filters.search, filters.tags]);

  // Les produits sont déjà paginés côté serveur, mais on applique
  // le filtrage client (recherche textuelle et tags) si nécessaire
  const paginatedProducts = useMemo(() => {
    // Si recherche ou tags actifs, utiliser filteredProducts
    // Sinon, utiliser directement products (déjà paginés par le serveur)
    if (filters.search || filters.tags.length > 0) {
      return filteredProducts;
    }
    return products;
  }, [products, filteredProducts, filters.search, filters.tags]);

  // Catégories et types dynamiques
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [products]);

  const productTypes = useMemo(() => {
    const types = Array.from(new Set(products.map(p => p.product_type).filter(Boolean))) as string[];
    return types.sort();
  }, [products]);

  // Gestion des filtres (reset page à 1 quand filtres changent)
  const updateFilter = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      category: "all",
      productType: "all",
      priceRange: "all",
      rating: "all",
      sortBy: "created_at",
      sortOrder: "desc",
      viewMode: "grid",
      tags: [],
      verifiedOnly: false,
      featuredOnly: false,
      inStock: true
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Persister la comparaison dans localStorage
  useEffect(() => {
    localStorage.setItem('marketplace-comparison', JSON.stringify(comparisonProducts));
  }, [comparisonProducts]);

  // Gestion de la comparaison
  const addToComparison = useCallback((product: Product) => {
    if (comparisonProducts.length >= 4) {
      toast({
        title: "Limite atteinte",
        description: "Vous pouvez comparer maximum 4 produits",
        variant: "destructive",
      });
      return;
    }
    
    if (comparisonProducts.find(p => p.id === product.id)) {
      toast({
        title: "Produit déjà ajouté",
        description: "Ce produit est déjà dans la comparaison",
        variant: "destructive",
      });
      return;
    }
    
    setComparisonProducts(prev => [...prev, product]);
    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté à la comparaison`,
    });
  }, [comparisonProducts, toast]);

  const removeFromComparison = useCallback((productId: string) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
    toast({
      title: "Produit retiré",
      description: "Le produit a été retiré de la comparaison",
    });
  }, [toast]);

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    localStorage.removeItem('marketplace-comparison');
    toast({
      title: "Comparaison effacée",
      description: "Tous les produits ont été retirés de la comparaison",
    });
  }, [toast]);

  // Obtenir les produits favoris
  const favoriteProducts = useMemo(() => {
    if (!favorites || favorites.size === 0) return [];
    const favoriteIds = Array.from(favorites);
    return products.filter(p => favoriteIds.includes(p.id));
  }, [products, favorites]);

  // Fonction d'achat
  const handlePurchase = useCallback(async (product: Product) => {
    if (!product.store_id) {
      toast({
        title: t('marketplace.toast.error'),
        description: t('marketplace.toast.storeUnavailable'),
        variant: "destructive",
      });
      return;
    }

    try {
      setPurchasing(prev => new Set(prev).add(product.id));

      // Récupérer l'utilisateur authentifié
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: t('marketplace.toast.authRequired'),
          description: t('marketplace.toast.loginRequired'),
          variant: "destructive",
        });
        setPurchasing(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
        return;
      }

      const price = product.promotional_price || product.price;
      
      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency,
        description: `${t('marketplace.toast.purchaseOf')} ${product.name}`,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: { 
          productName: product.name, 
          storeSlug: product.stores?.slug || "",
          userId: user.id
        },
      });

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (error: any) {
      logger.error("Erreur lors de l'achat:", error);
      toast({
        title: t('marketplace.toast.paymentError'),
        description: error.message || t('marketplace.toast.paymentFailed'),
        variant: "destructive",
      });
    } finally {
      setPurchasing(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  }, [toast, t]);

  // Partage de produit
  const handleShare = useCallback(async (product: Product) => {
    const url = `${window.location.origin}/${product.stores?.slug}/${product.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description || product.description || "",
          url: url,
        });
        toast({
          title: t('marketplace.toast.shareSuccess'),
          description: t('marketplace.toast.linkShared'),
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          logger.error("Erreur lors du partage:", error);
          toast({
            title: t('marketplace.toast.shareError'),
            description: t('marketplace.toast.shareNotAllowed'),
            variant: "destructive",
          });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: t('marketplace.toast.linkCopied'),
          description: t('marketplace.toast.linkCopiedDesc'),
        });
      } catch (error) {
        logger.error("Erreur lors de la copie:", error);
        toast({
          title: t('marketplace.toast.error'),
          description: t('marketplace.toast.copyError'),
          variant: "destructive",
        });
      }
    }
  }, [toast, t]);

  // Pagination (basée sur le total côté serveur)
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  const canGoPrevious = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < totalPages;

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setPagination(prev => ({ ...prev, currentPage: page }));
    
    // Scroll vers le début de la liste de produits (au lieu du top de page)
    setTimeout(() => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback si ID non trouvé
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100); // Délai pour permettre le re-render
  }, [totalPages]);

  // Statistiques (basées sur le total réel, pas seulement la page actuelle)
  const stats = useMemo(() => ({
    totalProducts: pagination.totalItems, // Total côté serveur
    totalStores: new Set(products.map(p => p.store_id)).size, // Approximation sur page actuelle
    averageRating: products.length > 0 
      ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length 
      : 0,
    totalSales: products.reduce((sum, p) => sum + (p.reviews_count || 0), 0), // Approximation sur page actuelle
    categoriesCount: categories.length,
    featuredProducts: products.filter(p => p.promotional_price && p.promotional_price < p.price).length // Sur page actuelle
  }), [products, categories, pagination.totalItems]);

  // SEO Meta dynamiques
  const marketplaceSeoData = useMemo(() => ({
    title: `Marketplace Payhula - ${stats.totalProducts} Produits Digitaux en Afrique`,
    description: `Découvrez ${stats.totalProducts} produits digitaux sur Payhula : formations en ligne, ebooks, templates, logiciels et services. ${stats.totalStores} boutiques actives. Note moyenne: ${stats.averageRating.toFixed(1)}/5 ⭐. Paiement Mobile Money et CB. Achat sécurisé en XOF.`,
    keywords: 'marketplace afrique, produits digitaux, formation en ligne, ebook francophone, templates professionnels, logiciels, services digitaux, paiement mobile money, XOF, FCFA, ecommerce afrique, boutique en ligne, vente en ligne afrique',
    url: `${window.location.origin}/marketplace`,
    image: `${window.location.origin}/og-marketplace.jpg`,
  }), [stats]);

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOMeta
        title={marketplaceSeoData.title}
        description={marketplaceSeoData.description}
        keywords={marketplaceSeoData.keywords}
        url={marketplaceSeoData.url}
        image={marketplaceSeoData.image}
        imageAlt="Marketplace Payhula - Produits Digitaux en Afrique"
        type="website"
      />
      
      {/* Schema.org Website */}
      <WebsiteSchema />
      
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        {t('marketplace.hero.skipToMain')}
      </a>
      
      <MarketplaceHeader />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto max-w-6xl px-4 pt-6 pb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-slate-300 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-500" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-medium">
                Marketplace
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Hero Section */}
      <section 
        className="relative py-16 px-4 overflow-hidden" 
        aria-labelledby="hero-title"
        role="banner"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse" aria-hidden="true"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" aria-hidden="true" />
              <h1 
                id="hero-title" 
                className="text-4xl md:text-6xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
            {t('marketplace.hero.title')}
          </h1>
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" aria-hidden="true" />
            </div>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              {t('marketplace.hero.subtitle')}
              <br />
              <span className="text-blue-400 font-semibold">{t('marketplace.hero.tagline')}</span>
            </p>
            
            {/* Statistiques */}
            <div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8" 
              role="region" 
              aria-label={t('marketplace.stats.ariaLabel')}
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-blue-400" aria-label={t('marketplace.stats.ariaProducts', { count: stats.totalProducts })}>
                  {stats.totalProducts}
                </div>
                <div className="text-sm text-slate-300">{t('marketplace.stats.products')}</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-green-400" aria-label={t('marketplace.stats.ariaStores', { count: stats.totalStores })}>
                  {stats.totalStores}
                </div>
                <div className="text-sm text-slate-300">{t('marketplace.stats.stores')}</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-yellow-400" aria-label={t('marketplace.stats.ariaRating', { rating: stats.averageRating.toFixed(1) })}>
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-slate-300">{t('marketplace.stats.rating')}</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
                <div className="text-2xl font-bold text-purple-400" aria-label={t('marketplace.stats.ariaSales', { count: stats.totalSales })}>
                  {stats.totalSales}
                </div>
                <div className="text-sm text-slate-300">{t('marketplace.stats.sales')}</div>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" aria-hidden="true" />
              <Input
                type="search"
                placeholder={t('marketplace.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                aria-label={t('marketplace.searchPlaceholder')}
              />
              {searchInput && searchInput !== debouncedSearch && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{t('common.loading')}</span>
                  </div>
                </div>
              )}
          </div>

            {/* Filtres actifs (tags) */}
            {(filters.category !== "all" || filters.productType !== "all" || filters.priceRange !== "all" || filters.tags.length > 0 || filters.verifiedOnly || filters.featuredOnly) && (
              <div className="flex flex-wrap gap-2 items-center justify-center mb-4">
                <span className="text-sm text-slate-300 font-medium">{t('marketplace.filtersActive')}</span>
                
                {filters.category !== "all" && (
                  <Badge variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1">
                    {t('marketplace.filterLabels.category')} {filters.category}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-400" 
                      onClick={() => updateFilter({ category: "all" })}
                      aria-label={`${t('marketplace.filterLabels.clear')} ${filters.category}`}
                    />
                  </Badge>
                )}
                
                {filters.productType !== "all" && (
                  <Badge variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1">
                    {t('marketplace.filterLabels.type')} {filters.productType}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-400" 
                      onClick={() => updateFilter({ productType: "all" })}
                      aria-label={`${t('marketplace.filterLabels.clear')} ${filters.productType}`}
                    />
                  </Badge>
                )}
                
                {filters.priceRange !== "all" && (
                  <Badge variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1">
                    {t('marketplace.filterLabels.priceRange')} {PRICE_RANGES.find(r => r.value === filters.priceRange)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-400" 
                      onClick={() => updateFilter({ priceRange: "all" })}
                      aria-label={`${t('marketplace.filterLabels.clear')} ${t('marketplace.filterLabels.priceRange')}`}
                    />
                  </Badge>
                )}
                
                {filters.verifiedOnly && (
                  <Badge variant="secondary" className="bg-green-700 text-white hover:bg-green-600 transition-colors flex items-center gap-1">
                    ✓ {t('marketplace.filterLabels.verified')}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-400" 
                      onClick={() => updateFilter({ verifiedOnly: false })}
                      aria-label={`${t('marketplace.filterLabels.clear')} ${t('marketplace.filterLabels.verified')}`}
                    />
                  </Badge>
                )}
                
                {filters.featuredOnly && (
                  <Badge variant="secondary" className="bg-yellow-700 text-white hover:bg-yellow-600 transition-colors flex items-center gap-1">
                    ⭐ {t('marketplace.filterLabels.featured')}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-400" 
                      onClick={() => updateFilter({ featuredOnly: false })}
                      aria-label={`${t('marketplace.filterLabels.clear')} ${t('marketplace.filterLabels.featured')}`}
                    />
                  </Badge>
                )}
                
                {filters.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-purple-700 text-white hover:bg-purple-600 transition-colors flex items-center gap-1">
                    {t('marketplace.filterLabels.tag')} {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-400" 
                      onClick={() => updateFilter({ tags: filters.tags.filter(t => t !== tag) })}
                      aria-label={`${t('marketplace.filterLabels.clear')} ${tag}`}
                    />
                  </Badge>
                ))}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  aria-label={`${t('marketplace.filterLabels.clear')} ${t('marketplace.filterLabels.all')}`}
                >
                  {t('marketplace.filterLabels.clear')} {t('marketplace.filterLabels.all')}
                </Button>
              </div>
            )}

            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-3 justify-center" role="toolbar" aria-label={t('marketplace.toolbar.ariaLabel')}>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label={`${showFilters ? t('common.hide') : t('common.show')} ${t('marketplace.filters.advanced')}`}
                aria-expanded={showFilters}
                aria-controls="advanced-filters"
              >
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('marketplace.filters.advanced')}
                {(filters.category !== "all" || filters.productType !== "all" || filters.priceRange !== "all" || filters.tags.length > 0) && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse" aria-label="Filtres actifs">
                    !
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Ouvrir la recherche intelligente"
                aria-expanded={showAdvancedSearch}
              >
                <Zap className="h-4 w-4 mr-2" aria-hidden="true" />
                Recherche intelligente
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFavorites(true)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label={`Voir mes favoris (${favoritesCount} produit${favoritesCount !== 1 ? 's' : ''})`}
              >
                <Heart className="h-4 w-4 mr-2" aria-hidden="true" />
                Mes favoris
                {favoritesCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-red-600 text-white animate-bounce" aria-label={`${favoritesCount} favoris`}>
                    {favoritesCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowComparison(true)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label={`Comparer ${comparisonProducts.length} produit${comparisonProducts.length !== 1 ? 's' : ''}`}
                aria-expanded={showComparison}
              >
                <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
                Comparer
                {comparisonProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-green-600 text-white animate-bounce" aria-label={`${comparisonProducts.length} produits en comparaison`}>
                    {comparisonProducts.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Effacer tous les filtres"
              >
                <X className="h-4 w-4 mr-2" aria-hidden="true" />
                Effacer tout
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres avancés */}
      {showFilters && (
        <section 
          id="advanced-filters" 
          className="py-8 px-4 bg-slate-800/30 backdrop-blur-sm" 
          role="region" 
          aria-label={t('marketplace.filters.advanced')}
        >
          <div className="container mx-auto max-w-6xl">
            <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Catégorie */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Catégorie</label>
                    <select
                      value={filters.category}
                      onChange={(e) => updateFilter({ category: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type de produit */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Type</label>
                    <select
                      value={filters.productType}
                      onChange={(e) => updateFilter({ productType: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Tous les types</option>
                      {productTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prix */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Prix</label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => updateFilter({ priceRange: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      {PRICE_RANGES.map(range => (
                        <option key={range.value} value={range.value}>{range.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Note minimum</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => updateFilter({ rating: e.target.value })}
                      className="w-full p-2 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Toutes les notes</option>
                      <option value="4">4+ étoiles</option>
                      <option value="3">3+ étoiles</option>
                      <option value="2">2+ étoiles</option>
                      <option value="1">1+ étoiles</option>
                    </select>
                  </div>
                </div>

                {/* Filtres supplémentaires */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="verifiedOnly"
                      checked={filters.verifiedOnly}
                      onChange={(e) => updateFilter({ verifiedOnly: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="verifiedOnly" className="text-sm text-slate-300">
                      Boutiques vérifiées uniquement
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featuredOnly"
                      checked={filters.featuredOnly}
                      onChange={(e) => updateFilter({ featuredOnly: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="featuredOnly" className="text-sm text-slate-300">
                      Produits en vedette uniquement
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={filters.inStock}
                      onChange={(e) => updateFilter({ inStock: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="inStock" className="text-sm text-slate-300">
                      En stock uniquement
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Tags populaires</label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = filters.tags.includes(tag)
                            ? filters.tags.filter(t => t !== tag)
                            : [...filters.tags, tag];
                          updateFilter({ tags: newTags });
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition-all duration-300 ${
                          filters.tags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Contrôles de tri et vue */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">
                Tous les produits
              </h2>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {pagination.totalItems} produit{pagination.totalItems !== 1 ? "s" : ""}
              </Badge>
              {filters.search || filters.tags.length > 0 ? (
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  {paginatedProducts.length} résultat{paginatedProducts.length !== 1 ? "s" : ""} affiché{paginatedProducts.length !== 1 ? "s" : ""}
                </Badge>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {/* Tri */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-300">{t('marketplace.sorting.label')}</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter({ sortBy: e.target.value })}
                  className="p-2 bg-slate-700 border-slate-600 text-white rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300"
                >
                  {filters.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>

              {/* Mode de vue */}
              <div className="flex items-center gap-1">
                <Button
                  variant={filters.viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter({ viewMode: "grid" })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={filters.viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter({ viewMode: "list" })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des produits */}
      <section 
        id="main-content" 
        className="py-6 px-4" 
        role="main" 
        aria-label={t('marketplace.productList.ariaLabel')}
      >
        <div className="w-full mx-auto max-w-7xl px-0 sm:px-4">
          {loading ? (
            <ProductGrid loading={true} skeletonCount={pagination.itemsPerPage} />
          ) : paginatedProducts.length > 0 ? (
            <>
              <ProductGrid>
                {paginatedProducts.map((product) => (
                  <ProductCardProfessional
                    key={product.id}
                    product={product}
                    storeSlug={product.stores?.slug || 'default'}
                    onAddToComparison={() => addToComparison(product)}
                    isInComparison={!!comparisonProducts.find(p => p.id === product.id)}
                  />
                ))}
              </ProductGrid>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav 
                  className="flex justify-center items-center gap-2 mt-12" 
                  role="navigation" 
                  aria-label={t('marketplace.pagination.ariaLabel')}
                >
                  <Button
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={!canGoPrevious}
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label={t('marketplace.pagination.previous')}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>

                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (pagination.currentPage <= 4) {
                      page = i + 1;
                    } else if (pagination.currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = pagination.currentPage - 3 + i;
                    }
                    
                    const isActive = page === pagination.currentPage;
                    
                    return (
                      <Button
                        key={page}
                        variant={isActive ? "default" : "outline"}
                        onClick={() => goToPage(page)}
                        className={isActive 
                          ? "bg-blue-600 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
                          : "bg-slate-800 border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        }
                        aria-label={`Page ${page}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={!canGoNext}
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    aria-label={t('marketplace.pagination.next')}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                {t('marketplace.noProducts')}
              </h3>
              <p className="text-slate-400 mb-6">
                {filters.search
                  ? t('marketplace.noProductsSearch')
                  : t('marketplace.noProductsDefault')}
              </p>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold h-12 px-8 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105">
                  {t('marketplace.createStore')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-white animate-bounce" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t('marketplace.cta.title')}
          </h2>
            <Rocket className="h-8 w-8 text-white animate-bounce" />
          </div>
          <p className="text-xl text-blue-100 mb-8">
            {t('marketplace.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
              <Button size="lg" className="bg-white text-blue-600 font-semibold h-14 px-8 hover:bg-blue-50 transition-all duration-300 hover:scale-105">
              {t('marketplace.cta.startFree')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 h-14 px-8 transition-all duration-300 hover:scale-105">
              <Users className="mr-2 h-5 w-5" />
              {t('marketplace.cta.joinCommunity')}
            </Button>
          </div>
        </div>
      </section>

      <MarketplaceFooter />

      {/* Modales */}
      <AdvancedFilters
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        filters={filters}
        onFiltersChange={updateFilter}
        categories={categories}
        productTypes={productTypes}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
      />

      <ProductComparison
        products={comparisonProducts}
        onRemoveProduct={removeFromComparison}
        onClearAll={clearComparison}
        onClose={() => setShowComparison(false)}
      />

      <FavoritesManager
        favorites={favoriteProducts}
        onRemoveFavorite={(productId) => toggleFavorite(productId)}
        onClearAll={clearAllFavorites}
        onClose={() => setShowFavorites(false)}
      />
    </div>
    </>
  );
};

export default Marketplace;
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, 
  Star, 
  Heart, 
  Eye, 
  TrendingUp, 
  CheckCircle, 
  Loader2, 
  Shield,
  Download,
  Truck,
  Percent,
  Package,
  Store,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validator";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useMarketplaceFavorites } from "@/hooks/useMarketplaceFavorites";
import { useCart } from "@/hooks/cart/useCart";
import { PriceStockAlertButton } from "./PriceStockAlertButton";

interface ProductCardModernProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    short_description?: string | null;
    image_url?: string | null;
    price: number;
    promotional_price?: number | null;
    currency?: string;
    rating?: number | null;
    reviews_count?: number | null;
    purchases_count?: number;
    category?: string | null;
    product_type?: string | null;
    store_id?: string;
    stores?: {
      id: string;
      name: string;
      slug: string;
      logo_url?: string | null;
    } | null;
    tags?: string[];
    created_at?: string;
    licensing_type?: string | null;
    license_terms?: string | null;
    downloadable_files?: string[] | any;
    collect_shipping_address?: boolean | null;
    is_featured?: boolean;
    product_affiliate_settings?: Array<{
      commission_rate: number;
      affiliate_enabled: boolean;
    }>;
  };
  storeSlug?: string;
  affiliateCommissionRate?: number;
  freeShipping?: boolean;
  shippingCost?: number;
}

const ProductCardModernComponent = ({ 
  product, 
  storeSlug,
  affiliateCommissionRate,
  freeShipping,
  shippingCost
}: ProductCardModernProps) => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { addItem } = useCart();
  
  // Hook centralisé pour favoris synchronisés
  const { favorites, toggleFavorite } = useMarketplaceFavorites();
  const isFavorite = favorites.has(product.id);

  // Récupérer l'utilisateur pour les alertes
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const price = product.promotional_price ?? product.price;
  const hasPromo = product.promotional_price !== null && product.promotional_price !== undefined && product.promotional_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
    : 0;

  // Vérifier si le produit est nouveau (< 7 jours)
  const isNew = () => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff < 7;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Note: ${rating.toFixed(1)} sur 5 étoiles`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  const handleBuyNow = async () => {
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour effectuer un achat",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency ?? "XOF",
        description: `Achat de ${product.name}`,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: { 
          productName: product.name, 
          storeSlug: storeSlug || product.stores?.slug || '',
          userId: user.id
        },
      });

      if (result.checkout_url) {
        safeRedirect(result.checkout_url, () => {
          toast({
            title: "Erreur de paiement",
            description: "URL de paiement invalide. Veuillez réessayer.",
            variant: "destructive",
          });
        });
      }
    } catch (error: any) {
      logger.error("Erreur lors de l'achat:", error);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Impossible d'initialiser le paiement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      await addItem({
        product_id: product.id,
        product_type: (product.product_type || 'digital') as any,
        quantity: 1,
      });
    } catch (error: any) {
      logger.error("Erreur lors de l'ajout au panier:", error);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(product.id);
  };

  const getLicensingBadge = () => {
    if (!product.licensing_type) return null;
    
    const badges = {
      plr: {
        label: 'PLR',
        className: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
        icon: <Shield className="h-3 w-3" />
      },
      copyrighted: {
        label: 'Droit d\'auteur',
        className: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
        icon: <Shield className="h-3 w-3" />
      },
      standard: {
        label: 'Standard',
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
        icon: <Shield className="h-3 w-3" />
      }
    };

    const badge = badges[product.licensing_type as keyof typeof badges];
    if (!badge) return null;

    return (
      <Badge className={`${badge.className} border-0 text-xs px-2 py-0.5`}>
        {badge.icon}
        <span className="ml-1">{badge.label}</span>
      </Badge>
    );
  };

  const currentStoreSlug = storeSlug || product.stores?.slug || '';

  return (
    <article 
      className="group relative flex flex-col rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Image Container - 60% de la hauteur */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
        <Link to={`/stores/${currentStoreSlug}/products/${product.slug}`}>
          <OptimizedImage
            src={product.image_url || '/placeholder-image.png'}
            alt={product.name}
            width={400}
            height={300}
            className="w-full h-full object-cover"
            priority={false}
            preset="productImage"
            responsive={true}
          />
        </Link>
        
        {/* Overlay gradient au hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100" />
        
        {/* Badges en haut à gauche */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {isNew() && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-xs px-2 py-0.5">
              <Sparkles className="h-3 w-3 mr-1" />
              Nouveau
            </Badge>
          )}
          
          {product.is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs px-2 py-0.5">
              <Star className="h-3 w-3 mr-1 fill-white" />
              Vedette
            </Badge>
          )}
          
          {getLicensingBadge()}
        </div>

        {/* Badge promotion en haut à droite */}
        {hasPromo && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-red-500 text-white border-0 text-xs font-bold px-2.5 py-1">
              <Percent className="h-3 w-3 mr-1" />
              -{discountPercent}%
            </Badge>
          </div>
        )}

        {/* Bouton favori en bas à droite */}
        <button
          onClick={handleFavorite}
          className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 z-10"
          aria-label={isFavorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          aria-pressed={isFavorite}
        >
          <Heart 
            className={`h-4 w-4 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
            }`} 
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Contenu de la carte - 40% de la hauteur */}
      <div className="flex-1 flex flex-col p-4">
        {/* Logo et nom de la boutique */}
        {product.stores && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {product.stores.logo_url ? (
              <img 
                src={product.stores.logo_url} 
                alt={`Logo de ${product.stores.name}`}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              {product.stores.name}
            </span>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 -ml-2" aria-label="Vendeur vérifié" />
          </div>
        )}
        
        {/* Titre du produit */}
        <Link to={`/stores/${currentStoreSlug}/products/${product.slug}`}>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors" id={`product-title-${product.id}`}>
            {product.name}
          </h3>
        </Link>

        {/* Rating et avis */}
        <div className="flex items-center gap-2 mb-2">
          {product.rating !== null && product.rating !== undefined && product.rating > 0 ? (
            <>
              {renderStars(product.rating)}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({product.reviews_count || 0})
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" aria-hidden="true" />
              <span className="text-xs">Vérifié</span>
            </div>
          )}
        </div>

        {/* Informations supplémentaires */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Nombre d'achats */}
          {product.purchases_count !== undefined && product.purchases_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              <span>{product.purchases_count} vente{product.purchases_count > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Pourcentage d'affiliation */}
          {affiliateCommissionRate !== undefined && affiliateCommissionRate > 0 && (
            <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0">
              <Percent className="h-3 w-3 mr-1" />
              {affiliateCommissionRate}% commission
            </Badge>
          )}

          {/* Fichiers téléchargeables */}
          {product.downloadable_files && Array.isArray(product.downloadable_files) && product.downloadable_files.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
              <Download className="h-3 w-3 mr-1" />
              {product.downloadable_files.length} fichier{product.downloadable_files.length > 1 ? 's' : ''}
            </Badge>
          )}

          {/* Livraison */}
          {product.product_type === 'physical' && (
            <div className="flex items-center gap-1 text-xs">
              {freeShipping ? (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
                  <Truck className="h-3 w-3 mr-1" />
                  Livraison gratuite
                </Badge>
              ) : (
                <div className="text-gray-600 dark:text-gray-400">
                  <Truck className="h-3 w-3 inline mr-1" />
                  {shippingCost ? `${formatPrice(shippingCost)} ${product.currency || 'XOF'}` : 'Livraison payante'}
                </div>
              )}
            </div>
          )}

          {/* Type de produit */}
          {product.product_type && (
            <Badge variant="secondary" className="text-xs border-0">
              <Package className="h-3 w-3 mr-1" />
              {product.product_type === 'digital' ? 'Numérique' : 
               product.product_type === 'physical' ? 'Physique' : 'Service'}
            </Badge>
          )}
        </div>

        {/* Prix */}
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1">
            {hasPromo && (
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 line-through flex-shrink-0 whitespace-nowrap" aria-label={`Prix original: ${formatPrice(product.price)} ${product.currency || 'XOF'}`}>
                {formatPrice(product.price)} {product.currency || 'XOF'}
              </span>
            )}
            <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap" aria-label={`Prix actuel: ${formatPrice(price)} ${product.currency || 'XOF'}`}>
              {formatPrice(price)} {product.currency || 'XOF'}
            </span>
          </div>
          <PriceStockAlertButton
            productId={product.id}
            productName={product.name}
            currentPrice={price}
            currency={product.currency || 'XOF'}
            productType={product.product_type || 'digital'}
            stockQuantity={(product as any).stock_quantity}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col gap-1.5 sm:gap-2 mt-auto">
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 sm:px-3"
              asChild
            >
              <Link 
                to={`/stores/${currentStoreSlug}/products/${product.slug}`}
                aria-label={`Voir les détails de ${product.name}`}
                className="flex items-center justify-center gap-1 sm:gap-1.5"
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Voir</span>
              </Link>
            </Button>
            
            {product.store_id && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 sm:px-3"
                asChild
              >
                <Link 
                  to={`/vendor/messaging/${product.store_id}?productId=${product.id}`}
                  aria-label={`Contacter le vendeur pour ${product.name}`}
                  className="flex items-center justify-center gap-1 sm:gap-1.5"
                >
                  <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline whitespace-nowrap">Contacter</span>
                  <span className="sm:hidden">Msg</span>
                </Link>
              </Button>
            )}
            
            <Button
              onClick={handleBuyNow}
              disabled={loading}
              size="sm"
              className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 px-2 sm:px-3"
              aria-label={loading ? `Traitement de l'achat de ${product.name} en cours` : `Acheter ${product.name} pour ${formatPrice(price)} ${product.currency || 'XOF'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin flex-shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Paiement...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">Acheter</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ProductCardModern = React.memo(ProductCardModernComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.promotional_price === nextProps.product.promotional_price &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.rating === nextProps.product.rating &&
    prevProps.product.reviews_count === nextProps.product.reviews_count &&
    prevProps.product.is_featured === nextProps.product.is_featured &&
    prevProps.storeSlug === nextProps.storeSlug &&
    prevProps.affiliateCommissionRate === nextProps.affiliateCommissionRate &&
    prevProps.freeShipping === nextProps.freeShipping &&
    prevProps.shippingCost === nextProps.shippingCost
  );
});

ProductCardModern.displayName = 'ProductCardModern';

export default ProductCardModern;
export { ProductCardModern };


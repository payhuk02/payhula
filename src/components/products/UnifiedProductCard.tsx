/**
 * UnifiedProductCard - Carte produit unifiée pour tous les types
 * S'adapte dynamiquement selon le type de produit (digital, physical, service, course)
 * Gère les fallbacks intelligents et l'affiliation
 * 
 * Inspiré de: ComeUp, Gumroad, Lemonsqueezy
 * Optimisé pour mobile avec React.memo et LazyImage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, Eye, Heart, Percent, MessageSquare, Store, CheckCircle } from 'lucide-react';
import { LazyImage } from '@/components/ui/LazyImage';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { UnifiedProduct, UnifiedProductCardProps, DigitalProduct } from '@/types/unified-product';
import {
  getProductKeyInfo,
  getProductTypeBadge,
  getDisplayPrice,
  formatPrice,
  getProductImage,
  getRatingDisplay,
  hasPromotion,
} from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import { getImageAttributesForPreset } from '@/lib/image-transform';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';

const UnifiedProductCardComponent: React.FC<UnifiedProductCardProps> = ({
  product,
  variant = 'marketplace',
  showAffiliate = true,
  showActions = true,
  onAction,
  className,
}) => {
  const isCompact = variant === 'compact';
  const isDashboard = variant === 'dashboard';
  const isStore = variant === 'store';

  // Récupérer les données formatées
  const typeBadge = getProductTypeBadge(product);
  const keyInfo = getProductKeyInfo(product);
  const priceInfo = getDisplayPrice(product);
  const ratingInfo = getRatingDisplay(product.rating, product.review_count);
  const productImage = getProductImage(product);
  const imageAttrs = productImage ? getImageAttributesForPreset(productImage, 'productImage') : null;

  // URL du produit
  const productUrl = product.store?.slug
    ? `/stores/${product.store.slug}/products/${product.slug}`
    : `/products/${product.slug}`;

  const handleAction = (action: 'view' | 'buy' | 'favorite', e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onAction?.(action, product);
  };

  return (
    <Card
      className={cn(
        // Base structure
        'group relative flex flex-col h-full',
        'bg-card border border-border',
        'rounded-xl overflow-hidden',
        
        
        // Height responsive
        'min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]',
        
        className
      )}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Image Section - Ratio 4:5 uniforme pour e-commerce mobile (portrait) */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-muted to-muted/80">
        {imageAttrs ? (
          <LazyImage
            {...imageAttrs}
            alt={product.name}
            className="w-full h-full object-cover object-center product-image"
            placeholder="skeleton"
            quality={90}
            rootMargin="100px" // Charger plus tôt sur mobile
            threshold={0.01} // Seuil plus bas pour déclencher plus tôt
            width={800}
            height={1000}
          />
        ) : product.image_url ? (
          // Fallback avec OptimizedImage si LazyImage n'a pas d'attributs
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            width={800}
            height={1000}
            className="w-full h-full object-cover object-center product-image"
            preset="productImage"
            responsive={true}
            sizes={{
              mobile: 400,
              tablet: 600,
              desktop: 800
            }}
            quality={90}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-20" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {/* Type Badge */}
          <Badge
            variant="default"
            className={cn('text-white font-semibold', typeBadge.color)}
          >
            {typeBadge.label}
          </Badge>

          {/* Promotion Badge */}
          {hasPromotion(product) && priceInfo.discount && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              -{priceInfo.discount}%
            </Badge>
          )}

          {/* Affiliation Badge */}
          {showAffiliate && product.is_affiliate && product.affiliate_enabled && (
            <Badge variant="secondary" className="bg-purple-500 text-white">
              Affiliation {product.affiliate_percentage ? `${product.affiliate_percentage}%` : ''}
            </Badge>
          )}

          {/* PLR Badge (Digital) */}
          {product.type === 'digital' && (product as DigitalProduct).licensing_type === 'plr' && (
            <Badge variant="default" className="bg-emerald-500 text-white">
              PLR
            </Badge>
          )}
        </div>

      </div>

      {/* Content Section - Spacing professionnel responsive - Optimisé mobile */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6">
        {/* Logo et nom de la boutique */}
        {product.store && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {product.store.logo_url ? (
              <img 
                src={product.store.logo_url} 
                alt={`Logo de ${product.store.name}`}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              {product.store.name}
            </span>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 -ml-2" aria-label="Vendeur vérifié" />
          </div>
        )}

        {/* Title - Typographie hiérarchisée */}
        <h3
          id={`product-title-${product.id}`}
          className={cn(
            'font-semibold leading-tight line-clamp-2 mb-2',
            'text-base sm:text-lg',
            'group-hover:text-primary transition-colors duration-200',
            isCompact && 'text-sm'
          )}
        >
          {product.name}
        </h3>

        {/* Rating - Spacing cohérent */}
        {ratingInfo.hasRating && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors',
                    star <= Math.round(ratingInfo.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {ratingInfo.display}
            </span>
          </div>
        )}

        {/* Key Info - Spacing vertical cohérent */}
        {!isCompact && keyInfo.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {keyInfo.slice(0, 2).map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-1.5 text-xs sm:text-sm',
                    info.badge ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span className="truncate">{info.value}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Price et Actions - Séparateur élégant */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-border/50">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1">
              {priceInfo.originalPrice && (
                <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground line-through flex-shrink-0 whitespace-nowrap">
                  {formatPrice(priceInfo.originalPrice, product.currency)}
                </span>
              )}
              <span className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-primary whitespace-nowrap">
                {formatPrice(priceInfo.price, product.currency)}
              </span>
            </div>
            <PriceStockAlertButton
              productId={product.id}
              productName={product.name}
              currentPrice={priceInfo.price}
              currency={product.currency || 'XOF'}
              productType={product.type}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            />
          </div>

          {/* Actions - Boutons premium - Touch targets optimisés mobile */}
          {showActions && (
            <div className="flex gap-2 sm:gap-2 md:gap-3">
              <Link to={productUrl} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-11 sm:h-8 md:h-9 text-xs sm:text-xs transition-all duration-200 hover:bg-accent/50 px-3 sm:px-3 touch-manipulation active:scale-95"
                  onClick={() => handleAction('view')}
                >
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Voir</span>
                </Button>
              </Link>
              {product.store?.id && (
                <Link to={`/vendor/messaging/${product.store.id}?productId=${product.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-11 sm:h-8 md:h-9 text-xs sm:text-xs transition-all duration-200 hover:bg-accent/50 px-3 sm:px-3 touch-manipulation active:scale-95"
                  >
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">Contacter</span>
                    <span className="sm:hidden">Msg</span>
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                className="flex-1 h-11 sm:h-8 md:h-9 text-xs sm:text-xs transition-all duration-200 hover:scale-[1.02] px-3 sm:px-3 touch-manipulation active:scale-95"
                onClick={(e) => handleAction('buy', e)}
              >
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Acheter</span>
              </Button>
            </div>
          )}

          {/* Store Info - Typographie subtile */}
          {product.store && !isCompact && (
            <div className="mt-3 text-xs sm:text-sm text-muted-foreground truncate">
              Par <span className="font-medium">{product.store.name}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Optimisation avec React.memo
export const UnifiedProductCard = React.memo(UnifiedProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.variant === nextProps.variant &&
    prevProps.showAffiliate === nextProps.showAffiliate
  );
});

UnifiedProductCard.displayName = 'UnifiedProductCard';

export default UnifiedProductCard;



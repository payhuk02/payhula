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
import { Star, ShoppingCart, Eye, Heart, Percent, MessageSquare } from 'lucide-react';
import { LazyImage } from '@/components/ui/LazyImage';
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
      {/* Image Section - Ratio constant 16:9 */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {imageAttrs ? (
          <LazyImage
            {...imageAttrs}
            alt={product.name}
            className="w-full h-full object-cover"
            placeholder="skeleton"
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

      {/* Content Section - Spacing professionnel responsive */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6">
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
        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-baseline gap-2">
              {priceInfo.originalPrice && (
                <span className="text-sm sm:text-base text-muted-foreground line-through">
                  {formatPrice(priceInfo.originalPrice, product.currency)}
                </span>
              )}
              <span className="text-xl sm:text-2xl font-bold text-primary">
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
              className="flex-shrink-0 h-7"
            />
          </div>

          {/* Actions - Boutons premium */}
          {showActions && (
            <div className="flex gap-2 sm:gap-3">
              <Link to={productUrl} className="flex-1">
                <Button
                  variant="outline"
                  size={isCompact ? 'sm' : 'default'}
                  className="w-full transition-all duration-200 hover:bg-accent/50"
                  onClick={() => handleAction('view')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
              </Link>
              {product.store?.id && (
                <Link to={`/vendor/messaging/${product.store.id}?productId=${product.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size={isCompact ? 'sm' : 'default'}
                    className="w-full transition-all duration-200 hover:bg-accent/50"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Contacter</span>
                  </Button>
                </Link>
              )}
              <Button
                size={isCompact ? 'sm' : 'default'}
                className="flex-1 transition-all duration-200 hover:scale-[1.02]"
                onClick={(e) => handleAction('buy', e)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Acheter
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



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
import { Star, ShoppingCart, Eye, Heart, Percent } from 'lucide-react';
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
        'group relative flex flex-col overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        isCompact ? 'min-h-[400px]' : 'min-h-[500px]',
        className
      )}
      style={{ willChange: 'transform' }}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Image Section */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        isCompact ? 'h-48' : 'h-64'
      )}>
        {imageAttrs ? (
          <LazyImage
            {...imageAttrs}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4">
        {/* Title */}
        <h3
          id={`product-title-${product.id}`}
          className={cn(
            'font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors',
            isCompact ? 'text-sm' : 'text-base'
          )}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {ratingInfo.hasRating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-3 w-3',
                    star <= Math.round(ratingInfo.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {ratingInfo.display}
            </span>
          </div>
        )}

        {/* Key Info */}
        {!isCompact && keyInfo.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {keyInfo.slice(0, 2).map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    info.badge ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{info.value}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-3 border-t">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              {priceInfo.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(priceInfo.originalPrice, product.currency)}
                </span>
              )}
              <span className="text-lg font-bold text-primary">
                {formatPrice(priceInfo.price, product.currency)}
              </span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              <Link to={productUrl} className="flex-1">
                <Button
                  variant="outline"
                  size={isCompact ? 'sm' : 'default'}
                  className="w-full"
                  onClick={() => handleAction('view')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
              </Link>
              <Button
                size={isCompact ? 'sm' : 'default'}
                className="flex-1"
                onClick={(e) => handleAction('buy', e)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Acheter
              </Button>
            </div>
          )}

          {/* Store Info */}
          {product.store && !isCompact && (
            <div className="mt-2 text-xs text-muted-foreground">
              Par {product.store.name}
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



/**
 * ProductCardSkeleton - Skeleton loading premium pour les cartes produits
 * Optimisé pour mobile avec animations fluides
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
  variant?: 'marketplace' | 'store' | 'dashboard' | 'compact';
  count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  variant = 'marketplace',
  count = 1,
}) => {
  const isCompact = variant === 'compact';

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className={cn(
            'overflow-hidden',
            isCompact ? 'min-h-[400px]' : 'min-h-[500px]'
          )}
        >
          {/* Image Skeleton */}
          <Skeleton className={cn(
            'w-full bg-muted',
            isCompact ? 'h-48' : 'h-64'
          )} />

          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {/* Badge Skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>

            {/* Title Skeleton */}
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />

            {/* Rating Skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Key Info Skeleton */}
            {!isCompact && (
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            )}

            {/* Price Skeleton */}
            <div className="pt-3 border-t">
              <Skeleton className="h-6 w-32 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
};

export default ProductCardSkeleton;



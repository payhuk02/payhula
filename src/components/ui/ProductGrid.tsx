import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ProductGrid = ({ 
  children, 
  className
}: ProductGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Affichage statique et professionnel - pas de skeletons, pas de lazy loading
  return (
    <div 
      ref={gridRef}
        className={cn(
          "products-grid-mobile md:products-grid-tablet lg:products-grid-desktop",
          // Responsive exact: 1 mobile (<640px), 2 tablette (≥640px <1024px), 3 desktop (≥1024px)
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full max-w-full",
          className
        )}
    >
      {children}
    </div>
  );
};

// Composant pour les cartes produits - affichage statique et professionnel
interface LazyProductCardProps {
  children: React.ReactNode;
  priority?: boolean;
  className?: string;
}

export const LazyProductCard = ({ 
  children, 
  className 
}: LazyProductCardProps) => {
  // Affichage statique et professionnel - pas de lazy loading, pas de skeletons
  return (
    <div className={className}>
      {children}
    </div>
  );
};

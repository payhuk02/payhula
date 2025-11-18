/**
 * Composant OptimizedImage avec support WebP, srcset responsive et lazy loading
 * Affiche automatiquement la version WebP si disponible
 * Génère des srcSet responsive pour optimiser le chargement
 * 
 * Usage:
 * <OptimizedImage src="/image.jpg" alt="Description" width={400} height={300} />
 * <OptimizedImage src="/image.jpg" alt="Description" responsive sizes={{ mobile: 400, tablet: 768, desktop: 1200 }} />
 */

import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, getResponsiveSrcSet, getImageAttributesForPreset, IMAGE_PRESETS, isSupabaseStorageUrl } from '@/lib/image-transform';
import { logger } from '@/lib/logger';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
  priority?: boolean; // Si true, ne pas lazy load
  responsive?: boolean; // Si true, génère un srcSet responsive
  sizes?: {
    mobile?: number;    // 300-400px
    tablet?: number;    // 600-768px
    desktop?: number;   // 900-1200px
    large?: number;     // 1600px+ (optionnel)
  };
  preset?: keyof typeof IMAGE_PRESETS; // Preset prédéfini (productImage, storeLogo, etc.)
  quality?: number; // Qualité de l'image (1-100)
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  fallback = '/placeholder-image.png',
  priority = false,
  responsive = false,
  sizes,
  preset,
  quality = 90, // Qualité élevée pour netteté professionnelle
  ...props
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Utiliser un preset si spécifié
  const imageAttrs = preset 
    ? getImageAttributesForPreset(src, preset)
    : null;

  // Générer les URLs optimisées
  const getOptimizedUrls = () => {
    if (error || !src) {
      return {
        webpSrc: fallback,
        originalSrc: fallback,
        srcSet: undefined,
        sizesAttr: undefined,
      };
    }

    // Si c'est une URL Supabase Storage, utiliser les transformations
    if (isSupabaseStorageUrl(src)) {
      // Si preset est utilisé, utiliser les attributs du preset
      if (imageAttrs) {
        return {
          webpSrc: imageAttrs.src || src,
          originalSrc: src,
          srcSet: imageAttrs.srcSet,
          sizesAttr: imageAttrs.sizes,
        };
      }

      // Si responsive est activé, générer un srcSet
      if (responsive && sizes) {
        const srcSet = getResponsiveSrcSet(src, sizes, { quality, format: 'webp' });
        const sizesAttr = sizes.mobile && sizes.tablet && sizes.desktop
          ? `(max-width: 640px) ${sizes.mobile}px, (max-width: 1024px) ${sizes.tablet}px, ${sizes.desktop}px`
          : undefined;

        // URL WebP par défaut (desktop)
        const webpSrc = getOptimizedImageUrl(src, {
          width: sizes.desktop || width,
          quality,
          format: 'webp',
        }) || src;

        return {
          webpSrc,
          originalSrc: src,
          srcSet,
          sizesAttr,
        };
      }

      // URL WebP simple
      const webpSrc = getOptimizedImageUrl(src, {
        width,
        quality,
        format: 'webp',
      }) || src;

      return {
        webpSrc,
        originalSrc: src,
        srcSet: undefined,
        sizesAttr: undefined,
      };
    }

    // Pour les URLs non-Supabase, retourner tel quel
    return {
      webpSrc: src,
      originalSrc: src,
      srcSet: undefined,
      sizesAttr: undefined,
    };
  };

  const { webpSrc, originalSrc, srcSet, sizesAttr } = getOptimizedUrls();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    logger.error('[OptimizedImage] Failed to load', { src });
    setError(true);
    setIsLoading(false);
  };

  // Déterminer si on doit utiliser WebP
  const useWebP = !error && isSupabaseStorageUrl(src) && webpSrc !== originalSrc;

  return (
    <picture className={cn('relative', className)}>
      {/* Source WebP avec srcSet si disponible */}
      {useWebP && (
        <source 
          srcSet={srcSet || webpSrc} 
          type="image/webp"
          sizes={sizesAttr}
        />
      )}
      
      {/* Source fallback (JPEG/PNG) avec srcSet si disponible */}
      {srcSet && !useWebP && (
        <source 
          srcSet={srcSet} 
          type="image/jpeg"
          sizes={sizesAttr}
        />
      )}
      
      {/* Image fallback */}
      <img
        src={error ? fallback : originalSrc}
        alt={alt}
        width={width}
        height={height}
        srcSet={srcSet && !useWebP ? srcSet : undefined}
        sizes={sizesAttr}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-500 ease-out',
          'image-sharp', // Classe pour netteté professionnelle
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        style={{
          imageRendering: 'crisp-edges',
          ...props.style
        }}
        {...props}
      />
      
      {/* Skeleton loading */}
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse bg-muted rounded"
          style={{ width, height }}
          aria-hidden="true"
        />
      )}
    </picture>
  );
};

/**
 * Version avec ratio aspect fixe
 */
interface OptimizedImageWithAspectRatioProps extends OptimizedImageProps {
  aspectRatio?: string; // ex: "16/9", "4/3", "1/1"
}

export const OptimizedImageWithAspectRatio = ({
  aspectRatio = '16/9',
  className,
  ...props
}: OptimizedImageWithAspectRatioProps) => {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        {...props}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

/**
 * Composant OptimizedImage avec support WebP, srcset responsive et lazy loading
 * Affiche automatiquement la version WebP si disponible
 * Génère des srcSet responsive pour optimiser le chargement
 * 
 * Usage:
 * <OptimizedImage src="/image.jpg" alt="Description" width={400} height={300} />
 * <OptimizedImage src="/image.jpg" alt="Description" responsive sizes={{ mobile: 400, tablet: 768, desktop: 1200 }} />
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';
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
  
  // Détecter si on est sur mobile pour optimiser le chargement
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  
  // Forcer le chargement immédiat sur mobile si l'image est valide
  useEffect(() => {
    if (isMobile && src && !error) {
      // Précharger l'image sur mobile pour améliorer l'affichage
      const img = new Image();
      const imageUrl = webpSrc || originalSrc || src;
      img.src = imageUrl;
      
      // Gérer le chargement réussi
      img.onload = () => {
        setIsLoading(false);
      };
      
      // Gérer les erreurs de préchargement
      img.onerror = () => {
        logger.warn('[OptimizedImage] Preload failed on mobile', { imageUrl });
      };
    }
  }, [isMobile, src, webpSrc, originalSrc, error]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    logger.error('[OptimizedImage] Failed to load', { src, webpSrc, originalSrc });
    setError(true);
    setIsLoading(false);
  };
  
  // Timeout pour forcer l'affichage si l'image prend trop de temps à charger
  useEffect(() => {
    if (!src || error) return;
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        // Si l'image n'a pas chargé après 3 secondes, forcer l'affichage du fallback
        logger.warn('[OptimizedImage] Loading timeout, showing fallback', { src });
        setError(true);
        setIsLoading(false);
      }
    }, 3000); // 3 secondes timeout
    
    return () => clearTimeout(timeout);
  }, [src, error, isLoading]);

  // Déterminer si on doit utiliser WebP
  const useWebP = !error && isSupabaseStorageUrl(src) && webpSrc !== originalSrc;
  
  // Sur mobile, charger plus agressivement (eager pour les premières images)
  const shouldLoadEager = priority || (isMobile && !error && src);

  return (
    <picture className={cn('relative w-full h-full', className)}>
      {/* Source WebP avec srcSet si disponible */}
      {useWebP && (
        <source 
          srcSet={srcSet || webpSrc} 
          type="image/webp"
          sizes={sizesAttr || (isMobile ? '100vw' : undefined)}
        />
      )}
      
      {/* Source fallback (JPEG/PNG) avec srcSet si disponible */}
      {srcSet && !useWebP && (
        <source 
          srcSet={srcSet} 
          type="image/jpeg"
          sizes={sizesAttr || (isMobile ? '100vw' : undefined)}
        />
      )}
      
      {/* Image fallback - Optimisée pour mobile */}
      <img
        src={error ? fallback : (webpSrc || originalSrc || src)}
        alt={alt}
        width={width}
        height={height}
        srcSet={srcSet && !useWebP ? srcSet : undefined}
        sizes={sizesAttr || (isMobile ? '100vw' : undefined)}
        loading={shouldLoadEager ? 'eager' : 'lazy'}
        decoding={shouldLoadEager ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300 ease-out',
          'image-sharp', // Classe pour netteté professionnelle
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          'w-full h-full object-cover',
          'block', // Forcer display block pour éviter les problèmes de layout
          className
        )}
        style={{
          imageRendering: 'crisp-edges',
          minHeight: isMobile ? '200px' : undefined, // Hauteur minimum sur mobile
          ...props.style
        }}
        {...props}
      />
      
      {/* Skeleton loading amélioré pour mobile */}
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse rounded',
            isMobile 
              ? 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800'
              : 'bg-muted'
          )}
          style={{ width: '100%', height: '100%' }}
          aria-hidden="true"
        >
          {/* Icône placeholder subtile */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg
              className="w-12 h-12 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
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

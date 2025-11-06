/**
 * Configuration CDN pour optimiser le chargement des assets
 * Support pour Cloudflare, AWS CloudFront, Vercel Edge Network
 */

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  imageOptimization: boolean;
  videoOptimization: boolean;
  fontOptimization: boolean;
}

/**
 * Configuration CDN par défaut
 * Peut être surchargée via variables d'environnement
 */
export const getCDNConfig = (): CDNConfig => {
  const cdnBaseUrl = import.meta.env.VITE_CDN_BASE_URL || '';
  const cdnEnabled = import.meta.env.VITE_CDN_ENABLED === 'true' || !!cdnBaseUrl;

  return {
    enabled: cdnEnabled,
    baseUrl: cdnBaseUrl,
    imageOptimization: import.meta.env.VITE_CDN_IMAGE_OPTIMIZATION !== 'false',
    videoOptimization: import.meta.env.VITE_CDN_VIDEO_OPTIMIZATION !== 'false',
    fontOptimization: import.meta.env.VITE_CDN_FONT_OPTIMIZATION !== 'false',
  };
};

/**
 * Génère une URL CDN pour un asset
 */
export const getCDNUrl = (path: string): string => {
  const config = getCDNConfig();
  
  if (!config.enabled || !config.baseUrl) {
    return path;
  }

  // Si le path est déjà une URL complète, retourner tel quel
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Nettoyer le path (enlever le slash initial si présent)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Construire l'URL CDN
  const baseUrl = config.baseUrl.endsWith('/') 
    ? config.baseUrl.slice(0, -1) 
    : config.baseUrl;
  
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Génère une URL CDN optimisée pour les images
 * Support pour Cloudflare Images, Cloudinary, etc.
 */
export const getOptimizedImageUrl = (
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  }
): string => {
  const config = getCDNConfig();
  
  if (!config.imageOptimization) {
    return getCDNUrl(path);
  }

  // Si Cloudflare Images
  if (config.baseUrl.includes('cloudflare') || import.meta.env.VITE_CDN_PROVIDER === 'cloudflare') {
    const params = new URLSearchParams();
    if (options?.width) params.append('width', options.width.toString());
    if (options?.height) params.append('height', options.height.toString());
    if (options?.quality) params.append('quality', options.quality.toString());
    if (options?.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return `${getCDNUrl(path)}${queryString ? `?${queryString}` : ''}`;
  }

  // Si Cloudinary
  if (config.baseUrl.includes('cloudinary') || import.meta.env.VITE_CDN_PROVIDER === 'cloudinary') {
    const transformations: string[] = [];
    if (options?.width) transformations.push(`w_${options.width}`);
    if (options?.height) transformations.push(`h_${options.height}`);
    if (options?.quality) transformations.push(`q_${options.quality}`);
    if (options?.format) transformations.push(`f_${options.format}`);
    
    const transformString = transformations.length > 0 ? `${transformations.join(',')}/` : '';
    return `${getCDNUrl(path)}`.replace('/upload/', `/upload/${transformString}`);
  }

  // Par défaut, retourner l'URL CDN standard
  return getCDNUrl(path);
};

/**
 * Précharge une ressource via CDN
 */
export const preloadCDNResource = (url: string, as: 'image' | 'script' | 'style' | 'font' | 'video'): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
};

/**
 * Préconnecte à un domaine CDN
 */
export const preconnectCDN = (domain: string): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  link.crossOrigin = 'anonymous';
  
  document.head.appendChild(link);
};

/**
 * Initialise les connexions CDN au chargement de la page
 */
export const initCDNConnections = (): void => {
  const config = getCDNConfig();
  
  if (!config.enabled || !config.baseUrl) return;

  try {
    const cdnDomain = new URL(config.baseUrl).origin;
    preconnectCDN(cdnDomain);
    
    // DNS prefetch pour améliorer les performances
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = cdnDomain;
    document.head.appendChild(dnsPrefetch);
  } catch (error) {
    console.warn('[CDN] Erreur lors de l\'initialisation:', error);
  }
};


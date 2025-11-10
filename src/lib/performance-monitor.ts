/**
 * Système de monitoring de performance
 * Track les métriques de performance et les envoie à Sentry
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

/**
 * Métriques de performance à tracker
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Métriques personnalisées
  pageLoadTime?: number;
  domContentLoaded?: number;
  resourceLoadTime?: number;
  
  // Métriques réseau
  networkRequests?: number;
  networkErrors?: number;
  
  // Métriques React
  componentRenderTime?: number;
  reRenderCount?: number;
}

/**
 * Classe pour monitorer les performances
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window === 'undefined') return;
    this.init();
  }

  /**
   * Initialiser le monitoring
   */
  private init() {
    // Attendre que la page soit chargée
    if (document.readyState === 'complete') {
      this.startMonitoring();
    } else {
      window.addEventListener('load', () => {
        this.startMonitoring();
      });
    }
  }

  /**
   * Démarrer le monitoring
   */
  private startMonitoring() {
    try {
      // Core Web Vitals
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();
      
      // Métriques de page
      this.observePageLoad();
      this.observeResourceLoad();
      
      // Métriques réseau
      this.observeNetwork();
      
      logger.info('Performance monitoring started');
    } catch (error) {
      logger.error('Error starting performance monitoring:', error);
    }
  }

  /**
   * Observer Largest Contentful Paint (LCP)
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };
        
        const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.metrics.lcp = lcp;
        
        // Envoyer à Sentry si LCP > 2.5s (seuil recommandé)
        if (lcp > 2500) {
          Sentry.metrics.distribution('web.vitals.lcp', lcp, {
            tags: { threshold: 'poor' },
          });
          logger.warn(`LCP is slow: ${lcp}ms`);
        } else {
          Sentry.metrics.distribution('web.vitals.lcp', lcp);
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Error observing LCP:', error);
    }
  }

  /**
   * Observer First Input Delay (FID)
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.fid = fid;
          
          // Envoyer à Sentry si FID > 100ms (seuil recommandé)
          if (fid > 100) {
            Sentry.metrics.distribution('web.vitals.fid', fid, {
              tags: { threshold: 'poor' },
            });
            logger.warn(`FID is slow: ${fid}ms`);
          } else {
            Sentry.metrics.distribution('web.vitals.fid', fid);
          }
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Error observing FID:', error);
    }
  }

  /**
   * Observer Cumulative Layout Shift (CLS)
   */
  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
        
        // Envoyer à Sentry si CLS > 0.1 (seuil recommandé)
        if (clsValue > 0.1) {
          Sentry.metrics.distribution('web.vitals.cls', clsValue, {
            tags: { threshold: 'poor' },
          });
          logger.warn(`CLS is poor: ${clsValue}`);
        } else {
          Sentry.metrics.distribution('web.vitals.cls', clsValue);
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Error observing CLS:', error);
    }
  }

  /**
   * Observer First Contentful Paint (FCP)
   */
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime;
            this.metrics.fcp = fcp;
            
            // Envoyer à Sentry si FCP > 1.8s (seuil recommandé)
            if (fcp > 1800) {
              Sentry.metrics.distribution('web.vitals.fcp', fcp, {
                tags: { threshold: 'poor' },
              });
              logger.warn(`FCP is slow: ${fcp}ms`);
            } else {
              Sentry.metrics.distribution('web.vitals.fcp', fcp);
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Error observing FCP:', error);
    }
  }

  /**
   * Observer Time to First Byte (TTFB)
   */
  private observeTTFB() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.ttfb = ttfb;
        
        // Envoyer à Sentry si TTFB > 800ms (seuil recommandé)
        if (ttfb > 800) {
          Sentry.metrics.distribution('web.vitals.ttfb', ttfb, {
            tags: { threshold: 'poor' },
          });
          logger.warn(`TTFB is slow: ${ttfb}ms`);
        } else {
          Sentry.metrics.distribution('web.vitals.ttfb', ttfb);
        }
      }
    } catch (error) {
      logger.error('Error observing TTFB:', error);
    }
  }

  /**
   * Observer le temps de chargement de la page
   */
  private observePageLoad() {
    try {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          
          Sentry.metrics.distribution('web.page.load_time', this.metrics.pageLoadTime || 0);
          Sentry.metrics.distribution('web.page.dom_content_loaded', this.metrics.domContentLoaded || 0);
        }
      });
    } catch (error) {
      logger.error('Error observing page load:', error);
    }
  }

  /**
   * Observer le temps de chargement des ressources
   */
  private observeResourceLoad() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
          
          // Tracker seulement les ressources lentes (> 1s)
          if (loadTime > 1000) {
            Sentry.metrics.distribution('web.resource.load_time', loadTime, {
              tags: {
                resource_type: resourceEntry.initiatorType,
                resource_name: resourceEntry.name,
              },
            });
            logger.warn(`Slow resource: ${resourceEntry.name} (${loadTime}ms)`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      logger.error('Error observing resource load:', error);
    }
  }

  /**
   * Observer les requêtes réseau
   */
  private observeNetwork() {
    try {
      let requestCount = 0;
      let errorCount = 0;

      // Intercepter les fetch
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        requestCount++;
        const startTime = performance.now();
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Tracker les requêtes lentes (> 2s)
          if (duration > 2000) {
            Sentry.metrics.distribution('web.network.request_duration', duration, {
              tags: {
                url: typeof args[0] === 'string' ? args[0] : args[0].url,
                method: args[1]?.method || 'GET',
              },
            });
            logger.warn(`Slow network request: ${duration}ms`);
          }
          
          if (!response.ok) {
            errorCount++;
          }
          
          return response;
        } catch (error) {
          errorCount++;
          throw error;
        }
      };
      
      this.metrics.networkRequests = requestCount;
      this.metrics.networkErrors = errorCount;
      
      // Envoyer les métriques périodiquement
      setInterval(() => {
        Sentry.metrics.distribution('web.network.requests', requestCount);
        Sentry.metrics.distribution('web.network.errors', errorCount);
      }, 60000); // Toutes les minutes
    } catch (error) {
      logger.error('Error observing network:', error);
    }
  }

  /**
   * Obtenir les métriques actuelles
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Réinitialiser les métriques
   */
  resetMetrics() {
    this.metrics = {};
  }

  /**
   * Arrêter le monitoring
   */
  stopMonitoring() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Instance globale du monitor de performance
 */
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Initialiser le monitoring de performance
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  
  return performanceMonitor;
}

/**
 * Obtenir le monitor de performance
 */
export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}


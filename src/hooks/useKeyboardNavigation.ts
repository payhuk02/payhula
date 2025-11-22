/**
 * Hook pour améliorer la navigation clavier
 * Fournit des raccourcis clavier et une meilleure gestion du focus
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface KeyboardNavigationOptions {
  /**
   * Raccourcis clavier personnalisés
   * Format: { key: 'k', ctrlKey: true, handler: () => {} }
   */
  shortcuts?: Array<{
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    handler: () => void;
    description?: string;
  }>;
  /**
   * Activer la navigation par flèches
   */
  arrowNavigation?: boolean;
  /**
   * Élément à focuser au montage
   */
  initialFocus?: React.RefObject<HTMLElement>;
  /**
   * Activer la navigation par Tab améliorée
   */
  enhancedTabNavigation?: boolean;
}

/**
 * Hook pour améliorer la navigation clavier
 */
export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    shortcuts = [],
    arrowNavigation = false,
    initialFocus,
    enhancedTabNavigation = false,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Vérifier les raccourcis personnalisés
      for (const shortcut of shortcuts) {
        const matches =
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey) &&
          (shortcut.shiftKey ? e.shiftKey : !e.shiftKey) &&
          (shortcut.altKey ? e.altKey : !e.altKey);

        if (matches) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }

      // Navigation par flèches
      if (arrowNavigation && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const currentIndex = Array.from(focusableElements).indexOf(
          document.activeElement as HTMLElement
        );

        if (e.key === 'ArrowDown' && currentIndex < focusableElements.length - 1) {
          e.preventDefault();
          focusableElements[currentIndex + 1]?.focus();
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          e.preventDefault();
          focusableElements[currentIndex - 1]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, arrowNavigation]);

  // Focus initial
  useEffect(() => {
    if (initialFocus?.current) {
      initialFocus.current.focus();
    }
  }, [initialFocus]);

  // Navigation Tab améliorée
  useEffect(() => {
    if (!enhancedTabNavigation) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Si on est sur le dernier élément et qu'on appuie sur Tab, aller au premier
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [enhancedTabNavigation]);

  const setContainerRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  return {
    containerRef: setContainerRef,
  };
};

/**
 * Raccourcis clavier globaux pour l'application
 */
export const useGlobalKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K : Recherche globale
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Ouvrir la recherche globale
        logger.debug('Recherche globale (à implémenter)');
      }

      // Escape : Fermer les modales
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        const lastModal = modals[modals.length - 1] as HTMLElement;
        if (lastModal) {
          const closeButton = lastModal.querySelector<HTMLElement>('[aria-label*="fermer"], [aria-label*="close"]');
          closeButton?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};


/**
 * Contexte pour la personnalisation de la plateforme en temps réel
 * Applique les changements immédiatement dans toute l'application
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

interface PlatformCustomizationContextType {
  customizationData: any;
  applyCustomization: () => void;
  previewMode: boolean;
}

const PlatformCustomizationContext = createContext<PlatformCustomizationContextType | undefined>(undefined);

export const PlatformCustomizationProvider = ({ children }: { children: ReactNode }) => {
  const { customizationData, load } = usePlatformCustomization();
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (customizationData?.design) {
      applyDesignCustomization(customizationData.design);
    }
  }, [customizationData]);

  const applyDesignCustomization = (design: any) => {
    if (!design) return;

    const root = document.documentElement;

    // Appliquer les couleurs
    if (design.colors) {
      Object.entries(design.colors).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Convertir HSL en format CSS variable
          const hslValue = value.replace('hsl(', '').replace(')', '');
          root.style.setProperty(`--${key}`, hslValue);
          
          // Appliquer aussi aux variantes (primary-foreground, etc.)
          if (key === 'primary') {
            root.style.setProperty('--primary-foreground', '0 0% 100%');
          }
        }
      });
    }

    // Appliquer le thème
    if (design.theme) {
      if (design.theme === 'dark') {
        root.classList.add('dark');
      } else if (design.theme === 'light') {
        root.classList.remove('dark');
      } else if (design.theme === 'auto') {
        // Suivre les préférences système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }
  };

  const applyCustomization = () => {
    if (customizationData?.design) {
      applyDesignCustomization(customizationData.design);
    }
  };

  return (
    <PlatformCustomizationContext.Provider
      value={{
        customizationData,
        applyCustomization,
        previewMode,
      }}
    >
      {children}
    </PlatformCustomizationContext.Provider>
  );
};

export const usePlatformCustomizationContext = () => {
  const context = useContext(PlatformCustomizationContext);
  if (!context) {
    throw new Error('usePlatformCustomizationContext must be used within PlatformCustomizationProvider');
  }
  return context;
};


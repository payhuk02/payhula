/**
 * Hook pour gérer la personnalisation de la plateforme
 * Centralise toutes les opérations de sauvegarde et chargement
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

export interface PlatformCustomizationData {
  design?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
    logo?: {
      light?: string;
      dark?: string;
      favicon?: string;
    };
    typography?: {
      fontFamily?: string;
      fontSize?: Record<string, string>;
    };
    theme?: 'light' | 'dark' | 'auto';
    tokens?: {
      borderRadius?: string;
      shadow?: string;
      spacing?: string;
    };
  };
  settings?: {
    commissions?: {
      platformRate?: number;
      referralRate?: number;
    };
    withdrawals?: {
      minAmount?: number;
      autoApprove?: boolean;
    };
    limits?: {
      maxProducts?: number;
      maxStores?: number;
    };
  };
  content?: {
    texts?: Record<string, string>;
    emails?: Record<string, any>;
    notifications?: Record<string, any>;
  };
  integrations?: {
    payment?: Record<string, any>;
    shipping?: Record<string, any>;
    analytics?: Record<string, any>;
  };
  security?: {
    requireAAL2?: string[];
    permissions?: Record<string, any>;
  };
  features?: {
    enabled?: string[];
    disabled?: string[];
  };
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    channels?: Record<string, any>;
  };
  pages?: Record<string, Record<string, any>>;
}

export const usePlatformCustomization = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [customizationData, setCustomizationData] = useState<PlatformCustomizationData>({});
  const customizationDataRef = useRef<PlatformCustomizationData>({});
  const { toast } = useToast();
  
  // Synchroniser le ref avec le state
  useEffect(() => {
    customizationDataRef.current = customizationData;
  }, [customizationData]);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('settings')
        .eq('key', 'customization')
        .maybeSingle();

      if (error) {
        // Si la table n'existe pas encore ou si la clé n'existe pas, on continue avec des données vides
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('Customization settings not found, using defaults');
          return;
        }
        // Pour les autres erreurs, on log mais on ne bloque pas
        console.warn('Error loading customization settings:', error);
        return;
      }
      
      if (data?.settings) {
        setCustomizationData(data.settings as PlatformCustomizationData);
      }
    } catch (error: any) {
      // Gestion silencieuse des erreurs pour ne pas bloquer le chargement de la page
      console.warn('Error loading customization:', error);
    }
  }, []);

  const save = useCallback(async (section: string, data: any) => {
    try {
      setIsSaving(true);
      
      // Utiliser le ref pour avoir les données les plus récentes
      const currentData = customizationDataRef.current;
      
      // Fusionner les données existantes avec les nouvelles
      const updatedData = {
        ...currentData,
        [section]: {
          ...currentData?.[section as keyof PlatformCustomizationData],
          ...data,
        },
      };
      
      // Mettre à jour l'état local immédiatement
      setCustomizationData(updatedData);
      
      // Si on est en mode preview, on ne sauvegarde pas en base mais on met à jour l'état local
      if (previewMode) {
        setIsSaving(false);
        return true;
      }
      
      // Sauvegarder dans Supabase
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'customization',
          settings: updatedData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Déclencher l'événement pour synchroniser avec la plateforme
      window.dispatchEvent(new CustomEvent('platform-customization-updated', {
        detail: { customizationData: updatedData }
      }));

      setIsSaving(false);
      return true;
    } catch (error: any) {
      console.error('Error saving customization:', error);
      toast({
        title: 'Erreur de sauvegarde',
        description: error.message,
        variant: 'destructive',
      });
      setIsSaving(false);
      return false;
    }
  }, [toast, previewMode]);

  const saveAll = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Si on est en mode preview, on ne sauvegarde pas en base
      if (previewMode) {
        console.log('Preview mode: changes not saved to database');
        setIsSaving(false);
        return true;
      }
      
      // Utiliser le ref pour avoir les données les plus récentes
      const currentData = customizationDataRef.current;
      
      // Supabase upsert avec gestion du conflit sur la clé primaire
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'customization',
          settings: currentData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Déclencher l'événement pour synchroniser avec la plateforme
      window.dispatchEvent(new CustomEvent('platform-customization-updated', {
        detail: { customizationData: currentData }
      }));

      return true;
    } catch (error: any) {
      console.error('Error saving all customization:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [previewMode]);

  const togglePreview = useCallback(() => {
    setPreviewMode(prev => !prev);
  }, []);

  return {
    customizationData,
    setCustomizationData,
    load,
    save,
    saveAll,
    isSaving,
    previewMode,
    togglePreview,
  };
};


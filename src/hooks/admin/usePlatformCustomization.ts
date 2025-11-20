/**
 * Hook pour gérer la personnalisation de la plateforme
 * Centralise toutes les opérations de sauvegarde et chargement
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export const usePlatformCustomization = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [customizationData, setCustomizationData] = useState<PlatformCustomizationData>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('settings')
        .eq('key', 'customization')
        .maybeSingle();

      if (error) {
        // Si la table n'existe pas encore, on continue avec des données vides
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('Customization settings table not found, using defaults');
          return;
        }
        throw error;
      }
      
      if (data?.settings) {
        setCustomizationData(data.settings as PlatformCustomizationData);
      }
    } catch (error: any) {
      console.error('Error loading customization:', error);
      // Ne pas afficher de toast si c'est juste que la table n'existe pas
      if (error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
        toast({
          title: 'Erreur de chargement',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const save = useCallback(async (section: string, data: any) => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'customization',
          settings: {
            ...customizationData,
            [section]: data,
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      setCustomizationData(prev => ({
        ...prev,
        [section]: data,
      }));

      return true;
    } catch (error: any) {
      console.error('Error saving customization:', error);
      toast({
        title: 'Erreur de sauvegarde',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [customizationData, toast]);

  const saveAll = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'customization',
          settings: customizationData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error saving all customization:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [customizationData]);

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


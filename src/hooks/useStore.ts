import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from '@/lib/logger';

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  default_currency?: string;
  custom_domain: string | null;
  domain_status: string | null;
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  domain_error_message: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
}

export const useStore = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const checkSlugAvailability = async (slug: string, excludeStoreId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_store_slug_available', {
        check_slug: slug,
        exclude_store_id: excludeStoreId || null
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      logger.error('Error checking slug availability:', error);
      return false;
    }
  };

  const getStoreDomain = (): string => {
    if (store?.custom_domain) {
      return store.custom_domain;
    }
    
    // Utiliser le domaine actuel (Lovable ou custom)
    const currentDomain = window.location.hostname;
    return currentDomain;
  };

  const getStoreUrl = (): string => {
    if (!store) return '';
    
    const slug = store.slug;
    
    // Si un domaine personnalisé est configuré, utiliser le format sous-domaine
    if (store.custom_domain) {
      return `https://${slug}.${store.custom_domain}`;
    }
    
    // Sinon, utiliser le format local avec /stores/
    return `${window.location.origin}/stores/${slug}`;
  };

  const getProductUrl = (productSlug: string): string => {
    if (!store) return '';
    
    const slug = store.slug;
    
    // Si un domaine personnalisé est configuré, utiliser le format sous-domaine
    if (store.custom_domain) {
      return `https://${slug}.${store.custom_domain}/${productSlug}`;
    }
    
    // Sinon, utiliser le format local avec /stores/.../products/
    return `${window.location.origin}/stores/${slug}/products/${productSlug}`;
  };

  const fetchStore = useCallback(async () => {
    try {
      logger.info('🔍 [useStore] fetchStore appelé', { authLoading, userId: user?.id });
      
      // Attendre que l'authentification soit chargée
      if (authLoading) {
        logger.info('⏳ [useStore] En attente de l\'auth...');
        return;
      }

      setLoading(true);
      logger.info('🔄 [useStore] setLoading(true)');
      
      if (!user) {
        logger.info('❌ [useStore] Pas d\'utilisateur, setStore(null)');
        setStore(null);
        setLoading(false);
        return;
      }

      // Récupérer la première boutique de l'utilisateur
      logger.info('📡 [useStore] Récupération de la première boutique pour user:', user.id);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        logger.error('❌ [useStore] Erreur:', error);
        setStore(null);
        setLoading(false);
        return;
      }
      
      // Prendre le premier résultat s'il y en a un
      const storeData = data && data.length > 0 ? data[0] : null;
      logger.info('✅ [useStore] Première boutique récupérée:', storeData?.id || 'null', storeData?.name);
      setStore(storeData);
    } catch (error) {
      logger.error('💥 [useStore] Exception:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre boutique",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      logger.info('✅ [useStore] setLoading(false)');
    }
  }, [user, authLoading, toast]);

  const createStore = async (name: string, description?: string) => {
    try {
      if (!user) throw new Error("Non authentifié");

      // Vérifier si l'utilisateur a déjà une boutique
      const { data: existingStores, error: checkError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) {
        logger.error('Error checking existing stores:', checkError);
        throw checkError;
      }

      if (existingStores && existingStores.length > 0) {
        toast({
          title: "Boutique existante",
          description: "Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur.",
          variant: "destructive"
        });
        return false;
      }

      const slug = generateSlug(name);
      
      // Vérifier disponibilité
      const isAvailable = await checkSlugAvailability(slug);
      if (!isAvailable) {
        toast({
          title: "Nom indisponible",
          description: "Ce nom de boutique est déjà utilisé. Essayez un autre nom.",
          variant: "destructive"
        });
        return false;
      }

      const { data, error } = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          name,
          slug,
          description: description || null
        })
        .select()
        .limit(1);

      if (error) throw error;

      setStore(data && data.length > 0 ? data[0] : null);
      toast({
        title: "Boutique créée !",
        description: `Votre boutique "${name}" est maintenant en ligne.`
      });
      return true;
    } catch (error) {
      logger.error('Error creating store:', error);
      
      // Gérer l'erreur spécifique de limite de la base de données
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message;
        if (errorMessage && (errorMessage.includes('Limite de 3 boutiques') || errorMessage.includes('déjà une boutique'))) {
          toast({
            title: "Boutique existante",
            description: "Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur.",
            variant: "destructive"
          });
          return false;
        }
      }
      
      toast({
        title: "Erreur",
        description: "Impossible de créer votre boutique",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateStore = async (updates: Partial<Store>) => {
    if (!store) return false;

    try {
      let updateData: Partial<Store> = { ...updates };

      // Si le nom change, regénérer le slug
      if (updates.name && updates.name !== store.name) {
        const newSlug = generateSlug(updates.name);
        const isAvailable = await checkSlugAvailability(newSlug, store.id);
        
        if (!isAvailable) {
          toast({
            title: "Nom indisponible",
            description: "Ce nom de boutique est déjà utilisé.",
            variant: "destructive"
          });
          return false;
        }
        
        updateData.slug = newSlug;
      }

      const { data, error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', store.id)
        .select()
        .limit(1);

      if (error) throw error;

      setStore(data && data.length > 0 ? data[0] : store);
      toast({
        title: "Boutique mise à jour",
        description: "Les modifications ont été enregistrées."
      });
      return true;
    } catch (error) {
      logger.error('Error updating store:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre boutique",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchStore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]); // ✅ Utiliser user?.id (primitive) au lieu de user (objet) pour éviter re-renders

  return {
    store,
    loading: loading || authLoading, // Attendre que l'auth ET le store soient chargés
    createStore,
    updateStore,
    refreshStore: fetchStore,
    getStoreUrl,
    getProductUrl,
    generateSlug,
    checkSlugAvailability
  };
};

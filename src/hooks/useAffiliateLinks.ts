/**
 * Hook: useAffiliateLinks
 * Description: Gestion des liens d'affiliation
 * Date: 25/10/2025
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AffiliateLink, 
  CreateAffiliateLinkForm,
  LinkFilters,
  PaginationParams
} from '@/types/affiliate';
import { logger } from '@/lib/logger';
import { handleSupabaseError, AffiliateErrors } from '@/lib/affiliate-errors';

export const useAffiliateLinks = (
  affiliateId?: string, 
  filters?: LinkFilters,
  pagination?: PaginationParams
) => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pagination?.page || 1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 20);
  const { toast } = useToast();

  const fetchLinks = async (currentPage: number = page) => {
    try {
      setLoading(true);

      // Compter le total
      let countQuery = supabase
        .from('affiliate_links')
        .select('*', { count: 'exact', head: true });

      if (affiliateId) {
        countQuery = countQuery.eq('affiliate_id', affiliateId);
      }

      if (filters?.status) {
        countQuery = countQuery.eq('status', filters.status);
      }

      if (filters?.product_id) {
        countQuery = countQuery.eq('product_id', filters.product_id);
      }

      if (filters?.store_id) {
        countQuery = countQuery.eq('store_id', filters.store_id);
      }

      if (filters?.search) {
        countQuery = countQuery.or(`link_code.ilike.%${filters.search}%,full_url.ilike.%${filters.search}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count || 0);

      // Requête principale avec pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('affiliate_links')
        .select(`
          *,
          product:products!inner(
            id,
            name,
            slug,
            price,
            image_url,
            store:stores!inner(name, slug)
          ),
          affiliate:affiliates!inner(display_name, affiliate_code)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      if (filters?.search) {
        query = query.or(`link_code.ilike.%${filters.search}%,full_url.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        const affiliateError = handleSupabaseError(error);
        throw affiliateError;
      }

      setLinks(data || []);
      setPage(currentPage);
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error fetching affiliate links:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (
    affiliateId: string,
    formData: CreateAffiliateLinkForm
  ): Promise<AffiliateLink | null> => {
    try {
      // Vérifier que le produit a l'affiliation activée
      const { data: settingsData, error: settingsError } = await supabase
        .from('product_affiliate_settings')
        .select(`
          *,
          product:products!inner(slug, store_id, name)
        `)
        .eq('product_id', formData.product_id)
        .eq('affiliate_enabled', true)
        .single();

      if (settingsError || !settingsData) {
        throw AffiliateErrors.productAffiliateDisabled(formData.product_id);
      }

      // Récupérer le code de l'affilié
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('affiliate_code')
        .eq('id', affiliateId)
        .single();

      if (affiliateError || !affiliateData) {
        throw AffiliateErrors.affiliateNotFound(affiliateId);
      }

      // Générer le code du lien
      const { data: codeData, error: codeError } = await supabase.rpc('generate_affiliate_link_code', {
        p_affiliate_code: affiliateData.affiliate_code,
        p_product_slug: settingsData.product.slug,
      });

      if (codeError) {
        throw handleSupabaseError(codeError);
      }

      // Générer l'URL complète
      const baseUrl = window.location.origin;
      const storeSlug = settingsData.product.store_id; // TODO: Adapter selon votre routing
      const productUrl = `${baseUrl}/${storeSlug}/products/${settingsData.product.slug}`;
      const fullUrl = `${productUrl}?aff=${codeData}`;

      // Créer le lien
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert({
          affiliate_id: affiliateId,
          product_id: formData.product_id,
          store_id: settingsData.product.store_id,
          link_code: codeData,
          full_url: fullUrl,
          utm_source: formData.utm_source,
          utm_medium: formData.utm_medium,
          utm_campaign: formData.utm_campaign,
          custom_parameters: formData.custom_parameters,
        })
        .select(`
          *,
          product:products(id, name, slug, price, image_url)
        `)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({
        title: 'Lien créé ! 🔗',
        description: `Lien pour "${settingsData.product.name}"`,
      });

      await fetchLinks(page);
      return data;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error creating affiliate link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return null;
    }
  };

  const pauseLink = async (linkId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .update({ status: 'paused' })
        .eq('id', linkId);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Lien mis en pause',
        description: 'Les clics ne seront plus comptabilisés' 
      });
      
      await fetchLinks(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error pausing link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const activateLink = async (linkId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .update({ status: 'active' })
        .eq('id', linkId);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Lien activé ✅',
        description: 'Le lien est à nouveau opérationnel' 
      });
      
      await fetchLinks(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error activating link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLink = async (linkId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .update({ status: 'deleted' })
        .eq('id', linkId);

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Lien supprimé',
        description: 'Le lien a été désactivé' 
      });
      
      await fetchLinks(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error deleting link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  };

  const copyLink = async (link: AffiliateLink): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(link.full_url);
      
      toast({
        title: 'Lien copié ! 📋',
        description: 'Le lien a été copié dans le presse-papier',
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (affiliateId || filters) {
      fetchLinks(page);
    }
  }, [affiliateId, JSON.stringify(filters), page, pageSize]);

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLinks(newPage);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      goToPage(page + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      goToPage(page - 1);
    }
  };

  return {
    links,
    loading,
    // Pagination
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    // CRUD
    createLink,
    pauseLink,
    activateLink,
    deleteLink,
    copyLink,
    refetch: () => fetchLinks(page),
  };
};

/**
 * Hook: useLinkStats
 * Description: Statistiques d'un lien spécifique
 */
export const useLinkStats = (linkId?: string) => {
  const [stats, setStats] = useState<{
    total_clicks: number;
    total_sales: number;
    total_revenue: number;
    total_commission: number;
    conversion_rate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!linkId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('affiliate_links')
          .select('total_clicks, total_sales, total_revenue, total_commission')
          .eq('id', linkId)
          .single();

        if (error) throw error;

        const conversion_rate = data.total_clicks > 0 
          ? (data.total_sales / data.total_clicks) * 100 
          : 0;

        setStats({
          ...data,
          conversion_rate,
        });
      } catch (error) {
        logger.error('Error fetching link stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [linkId]);

  return { stats, loading };
};


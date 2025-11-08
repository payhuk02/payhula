/**
 * Hook pour gérer les affiliés d'un store
 * Permet aux vendeurs de voir leurs affiliés, gérer les paramètres et approuver les commissions
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface StoreAffiliate {
  id: string;
  affiliate_id: string;
  user_id: string;
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  affiliate_code: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission: number;
  pending_commission: number;
  created_at: string;
  updated_at: string;
}

export interface StoreAffiliateStats {
  total_affiliates: number;
  active_affiliates: number;
  pending_affiliates: number;
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commissions_paid: number;
  pending_commissions: number;
}

export interface StoreAffiliateLink {
  id: string;
  affiliate_id: string;
  product_id: string;
  link_code: string;
  full_url: string;
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission: number;
  status: 'active' | 'paused' | 'archived';
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url?: string;
  };
  affiliate?: {
    email: string;
    display_name?: string;
  };
}

export interface StoreAffiliateCommission {
  id: string;
  affiliate_id: string;
  affiliate_link_id: string;
  product_id: string;
  order_id: string;
  order_total: number;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  commission_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  updated_at: string;
  affiliate?: {
    email: string;
    display_name?: string;
  };
  product?: {
    name: string;
    image_url?: string;
  };
  order?: {
    order_number: string;
  };
}

/**
 * Récupère tous les affiliés d'un store
 */
export const useStoreAffiliates = (storeId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les affiliés
  const { data: affiliates = [], isLoading, error } = useQuery({
    queryKey: ['store-affiliates', storeId],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('affiliates')
        .select(`
          *,
          profiles!affiliates_user_id_fkey(
            email,
            full_name,
            display_name
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return (data || []).map((affiliate: any) => ({
        id: affiliate.id,
        affiliate_id: affiliate.id,
        user_id: affiliate.user_id,
        email: affiliate.profiles?.email || '',
        display_name: affiliate.profiles?.display_name || affiliate.profiles?.full_name || '',
        first_name: affiliate.profiles?.full_name?.split(' ')[0] || '',
        last_name: affiliate.profiles?.full_name?.split(' ').slice(1).join(' ') || '',
        affiliate_code: affiliate.affiliate_code,
        status: affiliate.status,
        total_clicks: affiliate.total_clicks || 0,
        total_sales: affiliate.total_sales || 0,
        total_revenue: affiliate.total_revenue || 0,
        total_commission: affiliate.total_commission_earned || 0,
        pending_commission: affiliate.pending_commission || 0,
        created_at: affiliate.created_at,
        updated_at: affiliate.updated_at,
      })) as StoreAffiliate[];
    },
    enabled: !!storeId,
  });

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ['store-affiliate-stats', storeId],
    queryFn: async () => {
      const { data: affiliatesData } = await supabase
        .from('affiliates')
        .select('status, total_clicks, total_sales, total_revenue, total_commission_earned, pending_commission')
        .eq('store_id', storeId);

      if (!affiliatesData) return null;

      const stats: StoreAffiliateStats = {
        total_affiliates: affiliatesData.length,
        active_affiliates: affiliatesData.filter(a => a.status === 'active').length,
        pending_affiliates: affiliatesData.filter(a => a.status === 'pending').length,
        total_clicks: affiliatesData.reduce((sum, a) => sum + (a.total_clicks || 0), 0),
        total_sales: affiliatesData.reduce((sum, a) => sum + (a.total_sales || 0), 0),
        total_revenue: affiliatesData.reduce((sum, a) => sum + (a.total_revenue || 0), 0),
        total_commissions_paid: affiliatesData.reduce((sum, a) => sum + (a.total_commission_earned || 0), 0),
        pending_commissions: affiliatesData.reduce((sum, a) => sum + (a.pending_commission || 0), 0),
      };

      return stats;
    },
    enabled: !!storeId,
  });

  // Récupérer les liens d'affiliation
  const { data: links = [] } = useQuery({
    queryKey: ['store-affiliate-links', storeId],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('affiliate_links')
        .select(`
          *,
          products(
            id,
            name,
            slug,
            price,
            image_url
          ),
          affiliates(
            email,
            display_name
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return (data || []).map((link: any) => ({
        id: link.id,
        affiliate_id: link.affiliate_id,
        product_id: link.product_id,
        link_code: link.link_code,
        full_url: link.full_url,
        total_clicks: link.total_clicks || 0,
        total_sales: link.total_sales || 0,
        total_revenue: link.total_revenue || 0,
        total_commission: link.total_commission || 0,
        status: link.status,
        product: link.products ? {
          id: link.products.id,
          name: link.products.name,
          slug: link.products.slug,
          price: link.products.price,
          image_url: link.products.image_url,
        } : undefined,
        affiliate: link.affiliates ? {
          email: link.affiliates.email,
          display_name: link.affiliates.display_name,
        } : undefined,
      })) as StoreAffiliateLink[];
    },
    enabled: !!storeId,
  });

  // Récupérer les commissions
  const { data: commissions = [] } = useQuery({
    queryKey: ['store-affiliate-commissions', storeId],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          affiliates(
            email,
            display_name
          ),
          products(
            name,
            image_url
          ),
          orders(
            order_number
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      return (data || []).map((commission: any) => ({
        id: commission.id,
        affiliate_id: commission.affiliate_id,
        affiliate_link_id: commission.affiliate_link_id,
        product_id: commission.product_id,
        order_id: commission.order_id,
        order_total: commission.order_total,
        commission_rate: commission.commission_rate,
        commission_type: commission.commission_type,
        commission_amount: commission.commission_amount,
        status: commission.status,
        created_at: commission.created_at,
        updated_at: commission.updated_at,
        affiliate: commission.affiliates ? {
          email: commission.affiliates.email,
          display_name: commission.affiliates.display_name,
        } : undefined,
        product: commission.products ? {
          name: commission.products.name,
          image_url: commission.products.image_url,
        } : undefined,
        order: commission.orders ? {
          order_number: commission.orders.order_number,
        } : undefined,
      })) as StoreAffiliateCommission[];
    },
    enabled: !!storeId,
  });

  // Approuver un affilié
  const approveAffiliate = useMutation({
    mutationFn: async (affiliateId: string) => {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', affiliateId)
        .eq('store_id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-affiliates', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-affiliate-stats', storeId] });
      toast({
        title: '✅ Affilié approuvé',
        description: 'L\'affilié a été approuvé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error approving affiliate', { error });
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Rejeter un affilié
  const rejectAffiliate = useMutation({
    mutationFn: async (affiliateId: string) => {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', affiliateId)
        .eq('store_id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-affiliates', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-affiliate-stats', storeId] });
      toast({
        title: '✅ Affilié rejeté',
        description: 'L\'affilié a été rejeté',
      });
    },
    onError: (error: Error) => {
      logger.error('Error rejecting affiliate', { error });
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Suspendre un affilié
  const suspendAffiliate = useMutation({
    mutationFn: async (affiliateId: string) => {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', affiliateId)
        .eq('store_id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-affiliates', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-affiliate-stats', storeId] });
      toast({
        title: '✅ Affilié suspendu',
        description: 'L\'affilié a été suspendu',
      });
    },
    onError: (error: Error) => {
      logger.error('Error suspending affiliate', { error });
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approuver une commission
  const approveCommission = useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-affiliate-commissions', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-affiliate-stats', storeId] });
      toast({
        title: '✅ Commission approuvée',
        description: 'La commission a été approuvée avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error approving commission', { error });
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Rejeter une commission
  const rejectCommission = useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-affiliate-commissions', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-affiliate-stats', storeId] });
      toast({
        title: '✅ Commission rejetée',
        description: 'La commission a été rejetée',
      });
    },
    onError: (error: Error) => {
      logger.error('Error rejecting commission', { error });
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    affiliates,
    stats,
    links,
    commissions,
    isLoading,
    error,
    approveAffiliate,
    rejectAffiliate,
    suspendAffiliate,
    approveCommission,
    rejectCommission,
  };
};


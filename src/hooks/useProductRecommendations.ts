import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  product_slug: string;
  store_id: string;
  store_name: string;
  store_slug: string;
  image_url: string | null;
  price: number;
  promotional_price: number | null;
  currency: string;
  category: string | null;
  product_type: string | null;
  rating: number | null;
  reviews_count: number | null;
  purchases_count: number;
  recommendation_score: number;
  recommendation_reason: string;
  recommendation_type: 'similar' | 'category' | 'tags' | 'popular' | 'purchase_history';
}

export interface FrequentlyBoughtTogether extends ProductRecommendation {
  times_bought_together: number;
}

/**
 * Hook pour obtenir des recommandations de produits basées sur un produit
 */
export function useProductRecommendations(
  productId: string | null,
  limit: number = 6,
  enabled: boolean = true
) {
  return useQuery<ProductRecommendation[]>({
    queryKey: ['product-recommendations', productId, limit],
    queryFn: async () => {
      if (!productId) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_product_recommendations', {
          p_product_id: productId,
          p_limit: limit,
        });

        if (error) {
          logger.error('Error fetching product recommendations:', error);
          throw error;
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        logger.error('Error in useProductRecommendations:', error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour obtenir des recommandations personnalisées basées sur l'historique d'achat
 */
export function useUserProductRecommendations(
  userId: string | null,
  limit: number = 6,
  enabled: boolean = true
) {
  return useQuery<ProductRecommendation[]>({
    queryKey: ['user-product-recommendations', userId, limit],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_user_product_recommendations', {
          p_user_id: userId,
          p_limit: limit,
        });

        if (error) {
          logger.error('Error fetching user product recommendations:', error);
          throw error;
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        logger.error('Error in useUserProductRecommendations:', error);
        return [];
      }
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour obtenir les produits fréquemment achetés ensemble
 */
export function useFrequentlyBoughtTogether(
  productId: string | null,
  limit: number = 4,
  enabled: boolean = true
) {
  return useQuery<FrequentlyBoughtTogether[]>({
    queryKey: ['frequently-bought-together', productId, limit],
    queryFn: async () => {
      if (!productId) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_frequently_bought_together', {
          p_product_id: productId,
          p_limit: limit,
        });

        if (error) {
          logger.error('Error fetching frequently bought together:', error);
          throw error;
        }

        return (data || []) as FrequentlyBoughtTogether[];
      } catch (error) {
        logger.error('Error in useFrequentlyBoughtTogether:', error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 15 * 60 * 1000, // 15 minutes (moins fréquent)
    refetchOnWindowFocus: false,
  });
}




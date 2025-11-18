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
          // Codes d'erreur PostgreSQL/Supabase courants
          const errorCode = error.code;
          const errorMessage = error.message || '';
          
          // Fonction n'existe pas (42883 = undefined_function)
          if (errorCode === '42883' || 
              errorMessage.includes('does not exist') || 
              (errorMessage.includes('function') && errorMessage.includes('does not exist'))) {
            logger.warn('get_product_recommendations function does not exist. This is normal if not yet created.');
            return [];
          }
          
          // Erreur 400 Bad Request
          if (errorCode === 'PGRST116' || errorMessage.includes('Bad Request') || errorMessage.includes('400')) {
            logger.warn('Bad Request error for get_product_recommendations. This may indicate the function needs to be created.');
            return [];
          }
          
          // Pour toutes les autres erreurs, logger en warning (non-critique)
          logger.warn('Error fetching product recommendations (non-critical):', {
            code: errorCode,
            message: errorMessage,
          });
          
          return [];
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        // Capturer toutes les erreurs et retourner un tableau vide
        logger.warn('Error in useProductRecommendations (non-critical):', error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Ne pas réessayer en cas d'erreur pour éviter le spam
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

      // Valider que userId est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        logger.warn('Invalid userId format for recommendations:', userId);
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_user_product_recommendations', {
          p_user_id: userId,
          p_limit: limit,
        });

        if (error) {
          // Codes d'erreur PostgreSQL/Supabase courants
          const errorCode = error.code;
          const errorMessage = error.message || '';
          
          // Fonction n'existe pas (42883 = undefined_function)
          if (errorCode === '42883' || 
              errorMessage.includes('does not exist') || 
              (errorMessage.includes('function') && errorMessage.includes('does not exist'))) {
            logger.warn('get_user_product_recommendations function does not exist. Run FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql to create it.');
            return [];
          }
          
          // Erreur de paramètres invalides (P0001 = raise_exception, 22023 = invalid_parameter_value)
          if (errorCode === 'P0001' || errorCode === '22023' || errorMessage.includes('invalid input') || errorMessage.includes('invalid parameter')) {
            logger.warn('Invalid parameters for get_user_product_recommendations:', errorMessage);
            return [];
          }
          
          // Erreur 400 Bad Request (généralement problème de format ou de validation)
          if (errorCode === 'PGRST116' || errorMessage.includes('Bad Request') || errorMessage.includes('400')) {
            logger.warn('Bad Request error for get_user_product_recommendations. This may indicate the function needs to be recreated or tables are missing.');
            logger.warn('Error details for get_user_product_recommendations', {
              code: errorCode,
              message: errorMessage,
              details: error.details,
              hint: error.hint,
            });
            return [];
          }
          
          // Erreur de permissions (42501 = insufficient_privilege)
          if (errorCode === '42501' || errorMessage.includes('permission denied')) {
            logger.warn('Permission denied for get_user_product_recommendations. Check RLS policies.');
            return [];
          }
          
          // Pour toutes les autres erreurs, logger en warning (non-critique)
          logger.warn('Error fetching user product recommendations (non-critical):', {
            code: errorCode,
            message: errorMessage,
            details: error.details,
            hint: error.hint,
            userId,
          });
          
          // Retourner un tableau vide au lieu de lever une erreur pour ne pas bloquer l'UI
          return [];
        }

        return (data || []) as ProductRecommendation[];
      } catch (error) {
        // Capturer toutes les erreurs et retourner un tableau vide
        logger.warn('Error in useUserProductRecommendations (non-critical):', error);
        return [];
      }
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: false, // Ne pas réessayer en cas d'erreur pour éviter le spam
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
          // Codes d'erreur PostgreSQL/Supabase courants
          const errorCode = error.code;
          const errorMessage = error.message || '';
          
          // Fonction n'existe pas (42883 = undefined_function)
          if (errorCode === '42883' || 
              errorMessage.includes('does not exist') || 
              (errorMessage.includes('function') && errorMessage.includes('does not exist'))) {
            logger.warn('get_frequently_bought_together function does not exist. This is normal if not yet created.');
            return [];
          }
          
          // Erreur 400 Bad Request (généralement problème de format ou de validation)
          if (errorCode === 'PGRST116' || errorMessage.includes('Bad Request') || errorMessage.includes('400')) {
            logger.warn('Bad Request error for get_frequently_bought_together. This may indicate the function needs to be created or tables are missing.');
            return [];
          }
          
          // Erreur de permissions (42501 = insufficient_privilege)
          if (errorCode === '42501' || errorMessage.includes('permission denied')) {
            logger.warn('Permission denied for get_frequently_bought_together. Check RLS policies.');
            return [];
          }
          
          // Pour toutes les autres erreurs, logger en warning (non-critique)
          logger.warn('Error fetching frequently bought together (non-critical):', {
            code: errorCode,
            message: errorMessage,
            details: error.details,
            hint: error.hint,
          });
          
          // Retourner un tableau vide au lieu de lever une erreur pour ne pas bloquer l'UI
          return [];
        }

        return (data || []) as FrequentlyBoughtTogether[];
      } catch (error) {
        // Capturer toutes les erreurs et retourner un tableau vide
        logger.warn('Error in useFrequentlyBoughtTogether (non-critical):', error);
        return [];
      }
    },
    enabled: enabled && !!productId,
    staleTime: 15 * 60 * 1000, // 15 minutes (moins fréquent)
    refetchOnWindowFocus: false,
    retry: false, // Ne pas réessayer en cas d'erreur pour éviter le spam
  });
}




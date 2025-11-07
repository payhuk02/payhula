/**
 * Global Gamification Hook
 * Date: 30 Janvier 2025
 * 
 * Hook pour gérer la gamification globale (points, badges, achievements, leaderboard)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

// =====================================================
// TYPES
// =====================================================

export interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  points_earned_today: number;
  points_earned_this_week: number;
  points_earned_this_month: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  current_level: number;
  experience_points: number;
  experience_points_to_next_level: number;
  total_products_purchased: number;
  total_orders_completed: number;
  total_reviews_written: number;
  total_referrals: number;
  total_badges_earned: number;
  total_achievements_unlocked: number;
  global_rank: number | null;
  monthly_rank: number | null;
  weekly_rank: number | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalBadge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  badge_type: 'purchase' | 'review' | 'referral' | 'streak' | 'level' | 'engagement' | 'custom';
  points_required: number;
  criteria: Record<string, any>;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  notification_sent: boolean;
  badge?: GlobalBadge;
}

export interface GlobalAchievement {
  id: string;
  title: string;
  description?: string;
  icon_url?: string;
  achievement_type: 'milestone' | 'challenge' | 'special' | 'custom';
  criteria: Record<string, any>;
  reward_points: number;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  notification_sent: boolean;
  achievement?: GlobalAchievement;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points_earned: number;
  points_before: number;
  points_after: number;
  source_type: 'purchase' | 'review' | 'referral' | 'streak' | 'achievement' | 'badge' | 'engagement' | 'manual';
  source_id?: string;
  source_description?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  total_points: number;
  current_level: number;
  current_streak_days: number;
  total_products_purchased: number;
  rank: number;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useUserGamification - Récupère la gamification d'un utilisateur
 */
export const useUserGamification = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-gamification', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        // Si l'utilisateur n'a pas encore de gamification, créer une entrée par défaut
        if (error.code === 'PGRST116') {
          const { data: newData, error: createError } = await supabase
            .from('user_gamification')
            .insert([{
              user_id: targetUserId,
              total_points: 0,
              experience_points: 0,
              current_level: 1,
              experience_points_to_next_level: 100,
            }])
            .select()
            .single();

          if (createError) throw createError;
          return newData as UserGamification;
        }
        throw error;
      }

      return data as UserGamification;
    },
    enabled: !!targetUserId,
  });
};

/**
 * useUserBadges - Récupère les badges d'un utilisateur
 */
export const useUserBadges = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-badges', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:global_badges(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserBadge[];
    },
    enabled: !!targetUserId,
  });
};

/**
 * useUserAchievements - Récupère les achievements d'un utilisateur
 */
export const useUserAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-achievements', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:global_achievements(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserAchievement[];
    },
    enabled: !!targetUserId,
  });
};

/**
 * useGlobalLeaderboard - Récupère le leaderboard global
 */
export const useGlobalLeaderboard = (limit: number = 10, period: 'all' | 'monthly' | 'weekly' = 'all') => {
  return useQuery({
    queryKey: ['global-leaderboard', limit, period],
    queryFn: async () => {
      let query = supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_points,
          current_level,
          current_streak_days,
          total_products_purchased,
          user:auth.users!user_gamification_user_id_fkey (
            id,
            raw_user_meta_data
          )
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Transformer les données
      const leaderboard: LeaderboardEntry[] = (data || []).map((entry, index) => ({
        user_id: entry.user_id,
        user_name: (entry.user as any)?.raw_user_meta_data?.full_name || 'Utilisateur',
        user_avatar: (entry.user as any)?.raw_user_meta_data?.avatar_url,
        total_points: entry.total_points,
        current_level: entry.current_level,
        current_streak_days: entry.current_streak_days,
        total_products_purchased: entry.total_products_purchased,
        rank: index + 1,
      }));

      return leaderboard;
    },
  });
};

/**
 * usePointsHistory - Récupère l'historique des points
 */
export const usePointsHistory = (userId?: string, limit: number = 20) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['points-history', targetUserId, limit],
    queryFn: async () => {
      if (!targetUserId) throw new Error('User ID manquant');

      const { data, error } = await supabase
        .from('user_points_history')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as PointsHistory[];
    },
    enabled: !!targetUserId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useAwardGlobalPoints - Attribuer des points globaux
 */
export const useAwardGlobalPoints = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      points,
      sourceType,
      sourceId,
      sourceDescription,
    }: {
      userId: string;
      points: number;
      sourceType: PointsHistory['source_type'];
      sourceId?: string;
      sourceDescription?: string;
    }) => {
      const { data, error } = await supabase.rpc('award_global_points', {
        p_user_id: userId,
        p_points: points,
        p_source_type: sourceType,
        p_source_id: sourceId || null,
        p_source_description: sourceDescription || null,
      });

      if (error) {
        logger.error('Error awarding global points', { error, userId, points });
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['points-history', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['global-leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements', variables.userId] });

      // Afficher une notification si level up
      if (data?.leveled_up) {
        toast({
          title: '🎉 Level Up !',
          description: `Vous êtes maintenant niveau ${data.level_after} !`,
        });
      } else {
        toast({
          title: `+ ${variables.points} points !`,
          description: variables.sourceDescription || 'Points gagnés',
        });
      }
    },
    onError: (error: any) => {
      logger.error('Error in useAwardGlobalPoints', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'attribuer les points',
        variant: 'destructive',
      });
    },
  });
};


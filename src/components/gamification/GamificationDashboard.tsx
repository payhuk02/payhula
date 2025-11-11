/**
 * Gamification Dashboard Component
 * Date: 30 Janvier 2025
 * 
 * Composant pour afficher le dashboard de gamification (points, badges, achievements, leaderboard)
 */

import { useUserGamification, useUserBadges, useUserAchievements, useGlobalLeaderboard, usePointsHistory } from '@/hooks/gamification/useGlobalGamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Award,
  Star,
  Users,
  Zap,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const GamificationDashboard = () => {
  // Utiliser useAuth normalement comme dans les autres composants
  const { user, loading: authLoading } = useAuth();

  // Extraire user?.id une seule fois pour éviter les recalculs
  const userId = user?.id;

  // Appeler tous les hooks AVANT le return conditionnel (règle de React)
  // Les hooks React Query sont automatiquement désactivés si userId est undefined grâce à 'enabled'
  // Passer userId explicitement pour éviter les appels multiples à useAuth dans les hooks
  const { data: gamification, isLoading: isLoadingGamification } = useUserGamification(userId);
  const { data: badges = [], isLoading: isLoadingBadges } = useUserBadges(userId);
  const { data: achievements = [], isLoading: isLoadingAchievements } = useUserAchievements(userId);
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useGlobalLeaderboard(10);
  const { data: pointsHistory = [], isLoading: isLoadingPoints } = usePointsHistory(userId, 10);

  // Si l'utilisateur n'est pas encore chargé, afficher un skeleton
  if (authLoading || !user || !userId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Combiner tous les états de chargement
  const isLoading = isLoadingGamification || isLoadingBadges || isLoadingAchievements || isLoadingLeaderboard || isLoadingPoints;

  // Afficher le skeleton pendant le chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!gamification) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="pt-6 px-3 sm:px-6">
          <p className="text-center text-sm sm:text-base text-muted-foreground py-8">
            Aucune donnée de gamification disponible. Vos statistiques apparaîtront ici une fois que vous commencerez à utiliser la plateforme.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = gamification.experience_points_to_next_level > 0
    ? (gamification.experience_points / gamification.experience_points_to_next_level) * 100
    : 100;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Points totaux</CardTitle>
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">{gamification.total_points.toLocaleString()}</div>
            <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
              +{gamification.points_earned_today} aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Niveau</CardTitle>
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">Niveau {gamification.current_level}</div>
            <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
              {gamification.experience_points}/{gamification.experience_points_to_next_level} XP
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Série</CardTitle>
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">{gamification.current_streak_days} jours</div>
            <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
              Record: {gamification.longest_streak_days} jours
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Classement</CardTitle>
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
              #{gamification.global_rank || 'N/A'}
            </div>
            <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
              Global
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar pour le niveau */}
      <Card className="border shadow-sm">
        <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-50">Progression vers le niveau {gamification.current_level + 1}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {gamification.experience_points} / {gamification.experience_points_to_next_level} XP
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          <Progress value={progressPercentage} className="h-2 sm:h-3" />
        </CardContent>
      </Card>

      {/* Tabs pour badges, achievements, leaderboard */}
      <Tabs defaultValue="badges" className="w-full">
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
          <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 flex-nowrap sm:flex-wrap gap-1 sm:gap-2 p-1 h-auto bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="badges"
              className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[36px] sm:min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
            >
              <Award className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Badges</span>
              <span className="xs:hidden">B</span>
              <span className="hidden sm:inline">({badges.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements"
              className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[36px] sm:min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
            >
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Achievements</span>
              <span className="xs:hidden">A</span>
              <span className="hidden sm:inline">({achievements.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard"
              className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[36px] sm:min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Leaderboard</span>
              <span className="xs:hidden">L</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card className="border shadow-sm">
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-50">Mes Badges</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {badges.length} badge{badges.length > 1 ? 's' : ''} obtenu{badges.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {badges.length === 0 ? (
                <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                  Aucun badge obtenu pour le moment
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {badges.map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="flex flex-col items-center p-3 sm:p-4 border rounded-lg hover:bg-muted transition-colors touch-manipulation"
                    >
                      {userBadge.badge?.icon_url ? (
                        <img
                          src={userBadge.badge.icon_url}
                          alt={userBadge.badge.name}
                          className="h-12 w-12 sm:h-16 sm:w-16 mb-2 rounded"
                        />
                      ) : (
                        <Award className="h-12 w-12 sm:h-16 sm:w-16 mb-2 text-primary flex-shrink-0" />
                      )}
                      <div className="text-xs sm:text-sm font-medium text-center text-gray-900 dark:text-gray-50 break-words">
                        {userBadge.badge?.name || 'Badge'}
                      </div>
                      <div className="text-[10px] xs:text-xs text-muted-foreground text-center mt-1">
                        {format(new Date(userBadge.earned_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card className="border shadow-sm">
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-50">Mes Achievements</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {achievements.length} achievement{achievements.length > 1 ? 's' : ''} débloqué{achievements.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {achievements.length === 0 ? (
                <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                  Aucun achievement débloqué pour le moment
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {achievements.map((userAchievement) => (
                    <div
                      key={userAchievement.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {userAchievement.achievement?.icon_url ? (
                        <img
                          src={userAchievement.achievement.icon_url}
                          alt={userAchievement.achievement.title}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded flex-shrink-0"
                        />
                      ) : (
                        <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-primary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-50 break-words">
                          {userAchievement.achievement?.title || 'Achievement'}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                          {userAchievement.achievement?.description}
                        </div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                          {format(new Date(userAchievement.earned_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>
                      {userAchievement.achievement?.reward_points && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          +{userAchievement.achievement.reward_points} points
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <Card className="border shadow-sm">
            <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-50">Leaderboard Global</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Top 10 des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                  Aucun classement disponible pour le moment
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 border rounded-lg ${
                        entry.user_id === user?.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted font-bold text-xs sm:text-sm flex-shrink-0">
                        {entry.rank}
                      </div>
                      {entry.user_avatar ? (
                        <img
                          src={entry.user_avatar}
                          alt={entry.user_name}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs sm:text-sm">
                          {entry.user_name?.[0] || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-50 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{entry.user_name}</span>
                          {entry.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">Vous</Badge>
                          )}
                        </div>
                        <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                          Niveau {entry.current_level} • {entry.total_points.toLocaleString()} points
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-50">{entry.total_points.toLocaleString()}</div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Historique des points */}
      <Card className="border shadow-sm">
        <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-50">Historique des Points</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Dernières activités
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {pointsHistory.length === 0 ? (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {pointsHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-50 break-words">
                        {entry.source_description || 'Points gagnés'}
                      </div>
                      <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-medium text-xs sm:text-sm text-green-600 dark:text-green-400">
                      +{entry.points_earned} points
                    </div>
                    <div className="text-[10px] xs:text-xs text-muted-foreground">
                      Total: {entry.points_after.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


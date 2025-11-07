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
  TrendingUp,
  Calendar,
  Target,
  Users,
  Gift,
  Zap,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const GamificationDashboard = () => {
  const { user } = useAuth();
  const { data: gamification, isLoading } = useUserGamification();
  const { data: badges = [] } = useUserBadges();
  const { data: achievements = [] } = useUserAchievements();
  const { data: leaderboard = [] } = useGlobalLeaderboard(10);
  const { data: pointsHistory = [] } = usePointsHistory(undefined, 10);

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
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            Aucune donnée de gamification disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = gamification.experience_points_to_next_level > 0
    ? (gamification.experience_points / gamification.experience_points_to_next_level) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points totaux</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamification.total_points.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{gamification.points_earned_today} aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niveau</CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Niveau {gamification.current_level}</div>
            <p className="text-xs text-muted-foreground">
              {gamification.experience_points}/{gamification.experience_points_to_next_level} XP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Série</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamification.current_streak_days} jours</div>
            <p className="text-xs text-muted-foreground">
              Record: {gamification.longest_streak_days} jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classement</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{gamification.global_rank || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Global
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar pour le niveau */}
      <Card>
        <CardHeader>
          <CardTitle>Progression vers le niveau {gamification.current_level + 1}</CardTitle>
          <CardDescription>
            {gamification.experience_points} / {gamification.experience_points_to_next_level} XP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs pour badges, achievements, leaderboard */}
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">
            <Award className="h-4 w-4 mr-2" />
            Badges ({badges.length})
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="h-4 w-4 mr-2" />
            Achievements ({achievements.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Users className="h-4 w-4 mr-2" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes Badges</CardTitle>
              <CardDescription>
                {badges.length} badge{badges.length > 1 ? 's' : ''} obtenu{badges.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun badge obtenu pour le moment
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted transition-colors"
                    >
                      {userBadge.badge?.icon_url ? (
                        <img
                          src={userBadge.badge.icon_url}
                          alt={userBadge.badge.name}
                          className="h-16 w-16 mb-2"
                        />
                      ) : (
                        <Award className="h-16 w-16 mb-2 text-primary" />
                      )}
                      <div className="text-sm font-medium text-center">
                        {userBadge.badge?.name || 'Badge'}
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
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
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes Achievements</CardTitle>
              <CardDescription>
                {achievements.length} achievement{achievements.length > 1 ? 's' : ''} débloqué{achievements.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun achievement débloqué pour le moment
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements.map((userAchievement) => (
                    <div
                      key={userAchievement.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      {userAchievement.achievement?.icon_url ? (
                        <img
                          src={userAchievement.achievement.icon_url}
                          alt={userAchievement.achievement.title}
                          className="h-12 w-12"
                        />
                      ) : (
                        <Trophy className="h-12 w-12 text-primary" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {userAchievement.achievement?.title || 'Achievement'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userAchievement.achievement?.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(userAchievement.earned_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>
                      {userAchievement.achievement?.reward_points && (
                        <Badge variant="secondary">
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
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard Global</CardTitle>
              <CardDescription>
                Top 10 des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-4 p-3 border rounded-lg ${
                      entry.user_id === user?.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">
                      {entry.rank}
                    </div>
                    {entry.user_avatar ? (
                      <img
                        src={entry.user_avatar}
                        alt={entry.user_name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {entry.user_name?.[0] || 'U'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        {entry.user_name}
                        {entry.user_id === user?.id && (
                          <Badge variant="outline" className="ml-2">Vous</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Niveau {entry.current_level} • {entry.total_points.toLocaleString()} points
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{entry.total_points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Historique des points */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Points</CardTitle>
          <CardDescription>
            Dernières activités
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pointsHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-2">
              {pointsHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {entry.source_description || 'Points gagnés'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      +{entry.points_earned} points
                    </div>
                    <div className="text-xs text-muted-foreground">
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


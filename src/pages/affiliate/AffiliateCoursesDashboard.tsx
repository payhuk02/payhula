/**
 * Dashboard global pour les affiliés de cours
 * Vue d'ensemble de toutes les promotions
 * Date : 27 octobre 2025
 * Updated: 2025-02-02 - Responsive design with Mes Templates style
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TrendingUp,
  Search,
  BookOpen,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalAffiliateStats, usePromotedCourses } from '@/hooks/courses/useGlobalAffiliateStats';
import { AffiliateStatsCards } from '@/components/affiliate/AffiliateStatsCards';
import { CoursePromotionList } from '@/components/affiliate/CoursePromotionList';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const AffiliateCoursesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: globalStats, isLoading: statsLoading, refetch: refetchStats } = useGlobalAffiliateStats();
  const { data: promotedCourses, isLoading: coursesLoading, refetch: refetchCourses } = usePromotedCourses();

  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (!user) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Alert className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connexion requise</AlertTitle>
                <AlertDescription>
                  Vous devez être connecté pour accéder au dashboard affilié.
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate('/auth/login')} className="mt-4">
                Se connecter
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const isLoading = statsLoading || coursesLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchCourses();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20 animate-in zoom-in duration-500">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-500 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Dashboard Affilié
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Vue d'ensemble de vos promotions de cours
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-9 sm:h-10 transition-all hover:scale-105"
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline text-xs sm:text-sm">Actualiser</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/marketplace')}
                  className="h-9 sm:h-10"
                >
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Trouver des cours</span>
                  <span className="sm:hidden text-xs">Cours</span>
                </Button>
              </div>
            </div>
            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-24 sm:h-32 w-full" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                {/* Statistiques globales */}
                {globalStats && (
                  <AffiliateStatsCards
                    totalCourses={globalStats.total_courses}
                    totalLinks={globalStats.total_links}
                    totalClicks={globalStats.total_clicks}
                    totalConversions={globalStats.total_conversions}
                    conversionRate={globalStats.conversion_rate}
                    totalCommission={globalStats.total_commission}
                    pendingCommission={globalStats.pending_commission}
                    paidCommission={globalStats.paid_commission}
                  />
                )}

                {/* Guide de démarrage (si aucun cours promu) */}
                {promotedCourses && promotedCourses.length === 0 && (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 sm:p-8">
                      <div className="max-w-2xl mx-auto text-center">
                        <div className="p-4 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
                          <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">Bienvenue dans le Programme d'Affiliation !</h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6">
                          Commencez à gagner des commissions en promouvant des cours en ligne de qualité.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 text-left">
                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sm:text-base">
                                  1
                                </div>
                                <h3 className="font-semibold text-sm sm:text-base">Trouvez un cours</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Parcourez notre marketplace et trouvez des cours avec l'affiliation activée
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sm:text-base">
                                  2
                                </div>
                                <h3 className="font-semibold text-sm sm:text-base">Créez vos liens</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Générez des liens personnalisés pour chaque canal (blog, YouTube, etc.)
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm sm:text-base">
                                  3
                                </div>
                                <h3 className="font-semibold text-sm sm:text-base">Gagnez !</h3>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Recevez des commissions à chaque inscription via vos liens
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <Button
                          size="lg"
                          onClick={() => navigate('/marketplace')}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-10 sm:h-11"
                        >
                          <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span className="text-xs sm:text-sm">Découvrir les cours disponibles</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Liste des cours promus */}
                {promotedCourses && promotedCourses.length > 0 && (
                  <CoursePromotionList courses={promotedCourses} />
                )}

                {/* Conseils et FAQ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Conseils de promotion */}
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        Conseils de Promotion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">Créez du contenu de valeur</p>
                          <p className="text-xs text-muted-foreground">
                            Rédigez des articles ou créez des vidéos qui apportent de la valeur à votre audience
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">Testez différents canaux</p>
                          <p className="text-xs text-muted-foreground">
                            Créez des liens spécifiques pour blog, YouTube, Instagram pour analyser les performances
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">Soyez transparent</p>
                          <p className="text-xs text-muted-foreground">
                            Indiquez toujours que vous utilisez un lien d'affiliation
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">Analysez vos statistiques</p>
                          <p className="text-xs text-muted-foreground">
                            Suivez régulièrement vos performances et optimisez vos stratégies
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* FAQ */}
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        Questions Fréquentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">Quand suis-je payé ?</p>
                        <p className="text-xs text-muted-foreground">
                          Les commissions sont payées mensuellement une fois que vous atteignez le seuil minimum de 50,000 XOF.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">Combien de temps dure le cookie ?</p>
                        <p className="text-xs text-muted-foreground">
                          Cela dépend du cours. La durée est affichée sur chaque page de génération de liens (généralement 30 jours).
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">Puis-je promouvoir plusieurs cours ?</p>
                        <p className="text-xs text-muted-foreground">
                          Oui ! Vous pouvez promouvoir autant de cours que vous le souhaitez et créer des liens illimités.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-xs sm:text-sm mb-1">Comment optimiser mes conversions ?</p>
                        <p className="text-xs text-muted-foreground">
                          Créez du contenu pertinent, utilisez des appels à l'action clairs, et ciblez la bonne audience pour chaque cours.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AffiliateCoursesDashboard;


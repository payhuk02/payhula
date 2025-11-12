/**
 * Page My Courses - Mes Cours (Customer Portal)
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste tous cours inscrits
 * - Progression par cours
 * - Statistiques d'apprentissage
 * - Filtres par statut (en cours, terminé)
 * - Recherche par cours
 * - Accès rapide continuer apprentissage
 */

import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  PlayCircle,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  BarChart3,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

// Progress component (fallback if not exists)
const Progress = ({ value }: { value: number }) => (
  <div className="w-full bg-secondary rounded-full h-2">
    <div
      className="bg-primary rounded-full h-2 transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
);

interface CourseEnrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  last_accessed_at: string;
  course: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    slug: string;
  };
}

export default function MyCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch enrollments with progress
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['customer-enrollments', user?.id],
    queryFn: async (): Promise<CourseEnrollment[]> => {
      if (!user?.id) return [];

      // Fetch enrollments
      const { data: enrollmentsData, error } = await supabase
        .from('course_enrollments')
        .select('*, course:course_id(id, name, description, image_url, slug)')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch progress for each enrollment
      const enrollmentsWithProgress = await Promise.all(
        (enrollmentsData || []).map(async (enrollment: any) => {
          // Get course lessons count
          const { count: totalLessons } = await supabase
            .from('course_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', 
              await supabase
                .from('course_sections')
                .select('id')
                .eq('course_id', enrollment.course_id)
                .then(({ data }) => data?.map(s => s.id) || [])
            );

          // Get completed lessons count
          const { count: completedLessons } = await supabase
            .from('course_lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .in('lesson_id',
              await supabase
                .from('course_lessons')
                .select('id')
                .in('section_id',
                  await supabase
                    .from('course_sections')
                    .select('id')
                    .eq('course_id', enrollment.course_id)
                    .then(({ data }) => data?.map(s => s.id) || [])
                )
                .then(({ data }) => data?.map(l => l.id) || [])
            );

          const total = totalLessons || 0;
          const completed = completedLessons || 0;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            ...enrollment,
            progress_percentage: progress,
            completed_lessons_count: completed,
            total_lessons_count: total,
            course: enrollment.course || {},
          } as CourseEnrollment;
        })
      );

      return enrollmentsWithProgress;
    },
    enabled: !!user?.id,
  });

  // Filter enrollments
  const filteredEnrollments = enrollments?.filter((enrollment) => {
    const courseName = enrollment.course?.name || '';
    const matchesSearch = courseName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = enrollment.progress_percentage === 100;
    } else if (statusFilter === 'in-progress') {
      matchesStatus = enrollment.progress_percentage < 100 && enrollment.progress_percentage > 0;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: enrollments?.length || 0,
    inProgress: enrollments?.filter(e => e.progress_percentage < 100 && e.progress_percentage > 0).length || 0,
    completed: enrollments?.filter(e => e.progress_percentage === 100).length || 0,
    averageProgress: enrollments?.length
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
      : 0,
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            {/* Hero Section Skeleton */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl bg-white/20" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-10 sm:h-12 lg:h-14 w-48 sm:w-64 lg:w-80 bg-white/20" />
                    <Skeleton className="h-6 sm:h-7 w-64 sm:w-80 lg:w-96 bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 sm:h-36 lg:h-40 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-20 sm:h-24 rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-80 sm:h-96 rounded-lg" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          {/* Hero Section - Bannière avec titre visible */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden shadow-lg">
            {/* Pattern de fond */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
              }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {/* Icône visible et proéminente */}
                <div className="p-3 sm:p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg hover:scale-105 transition-transform duration-300 flex-shrink-0">
                  <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2.5} />
                </div>
                {/* Titre et sous-titre */}
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                    Mes Cours
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-2xl leading-relaxed">
                    Continuez votre apprentissage et suivez votre progression
                  </p>
                  {/* Badge avec nombre de cours */}
                  {stats.total > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse" />
                      <span className="text-sm sm:text-base text-blue-100 font-medium">
                        {stats.total} {stats.total > 1 ? 'cours inscrits' : 'cours inscrit'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">

            {/* Stats - Design moderne avec animations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-blue-300 dark:hover:border-blue-700 bg-card/80 backdrop-blur-sm hover:scale-105 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Total Cours</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">{stats.total}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Cours inscrits</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-blue-300 dark:hover:border-blue-700 bg-card/80 backdrop-blur-sm hover:scale-105 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">En Cours</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors duration-300">
                    <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.inProgress}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">En apprentissage</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-green-300 dark:hover:border-green-700 bg-card/80 backdrop-blur-sm hover:scale-105 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Terminés</CardTitle>
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors duration-300">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.completed}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Complétés</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-purple-300 dark:hover:border-purple-700 bg-card/80 backdrop-blur-sm hover:scale-105 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Progression Moyenne</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors duration-300">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{stats.averageProgress}%</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Sur tous vos cours</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters - Design moderne et responsive */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
                    <Input
                      placeholder="Rechercher un cours..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 sm:pl-12 h-10 sm:h-11 bg-background/50 border-border/50 focus:bg-background focus:border-primary transition-all duration-200 text-sm sm:text-base"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex-shrink-0">
                    <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full sm:w-auto">
                      <TabsList className="grid grid-cols-3 w-full sm:w-auto bg-muted/50 p-1 h-10 sm:h-11">
                        <TabsTrigger 
                          value="all" 
                          className="text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          Tous
                        </TabsTrigger>
                        <TabsTrigger 
                          value="in-progress" 
                          className="text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          En cours
                        </TabsTrigger>
                        <TabsTrigger 
                          value="completed" 
                          className="text-xs sm:text-sm px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
                        >
                          Terminés
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Courses List - Design moderne avec cartes améliorées */}
            <div>
              {/* En-tête avec compteur */}
              {filteredEnrollments && filteredEnrollments.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {filteredEnrollments.length} {filteredEnrollments.length === 1 ? 'cours' : 'cours'} trouvé{filteredEnrollments.length > 1 ? 's' : ''}
                  </h2>
                </div>
              )}

              {!filteredEnrollments || filteredEnrollments.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
                  <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                        <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Aucun cours</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Aucun cours ne correspond à vos critères de recherche'
                          : 'Vous n\'êtes inscrit à aucun cours pour le moment. Explorez notre catalogue pour découvrir des cours passionnants !'}
                      </p>
                      {!searchQuery && statusFilter === 'all' && (
                        <Button 
                          onClick={() => navigate('/marketplace')}
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] px-6 sm:px-8"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Découvrir les cours disponibles
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredEnrollments.map((enrollment) => (
                    <Card 
                      key={enrollment.id} 
                      className="group hover:shadow-2xl transition-all duration-300 border-border/50 hover:border-primary/50 bg-card/80 backdrop-blur-sm hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Image du cours */}
                      <div className="relative h-40 sm:h-48 lg:h-52 overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
                        {enrollment.course?.image_url ? (
                          <img
                            src={enrollment.course.image_url}
                            alt={enrollment.course.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-white/60" />
                          </div>
                        )}
                        {/* Badge de statut sur l'image */}
                        <div className="absolute top-3 right-3">
                          {enrollment.progress_percentage === 100 ? (
                            <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-lg border-0">
                              <Award className="h-3 w-3 mr-1" />
                              Terminé
                            </Badge>
                          ) : enrollment.progress_percentage > 0 ? (
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-0">
                              <PlayCircle className="h-3 w-3 mr-1" />
                              En cours
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="shadow-lg">
                              <Clock className="h-3 w-3 mr-1" />
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg lg:text-xl font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
                          {enrollment.course?.name || 'Cours'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                        {/* Progress Bar améliorée */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-medium text-foreground">Progression</span>
                            <span className="font-bold text-primary">{enrollment.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2.5 sm:h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                enrollment.progress_percentage === 100
                                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                                  : enrollment.progress_percentage >= 50
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                  : enrollment.progress_percentage > 0
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`}
                              style={{ width: `${enrollment.progress_percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {enrollment.completed_lessons_count} / {enrollment.total_lessons_count} leçons complétées
                          </p>
                        </div>

                        {/* Bouton d'action amélioré */}
                        <Button
                          asChild
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] touch-manipulation"
                          variant={enrollment.progress_percentage === 100 ? 'outline' : 'default'}
                        >
                          <Link to={`/courses/${enrollment.course?.slug}`} className="flex items-center justify-center">
                            {enrollment.progress_percentage === 100 ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                <span>Revoir le cours</span>
                              </>
                            ) : enrollment.progress_percentage > 0 ? (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                <span>Continuer l'apprentissage</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                <span>Commencer le cours</span>
                              </>
                            )}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


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
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Menu,
  RefreshCw,
  X,
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

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

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Hamburger Menu - Style Mes Commandes */}
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50" aria-hidden="true" />
        </button>
        
        {/* Titre avec Icône - Style Mes Commandes */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" aria-hidden="true" />
          <h1 className="text-base sm:text-lg font-bold truncate text-gray-900 dark:text-gray-50">
            Mes Cours
          </h1>
        </div>
      </div>
    </header>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const coursesRef = useScrollAnimation<HTMLDivElement>();

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

      // Fetch enrollments - Using type assertion for untyped Supabase tables
      const { data: enrollmentsData, error } = await (supabase
        .from('course_enrollments' as any)
        .select('*, course:course_id(id, name, description, image_url, slug)')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false, nullsFirst: false }) as any);

      if (error) throw error;

      // Fetch progress for each enrollment
      const enrollmentsWithProgress = await Promise.all(
        (enrollmentsData || []).map(async (enrollment: any) => {
          // Get course sections first
          const { data: sectionsData } = await (supabase
            .from('course_sections' as any)
            .select('id')
            .eq('course_id', enrollment.course_id) as any);
          
          const sectionIds = sectionsData?.map((s: any) => s.id) || [];

          // Get course lessons count
          const { count: totalLessons } = await (supabase
            .from('course_lessons' as any)
            .select('*', { count: 'exact', head: true })
            .in('section_id', sectionIds.length > 0 ? sectionIds : ['']) as any);

          // Get lesson IDs for this course
          const { data: lessonsData } = await (supabase
            .from('course_lessons' as any)
            .select('id')
            .in('section_id', sectionIds.length > 0 ? sectionIds : ['']) as any);
          
          const lessonIds = lessonsData?.map((l: any) => l.id) || [];

          // Get completed lessons count
          const { count: completedLessons } = await (supabase
            .from('course_lesson_progress' as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['']) as any);

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

  // Handlers
  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header - Loading State */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
                <div className="h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse border border-gray-300 dark:border-gray-600" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <Skeleton className="h-5 w-32 sm:w-40" />
                </div>
              </div>
            </header>
            <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
              <div className="container mx-auto space-y-4 sm:space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
                    <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
                  </div>
                  <Skeleton className="h-9 sm:h-10 w-32 sm:w-40" />
                </div>
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 sm:h-36" />
                  ))}
                </div>
                {/* Filters Skeleton */}
                <Skeleton className="h-20 sm:h-24" />
                {/* Courses Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-80 sm:h-96" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <MobileHeader />
          
          {/* Contenu principal */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
            <div className="container mx-auto space-y-4 sm:space-y-6">
              {/* Header avec animation - Style Inventaire */}
              <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                      <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Mes Cours
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                    Continuez votre apprentissage et suivez votre progression
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRefresh}
                    size="sm"
                    className="h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline text-xs sm:text-sm">Rafraîchir</span>
                  </Button>
                </div>
              </div>

              {/* Stats Cards - Style Inventaire (Purple-Pink Gradient) */}
              <div 
                ref={statsRef}
                className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                {[
                  { label: 'Total Cours', value: stats.total, icon: BookOpen, color: "from-purple-600 to-pink-600" },
                  { label: 'En Cours', value: stats.inProgress, icon: PlayCircle, color: "from-blue-600 to-cyan-600" },
                  { label: 'Terminés', value: stats.completed, icon: Award, color: "from-green-600 to-emerald-600" },
                  { label: 'Progression Moyenne', value: `${stats.averageProgress}%`, icon: BarChart3, color: "from-purple-600 to-pink-600" },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.value}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Search & Filters - Style Inventaire */}
              <Card ref={filtersRef} className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      <Input
                        id="search-courses"
                        placeholder="Rechercher un cours..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 sm:pl-10 pr-8 sm:pr-20 h-9 sm:h-10 text-xs sm:text-sm"
                        aria-label="Rechercher"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => setSearchQuery('')}
                          aria-label="Effacer"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs - Style Inventaire */}
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto">
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Tous ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="in-progress" 
                    className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    En cours ({stats.inProgress})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Terminés ({stats.completed})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Courses List - Style Inventaire */}
              <div ref={coursesRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                {!filteredEnrollments || filteredEnrollments.length === 0 ? (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                          <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">Aucun cours trouvé</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Aucun cours ne correspond à vos critères de recherche'
                            : 'Vous n\'êtes inscrit à aucun cours pour le moment. Explorez notre catalogue pour découvrir des cours passionnants !'}
                        </p>
                        {!searchQuery && statusFilter === 'all' && (
                          <Button 
                            onClick={() => navigate('/marketplace')}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] px-6 sm:px-8"
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
                      className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:scale-[1.02] overflow-hidden"
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
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] touch-manipulation"
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


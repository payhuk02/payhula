import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
  isOpen: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_type: 'upload' | 'youtube' | 'vimeo';
  video_url?: string;
  video_duration_seconds?: number;
  is_preview: boolean;
  order_index: number;
}

interface CreateFullCourseData {
  // Données du produit
  storeId: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  image_url?: string;
  images?: string[];
  price: number;
  currency: string;
  promotional_price?: number;
  pricing_model?: 'one-time' | 'subscription' | 'free' | 'pay-what-you-want';
  create_free_preview?: boolean;
  preview_content_description?: string;
  licensing_type?: 'standard' | 'plr' | 'copyrighted';
  license_terms?: string;
  
  // Données du cours
  level: string;
  language: string;
  certificate_enabled: boolean;
  certificate_passing_score: number;
  learning_objectives: string[];
  prerequisites: string[];
  target_audience: string[];
  
  // Curriculum
  sections: Section[];
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  
  // FAQs
  faqs?: Array<{
    id?: string;
    question: string;
    answer: string;
    order?: number;
  }>;
  
  // Affiliation
  affiliate_enabled?: boolean;
  commission_rate?: number;
  commission_type?: 'percentage' | 'fixed';
  fixed_commission_amount?: number;
  cookie_duration_days?: number;
  max_commission_per_sale?: number;
  min_order_amount?: number;
  allow_self_referral?: boolean;
  require_approval?: boolean;
  affiliate_terms_and_conditions?: string;
  
  // Tracking & Pixels
  tracking_enabled?: boolean;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  google_tag_manager_id?: string;
  tiktok_pixel_id?: string;
  track_video_events?: boolean;
  track_lesson_completion?: boolean;
  track_quiz_attempts?: boolean;
  track_certificate_downloads?: boolean;
}

/**
 * Hook pour créer un cours complet avec toutes ses dépendances
 * Gère la transaction complète : produit → cours → sections → leçons
 */
export const useCreateFullCourse = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: CreateFullCourseData) => {
      try {
        // Récupérer l'utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Utilisateur non connecté');
        }

        // ÉTAPE 1 : Créer le produit
        logger.info('Creating product for course', { storeId: data.storeId, name: data.name });
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            store_id: data.storeId,
            name: data.name,
            slug: data.slug,
            short_description: data.short_description,
            description: data.description,
            category: data.category,
            product_type: 'course',
            price: data.pricing_model === 'free' ? 0 : data.price,
            currency: data.currency,
            promotional_price: data.promotional_price || null,
            pricing_model: data.pricing_model || 'one-time',
            image_url: data.image_url || (data.images && data.images.length > 0 ? data.images[0] : null),
            images: data.images || (data.image_url ? [data.image_url] : []),
            licensing_type: data.licensing_type || 'standard',
            license_terms: data.license_terms || null,
            is_active: true,
            is_draft: false,
            // SEO
            meta_title: data.meta_title || null,
            meta_description: data.meta_description || null,
            meta_keywords: data.meta_keywords || null,
            og_image: data.og_image || null,
            // FAQs
            faqs: data.faqs || null,
          })
          .select()
          .single();

        if (productError) {
          logger.error('Error creating product for course', { error: productError, storeId: data.storeId });
          throw new Error(`Erreur lors de la création du produit: ${productError.message}`);
        }

        logger.info('Product created successfully', { productId: product.id });

        // ÉTAPE 2 : Créer le cours
        logger.info('Creating course', { productId: product.id });
        
        // Calculer les statistiques
        const totalLessons = data.sections.reduce((total, section) => total + section.lessons.length, 0);
        const totalDuration = data.sections.reduce((total, section) => {
          return total + section.lessons.reduce((sum, lesson) => sum + (lesson.video_duration_seconds || 0), 0);
        }, 0);

        const { data: course, error: courseError } = await supabase
          .from('courses')
          .insert({
            product_id: product.id,
            level: data.level,
            language: data.language,
            total_duration_minutes: Math.round(totalDuration / 60),
            total_lessons: totalLessons,
            learning_objectives: data.learning_objectives,
            prerequisites: data.prerequisites,
            target_audience: data.target_audience,
            certificate_enabled: data.certificate_enabled,
            certificate_passing_score: data.certificate_passing_score,
          })
          .select()
          .single();

        if (courseError) {
          logger.error('Error creating course', { error: courseError, productId: product.id });
          // Rollback : supprimer le produit
          await supabase.from('products').delete().eq('id', product.id);
          throw new Error(`Erreur lors de la création du cours: ${courseError.message}`);
        }

        logger.info('Course created successfully', { courseId: course.id, productId: product.id });

        // ÉTAPE 3 : Créer les sections
        logger.info('Creating course sections', { courseId: course.id, sectionsCount: data.sections.length });
        interface CreatedSection {
          id: string;
          course_id: string;
          title: string;
          description?: string | null;
          order_index: number;
          originalSection: Section;
        }
        const createdSections: CreatedSection[] = [];

        for (const section of data.sections) {
          const { data: createdSection, error: sectionError } = await supabase
            .from('course_sections')
            .insert({
              course_id: course.id,
              title: section.title,
              description: section.description || null,
              order_index: section.order_index,
            })
            .select()
            .single();

          if (sectionError) {
            logger.error('Error creating course section', { error: sectionError, courseId: course.id, sectionTitle: section.title });
            // Rollback : supprimer le cours et le produit
            await supabase.from('courses').delete().eq('id', course.id);
            await supabase.from('products').delete().eq('id', product.id);
            throw new Error(`Erreur lors de la création de la section: ${sectionError.message}`);
          }

          createdSections.push({ ...createdSection, originalSection: section });
          logger.debug('Section created', { sectionId: createdSection.id, sectionTitle: section.title });
        }

        // ÉTAPE 4 : Créer les leçons
        logger.info('Creating course lessons', { courseId: course.id });
        let totalCreatedLessons = 0;

        for (const sectionData of createdSections) {
          const section = sectionData.originalSection;
          
          for (const lesson of section.lessons) {
            const { error: lessonError } = await supabase
              .from('course_lessons')
              .insert({
                section_id: sectionData.id,
                course_id: course.id,
                title: lesson.title,
                description: lesson.description || null,
                order_index: lesson.order_index,
                video_type: lesson.video_type || 'upload',
                video_url: lesson.video_url || '',
                video_duration_seconds: lesson.video_duration_seconds || 0,
                is_preview: lesson.is_preview || false,
                is_required: true,
              });

            if (lessonError) {
              logger.error('Error creating course lesson', { error: lessonError, courseId: course.id, lessonTitle: lesson.title });
              // Rollback : supprimer tout
              await supabase.from('courses').delete().eq('id', course.id);
              await supabase.from('products').delete().eq('id', product.id);
              throw new Error(`Erreur lors de la création de la leçon: ${lessonError.message}`);
            }

            totalCreatedLessons++;
            logger.debug('Lesson created', { lessonTitle: lesson.title, totalLessons: totalCreatedLessons });
          }
        }

        // ÉTAPE 5 : Créer les settings d'affiliation (si activé)
        if (data.affiliate_enabled) {
          logger.info('Creating affiliate settings for course', { productId: product.id });
          const { error: affiliateError } = await supabase
            .from('product_affiliate_settings')
            .insert({
              product_id: product.id,
              store_id: data.storeId,
              affiliate_enabled: true,
              commission_rate: data.commission_rate || 20,
              commission_type: data.commission_type || 'percentage',
              fixed_commission_amount: data.fixed_commission_amount || 0,
              cookie_duration_days: data.cookie_duration_days || 30,
              max_commission_per_sale: data.max_commission_per_sale || null,
              min_order_amount: data.min_order_amount || 0,
              allow_self_referral: data.allow_self_referral || false,
              require_approval: data.require_approval || false,
              terms_and_conditions: data.affiliate_terms_and_conditions || '',
            });

          if (affiliateError) {
            logger.error('Error creating affiliate settings', { error: affiliateError, productId: product.id });
            // Ne pas faire de rollback complet car le cours est déjà créé
            // Juste logger l'erreur et continuer
            logger.warn('Course created but affiliate settings failed', { productId: product.id });
          } else {
            logger.info('Affiliate settings created successfully', { productId: product.id });
          }
        }

        // ÉTAPE 6 : Configurer le tracking et les pixels
        logger.info('Configuring analytics tracking for course', { productId: product.id });
        const { error: analyticsError } = await supabase
          .from('product_analytics')
          .upsert({
            product_id: product.id,
            store_id: data.storeId,
            tracking_enabled: data.tracking_enabled !== false, // true par défaut
            google_analytics_id: data.google_analytics_id || null,
            facebook_pixel_id: data.facebook_pixel_id || null,
            google_tag_manager_id: data.google_tag_manager_id || null,
            tiktok_pixel_id: data.tiktok_pixel_id || null,
          });

        if (analyticsError) {
          logger.error('Error configuring analytics', { error: analyticsError, productId: product.id });
          logger.warn('Course created but analytics configuration failed', { productId: product.id });
        } else {
          logger.info('Analytics tracking configured successfully', { productId: product.id });
        }

        logger.info('Course created successfully', { 
          productId: product.id, 
          courseId: course.id,
          sectionsCount: data.sections.length, 
          lessonsCount: totalCreatedLessons 
        });

        // ÉTAPE 7 : Créer le cours preview gratuit si demandé
        if (data.create_free_preview && data.pricing_model !== 'free') {
          try {
            logger.info('Creating free preview course', { paidProductId: product.id });
            
            const { data: previewCourseId, error: previewError } = await supabase
              .rpc('create_free_preview_course', {
                p_paid_product_id: product.id,
                p_preview_content_description: data.preview_content_description || null,
              });

            if (previewError) {
              logger.error('Error creating free preview course', { error: previewError, paidProductId: product.id });
              logger.warn('Paid course created but free preview failed', { paidProductId: product.id });
            } else {
              logger.info('Free preview course created successfully', { previewCourseId, paidProductId: product.id });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Exception creating free preview course', { error: errorMessage, paidProductId: product.id });
            // Ne pas faire échouer la création du cours principal
          }
        }

        return {
          product,
          course,
          sectionsCount: data.sections.length,
          lessonsCount: totalCreatedLessons,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Global error creating course', { error: errorMessage, storeId: data.storeId });
        throw error;
      }
    },
    onSuccess: (result) => {
      toast({
        title: '🎉 Cours créé avec succès !',
        description: `Votre cours "${result.product.name}" a été publié avec ${result.sectionsCount} sections et ${result.lessonsCount} leçons.`,
        duration: 5000,
      });

      // Rediriger vers la page des produits
      setTimeout(() => {
        navigate('/dashboard/products');
      }, 1500);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Final error creating course', { error: errorMessage });
      toast({
        title: '❌ Erreur lors de la création du cours',
        description: errorMessage || 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
        duration: 7000,
      });
    },
  });
};


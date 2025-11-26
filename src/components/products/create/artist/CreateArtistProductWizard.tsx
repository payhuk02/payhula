/**
 * Create Artist Product Wizard
 * Date: 28 Janvier 2025
 * 
 * Wizard professionnel pour la création de produits artistes
 */

import React, { useState, useCallback, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Palette,
  Info,
  FileText,
  Truck,
  Search,
  Eye,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  Loader2,
  CreditCard,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { ArtistTypeSelector } from './ArtistTypeSelector';
import { ArtistBasicInfoForm } from './ArtistBasicInfoForm';

// Lazy loading des étapes pour optimiser le bundle size
const ArtistSpecificForms = lazy(() => import('./ArtistSpecificForms').then(m => ({ default: m.ArtistSpecificForms })));
const ArtistShippingConfig = lazy(() => import('./ArtistShippingConfig').then(m => ({ default: m.ArtistShippingConfig })));
const ArtistAuthenticationConfig = lazy(() => import('./ArtistAuthenticationConfig').then(m => ({ default: m.ArtistAuthenticationConfig })));
const ArtistPreview = lazy(() => import('./ArtistPreview').then(m => ({ default: m.ArtistPreview })));
const ProductSEOForm = lazy(() => import('../shared/ProductSEOForm').then(m => ({ default: m.ProductSEOForm })));
const ProductFAQForm = lazy(() => import('../shared/ProductFAQForm').then(m => ({ default: m.ProductFAQForm })));
const PaymentOptionsForm = lazy(() => import('../shared/PaymentOptionsForm').then(m => ({ default: m.PaymentOptionsForm })));
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import type { ArtistProductFormData } from '@/types/artist-product';
import { generateSlug } from '@/lib/validation-utils';

// Skeleton de chargement pour les étapes lazy-loaded
const StepSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-20 w-3/4" />
  </div>
);

const STEPS = [
  { id: 1, title: 'Type d\'Artiste', description: 'Sélectionnez votre type', icon: Palette },
  { id: 2, title: 'Informations de base', description: 'Artiste & Œuvre', icon: Info },
  { id: 3, title: 'Spécificités', description: 'Détails par type', icon: FileText },
  { id: 4, title: 'Expédition & Assurance', description: 'Livraison, emballage, assurance', icon: Truck },
  { id: 5, title: 'Authentification', description: 'Certificats d\'authenticité', icon: Shield },
  { id: 6, title: 'SEO & FAQs', description: 'Référencement, questions', icon: Search },
  { id: 7, title: 'Options de Paiement', description: 'Complet, partiel, escrow', icon: CreditCard },
  { id: 8, title: 'Aperçu & Validation', description: 'Vérifier et publier', icon: Eye },
];

interface CreateArtistProductWizardProps {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

const CreateArtistProductWizardComponent = ({
  storeId: propsStoreId,
  storeSlug: _storeSlug, // Préfixé avec _ pour indiquer qu'il n'est pas utilisé actuellement
  onSuccess,
  onBack,
}: CreateArtistProductWizardProps = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  // État pour stocker les erreurs de validation par étape (utilisé dans la grille d'étapes)
  const [validationErrors] = useState<Record<number, string[]>>({});
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for animations
  const stepsRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  const [formData, setFormData] = useState<Partial<ArtistProductFormData>>({
    name: '',
    description: '',
    price: 0,
    compare_at_price: null,
    cost_per_item: null,
    images: [],
    category_id: null,
    tags: [],
    artist_type: null as any,
    artist_name: '',
    artist_bio: '',
    artist_website: '',
    artist_photo_url: undefined,
    artist_social_links: {},
    artwork_title: '',
    artwork_year: null,
    artwork_medium: '',
    artwork_dimensions: { width: null, height: null, depth: null, unit: 'cm' },
    artwork_link_url: undefined,
    edition_type: 'original',
    edition_number: null,
    total_editions: null,
    requires_shipping: true,
    shipping_handling_time: 7,
    shipping_fragile: false,
    shipping_insurance_required: false,
    shipping_insurance_amount: null,
    certificate_of_authenticity: false,
    certificate_file_url: '',
    signature_authenticated: false,
    signature_location: '',
    seo: {},
    faqs: [],
    payment: { payment_type: 'full', percentage_rate: 30 },
    is_active: true,
  });

  const handleUpdateFormData = useCallback((data: Partial<ArtistProductFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(newData);
      }, 2000);
      
      return newData;
    });
  }, []);

  const handleAutoSave = useCallback(async (data?: any) => {
    const dataToSave = data || formData;
    if (!dataToSave.artwork_title || dataToSave.artwork_title.trim() === '') return;

    setIsAutoSaving(true);
    try {
      localStorage.setItem('artist-product-draft', JSON.stringify(dataToSave));
      logger.info('Brouillon produit artiste auto-sauvegardé', { step: currentStep });
    } catch (error) {
      logger.error('Auto-save error', { error });
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, currentStep]);

  useEffect(() => {
    const savedDraft = localStorage.getItem('artist-product-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        logger.info('Brouillon produit artiste chargé');
      } catch (error) {
        logger.error('Error loading draft', { error });
      }
    }
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.artist_type) {
          toast({ title: 'Erreur', description: 'Veuillez sélectionner un type d\'artiste', variant: 'destructive' });
          return false;
        }
        return true;
      case 2:
        if (!formData.artwork_title || !formData.artist_name || !formData.artwork_medium || !formData.price) {
          toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' });
          return false;
        }
        if (!formData.description || formData.description.trim().length < 10) {
          toast({ title: 'Erreur', description: 'Veuillez ajouter une description (minimum 10 caractères)', variant: 'destructive' });
          return false;
        }
        if (!formData.price || formData.price <= 0) {
          toast({ title: 'Erreur', description: 'Le prix doit être supérieur à 0', variant: 'destructive' });
          return false;
        }
        if (!formData.images || formData.images.length === 0) {
          toast({ title: 'Erreur', description: 'Veuillez ajouter au moins une image', variant: 'destructive' });
          return false;
        }
        // Validation cohérence requires_shipping / artwork_link_url
        if (!formData.requires_shipping && !formData.artwork_link_url) {
          toast({ 
            title: 'Erreur', 
            description: 'Pour une œuvre non physique, un lien vers l\'œuvre est requis', 
            variant: 'destructive' 
          });
          return false;
        }
        // Validation édition limitée
        if (formData.edition_type === 'limited_edition') {
          if (!formData.edition_number || !formData.total_editions) {
            toast({ 
              title: 'Erreur', 
              description: 'Pour une édition limitée, le numéro d\'édition et le total sont requis', 
              variant: 'destructive' 
            });
            return false;
          }
          if (formData.edition_number > formData.total_editions) {
            toast({ 
              title: 'Erreur', 
              description: 'Le numéro d\'édition ne peut pas être supérieur au total', 
              variant: 'destructive' 
            });
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  }, [formData, toast]);

  const saveArtistProduct = async (isDraft: boolean = false) => {
    if (!store) {
      throw new Error('Aucune boutique trouvée');
    }

    setIsSaving(true);

    try {
      // Generate slug
      let slug = generateSlug(formData.artwork_title || formData.name || 'artwork');
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('slug', slug)
          .limit(1);
        
        if (!existing || existing.length === 0) break;
        attempts++;
        slug = `${generateSlug(formData.artwork_title || 'artwork')}-${attempts}`;
      }

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          name: formData.artwork_title || formData.name,
          slug,
          description: formData.description,
          short_description: formData.short_description || null,
          price: formData.price || 0,
          compare_at_price: formData.compare_at_price || null,
          cost_per_item: formData.cost_per_item || null,
          currency: 'XOF',
          product_type: 'artist',
          category_id: formData.category_id || null,
          image_url: formData.images?.[0] || null,
          images: formData.images || [],
          tags: formData.tags || [],
          meta_title: formData.seo?.meta_title,
          meta_description: formData.seo?.meta_description,
          og_image: formData.seo?.og_image,
          faqs: formData.faqs || [],
          payment_options: formData.payment || { payment_type: 'full', percentage_rate: 30 },
          is_draft: isDraft,
          is_active: !isDraft,
        } as any)
        .select()
        .single();

      if (productError) {
        // Gestion améliorée des erreurs de contrainte unique
        if (productError.code === '23505' || productError.message?.includes('duplicate key')) {
          const constraintMatch = productError.message?.match(/constraint ['"]([^'"]+)['"]/);
          const constraintName = constraintMatch ? constraintMatch[1] : 'unknown';
          
          if (constraintName.includes('slug')) {
            throw new Error('Ce slug est déjà utilisé par un autre produit de votre boutique. Veuillez modifier le nom ou l\'URL du produit.');
          }
        }
        throw productError;
      }

      // Create artist_product
      const { error: artistError } = await (supabase as any)
        .from('artist_products')
        .insert({
          product_id: product.id,
          store_id: store.id,
          artist_type: formData.artist_type,
          artist_name: formData.artist_name,
          artist_bio: formData.artist_bio,
          artist_website: formData.artist_website,
          artist_photo_url: formData.artist_photo_url || null,
          artist_social_links: formData.artist_social_links || {},
          artwork_title: formData.artwork_title,
          artwork_year: formData.artwork_year,
          artwork_medium: formData.artwork_medium,
          artwork_dimensions: formData.artwork_dimensions,
          artwork_link_url: formData.artwork_link_url || null,
          artwork_edition_type: formData.edition_type,
          edition_number: formData.edition_number,
          total_editions: formData.total_editions,
          writer_specific: formData.writer_specific || null,
          musician_specific: formData.musician_specific || null,
          visual_artist_specific: formData.visual_artist_specific || null,
          designer_specific: formData.designer_specific || null,
          multimedia_specific: formData.multimedia_specific || null,
          requires_shipping: formData.requires_shipping,
          shipping_handling_time: formData.shipping_handling_time,
          shipping_fragile: formData.shipping_fragile,
          shipping_insurance_required: formData.shipping_insurance_required,
          shipping_insurance_amount: formData.shipping_insurance_amount,
          certificate_of_authenticity: formData.certificate_of_authenticity,
          certificate_file_url: formData.certificate_file_url,
          signature_authenticated: formData.signature_authenticated,
          signature_location: formData.signature_location,
        });

      if (artistError) throw artistError;

      // Déclencher webhook product.created (asynchrone)
      if (product && !isDraft) {
        import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
          triggerWebhook(store.id, 'product.created', {
            product_id: product.id,
            name: product.name,
            product_type: product.product_type,
            price: product.price,
            currency: product.currency,
            created_at: product.created_at,
          }).catch((err) => {
            logger.error('Error triggering webhook', { error: err, productId: product.id });
          });
        });
      }

      localStorage.removeItem('artist-product-draft');
      
      toast({
        title: '✅ Succès',
        description: isDraft ? 'Brouillon sauvegardé' : 'Produit artiste créé avec succès',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/products');
      }
    } catch (error) {
      logger.error('Error saving artist product', { error });
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = useCallback((stepId: number) => {
    // Permettre de revenir en arrière, mais valider avant d'avancer
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      logger.info('Navigation directe vers étape', { to: stepId });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stepId === currentStep) {
      // Déjà sur cette étape, ne rien faire
      return;
    } else {
      // Avancer nécessite une validation
      const isValid = validateStep(currentStep);
      if (isValid) {
        setCurrentStep(stepId);
        logger.info('Navigation directe vers étape', { to: stepId });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStep]);

  /**
   * Calculate progress
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back', 'Retour')}
            </Button>
          )}
        </div>
        
        {/* Title */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {t('products.createArtist.title', 'Créer une œuvre d\'artiste')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('products.createArtist.subtitle', `Créez une œuvre d'artiste professionnelle en ${STEPS.length} étapes`)}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium">
              {t('products.step', 'Étape')} {currentStep} {t('products.of', 'sur')} {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {isAutoSaving && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{t('products.saving', 'Sauvegarde...')}</span>
                </div>
              )}
              <span className="text-muted-foreground">{Math.round(progress)}% {t('products.completed', 'complété')}</span>
            </div>
          </div>
          <Progress 
            value={progress} 
            className="h-1.5 sm:h-2 bg-muted"
          />
        </div>
      </div>

      {/* Steps Indicator - Responsive */}
      <Card 
        ref={stepsRef}
        className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const hasErrors = validationErrors[step.id]?.length > 0;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${t('products.step', 'Étape')} ${step.id}: ${step.title}`}
                  className={cn(
                    "relative p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left",
                    "hover:shadow-md hover:scale-[1.02] touch-manipulation",
                    isActive && 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg scale-[1.02] ring-2 ring-green-500/20',
                    isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                    !isActive && !isCompleted && !hasErrors && 'border-border hover:border-green-500/50 bg-card/50',
                    hasErrors && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                    "animate-in fade-in slide-in-from-bottom-4"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Icon className={cn(
                      "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors",
                      isActive ? 'text-green-600 dark:text-green-400' : 
                      isCompleted ? 'text-green-600 dark:text-green-400' : 
                      hasErrors ? 'text-red-600 dark:text-red-400' :
                      'text-muted-foreground'
                    )} />
                    {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 ml-auto" aria-hidden="true" />}
                    {hasErrors && !isCompleted && <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0 ml-auto" aria-hidden="true" />}
                  </div>
                  <div className={cn(
                    "text-[10px] sm:text-xs font-medium truncate",
                    isActive && "text-green-600 dark:text-green-400 font-semibold",
                    hasErrors && !isActive && "text-red-600 dark:text-red-400",
                    !isActive && !hasErrors && "text-muted-foreground"
                  )}>
                    {step.title}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate hidden sm:block mt-0.5">
                    {step.description}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors[currentStep]?.length > 0 && (
        <Alert variant="destructive" className="mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
              {validationErrors[currentStep].map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card ref={contentRef} className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardContent className="p-4 sm:p-6">
          {currentStep === 1 && (
            <ArtistTypeSelector
              selectedType={formData.artist_type || null}
              onSelect={(type) => handleUpdateFormData({ artist_type: type })}
            />
          )}

          {currentStep === 2 && (
            <ArtistBasicInfoForm
              data={formData}
              onUpdate={handleUpdateFormData}
            />
          )}

          {currentStep === 3 && formData.artist_type && (
            <Suspense fallback={<StepSkeleton />}>
              <ArtistSpecificForms
                artistType={formData.artist_type}
                data={formData}
                onUpdate={handleUpdateFormData}
              />
            </Suspense>
          )}

          {currentStep === 4 && (
            <Suspense fallback={<StepSkeleton />}>
              <ArtistShippingConfig
                data={formData}
                onUpdate={handleUpdateFormData}
              />
            </Suspense>
          )}

          {currentStep === 5 && (
            <Suspense fallback={<StepSkeleton />}>
              <ArtistAuthenticationConfig
                data={formData}
                onUpdate={handleUpdateFormData}
              />
            </Suspense>
          )}

          {currentStep === 6 && (
            <Suspense fallback={<StepSkeleton />}>
              <div className="space-y-4">
                <ProductSEOForm
                  data={formData.seo || {}}
                  productName={formData.artwork_title || ''}
                  productDescription={formData.description}
                  onUpdate={(seo) => handleUpdateFormData({ seo })}
                />
                <ProductFAQForm
                  data={(formData.faqs || []).map((faq: any, index: number) => ({
                    id: faq.id || `faq-${Date.now()}-${index}`,
                    question: faq.question || '',
                    answer: faq.answer || '',
                    order: faq.order ?? index,
                  }))}
                  onUpdate={(faqs) => handleUpdateFormData({ faqs })}
                />
              </div>
            </Suspense>
          )}

          {currentStep === 7 && (
            <Suspense fallback={<StepSkeleton />}>
              <PaymentOptionsForm
                productPrice={formData.price || 0}
                productType="physical"
                data={{
                  payment_type: (formData.payment?.payment_type || 'full') as 'full' | 'percentage' | 'delivery_secured',
                  percentage_rate: (formData.payment?.percentage_rate ?? 30),
                }}
                onUpdate={(payment) => handleUpdateFormData({ 
                  payment: {
                    payment_type: payment.payment_type,
                    percentage_rate: payment.percentage_rate ?? 30,
                  }
                })}
              />
            </Suspense>
          )}

          {currentStep === 8 && (
            <Suspense fallback={<StepSkeleton />}>
              <ArtistPreview data={formData} />
            </Suspense>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="w-full sm:w-auto min-h-[44px] touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => saveArtistProduct(true)}
            disabled={isSaving}
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Enregistrer comme brouillon</span>
            <span className="sm:hidden">Brouillon</span>
          </Button>

          {currentStep < STEPS.length ? (
            <Button 
              onClick={handleNext}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={() => saveArtistProduct(false)} 
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Optimisation avec React.memo
export const CreateArtistProductWizard = React.memo(CreateArtistProductWizardComponent);


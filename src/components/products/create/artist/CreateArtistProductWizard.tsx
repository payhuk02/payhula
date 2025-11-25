/**
 * Create Artist Product Wizard
 * Date: 28 Janvier 2025
 * 
 * Wizard professionnel pour la création de produits artistes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { ArtistTypeSelector } from './ArtistTypeSelector';
import { ArtistBasicInfoForm } from './ArtistBasicInfoForm';
import { ArtistSpecificForms } from './ArtistSpecificForms';
import { ArtistShippingConfig } from './ArtistShippingConfig';
import { ArtistAuthenticationConfig } from './ArtistAuthenticationConfig';
import { ArtistPreview } from './ArtistPreview';
import { ProductSEOForm } from '../shared/ProductSEOForm';
import { ProductFAQForm } from '../shared/ProductFAQForm';
import { PaymentOptionsForm } from '../shared/PaymentOptionsForm';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { ArtistProductFormData, ArtistType } from '@/types/artist-product';
import { generateSlug } from '@/lib/validation-utils';

const STEPS = [
  { id: 1, title: 'Type d\'Artiste', description: 'Sélectionnez votre type', icon: Palette },
  { id: 2, title: 'Informations de base', description: 'Artiste & Œuvre', icon: Info },
  { id: 3, title: 'Spécificités', description: 'Détails par type', icon: FileText },
  { id: 4, title: 'Livraison', description: 'Expédition & Assurance', icon: Truck },
  { id: 5, title: 'Authentification', description: 'Certificats', icon: Shield },
  { id: 6, title: 'SEO & FAQs', description: 'Référencement', icon: Search },
  { id: 7, title: 'Paiement', description: 'Options de paiement', icon: CreditCard },
  { id: 8, title: 'Aperçu', description: 'Validation finale', icon: Eye },
];

interface CreateArtistProductWizardProps {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const CreateArtistProductWizard = ({
  storeId: propsStoreId,
  storeSlug,
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
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    artist_social_links: {},
    artwork_title: '',
    artwork_year: null,
    artwork_medium: '',
    artwork_dimensions: { width: null, height: null, depth: null, unit: 'cm' },
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
        if (!formData.images || formData.images.length === 0) {
          toast({ title: 'Erreur', description: 'Veuillez ajouter au moins une image', variant: 'destructive' });
          return false;
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
          price: formData.price || 0,
          currency: 'XOF',
          product_type: 'artist',
          category_id: formData.category_id,
          image_url: formData.images?.[0] || null,
          images: formData.images || [],
          meta_title: formData.seo?.meta_title,
          meta_description: formData.seo?.meta_description,
          og_image: formData.seo?.og_image,
          faqs: formData.faqs || [],
          payment_options: formData.payment || { payment_type: 'full', percentage_rate: 30 },
          is_draft: isDraft,
          is_active: !isDraft,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create artist_product
      const { error: artistError } = await supabase
        .from('artist_products')
        .insert({
          product_id: product.id,
          store_id: store.id,
          artist_type: formData.artist_type,
          artist_name: formData.artist_name,
          artist_bio: formData.artist_bio,
          artist_website: formData.artist_website,
          artist_social_links: formData.artist_social_links || {},
          artwork_title: formData.artwork_title,
          artwork_year: formData.artwork_year,
          artwork_medium: formData.artwork_medium,
          artwork_dimensions: formData.artwork_dimensions,
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
          triggerWebhook(storeId, 'product.created', {
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
  };

  const progress = (currentStep / STEPS.length) * 100;

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
              Retour
            </Button>
          )}
          {isAutoSaving && (
            <Badge variant="secondary" className="ml-auto">
              <Save className="h-3 w-3 mr-1" />
              Sauvegarde...
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">Créer une œuvre d'artiste</h1>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Étape {currentStep} sur {STEPS.length} : {STEPS[currentStep - 1].title}
        </p>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <ArtistTypeSelector
              selectedType={formData.artist_type}
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
            <ArtistSpecificForms
              artistType={formData.artist_type}
              data={formData}
              onUpdate={handleUpdateFormData}
            />
          )}

          {currentStep === 4 && (
            <ArtistShippingConfig
              data={formData}
              onUpdate={handleUpdateFormData}
            />
          )}

          {currentStep === 5 && (
            <ArtistAuthenticationConfig
              data={formData}
              onUpdate={handleUpdateFormData}
            />
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <ProductSEOForm
                data={formData.seo || {}}
                productName={formData.artwork_title || ''}
                productDescription={formData.description}
                onUpdate={(seo) => handleUpdateFormData({ seo })}
              />
              <ProductFAQForm
                data={formData.faqs || []}
                onUpdate={(faqs) => handleUpdateFormData({ faqs })}
              />
            </div>
          )}

          {currentStep === 7 && (
            <PaymentOptionsForm
              productPrice={formData.price || 0}
              productType="physical"
              data={formData.payment || { payment_type: 'full', percentage_rate: 30 }}
              onUpdate={(payment) => handleUpdateFormData({ payment })}
            />
          )}

          {currentStep === 8 && (
            <ArtistPreview data={formData} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => saveArtistProduct(true)}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer comme brouillon
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => saveArtistProduct(false)} disabled={isSaving}>
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


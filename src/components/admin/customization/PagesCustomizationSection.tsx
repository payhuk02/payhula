/**
 * Section Personnalisation des Pages
 * Permet de personnaliser tous les éléments de chaque page (textes, images, couleurs, polices, etc.)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Image as ImageIcon, 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Save, 
  RefreshCw,
  Upload,
  X,
  Plus,
  Trash2,
  Settings,
  ShoppingCart,
  Users,
  Package,
} from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface PagesCustomizationSectionProps {
  onChange?: () => void;
}

// Définition des pages configurables
interface PageConfig {
  id: string;
  name: string;
  route: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: PageSection[];
}

interface PageSection {
  id: string;
  name: string;
  type: 'hero' | 'content' | 'features' | 'testimonials' | 'cta' | 'footer' | 'custom';
  elements: PageElement[];
}

interface PageElement {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'font' | 'number' | 'url' | 'boolean';
  key: string; // Clé pour accéder à la valeur dans i18n ou settings
  defaultValue?: string;
  description?: string;
  options?: { value: string; label: string }[];
}

// Configuration des pages
const PAGES_CONFIG: PageConfig[] = [
  {
    id: 'landing',
    name: 'Page d\'accueil',
    route: '/',
    description: 'Personnalisez tous les éléments de la page d\'accueil',
    icon: Layout,
    sections: [
      {
        id: 'hero',
        name: 'Section Hero',
        type: 'hero',
        elements: [
          { id: 'badge', label: 'Badge', type: 'text', key: 'landing.hero.badge', defaultValue: 'La plateforme e-commerce tout-en-un pour l\'Afrique' },
          { id: 'title', label: 'Titre principal', type: 'textarea', key: 'landing.hero.title', defaultValue: 'Créez votre boutique en ligne en quelques minutes' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.hero.subtitle', defaultValue: 'Vendez vos produits digitaux et physiques avec une plateforme complète, sécurisée et facile à utiliser.' },
          { id: 'ctaPrimary', label: 'Bouton principal', type: 'text', key: 'landing.hero.ctaPrimary', defaultValue: 'Créer ma boutique gratuitement' },
          { id: 'ctaSecondary', label: 'Bouton secondaire', type: 'text', key: 'landing.hero.ctaSecondary', defaultValue: 'Voir la démo' },
          { id: 'bgColor', label: 'Couleur de fond', type: 'color', key: 'landing.hero.bgColor', defaultValue: '#1e293b' },
          { id: 'textColor', label: 'Couleur du texte', type: 'color', key: 'landing.hero.textColor', defaultValue: '#ffffff' },
          { id: 'bgImage', label: 'Image de fond', type: 'image', key: 'landing.hero.bgImage' },
        ],
      },
      {
        id: 'stats',
        name: 'Statistiques',
        type: 'content',
        elements: [
          { id: 'usersLabel', label: 'Label utilisateurs', type: 'text', key: 'landing.stats.users', defaultValue: 'Utilisateurs' },
          { id: 'salesLabel', label: 'Label ventes', type: 'text', key: 'landing.stats.sales', defaultValue: 'Ventes' },
          { id: 'storesLabel', label: 'Label boutiques', type: 'text', key: 'landing.stats.stores', defaultValue: 'Boutiques' },
        ],
      },
      {
        id: 'features',
        name: 'Section Fonctionnalités',
        type: 'features',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'landing.features.title', defaultValue: 'Fonctionnalités clés' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.features.subtitle', defaultValue: 'Tout ce dont vous avez besoin pour réussir en ligne' },
        ],
      },
      {
        id: 'testimonials',
        name: 'Témoignages',
        type: 'testimonials',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'landing.testimonials.title', defaultValue: 'Ils réussissent avec Payhuk' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'landing.testimonials.subtitle', defaultValue: 'Rejoignez des centaines d\'entrepreneurs qui développent leur activité' },
        ],
      },
    ],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    route: '/marketplace',
    description: 'Personnalisez tous les éléments de la page marketplace',
    icon: ShoppingCart,
    sections: [
      {
        id: 'hero',
        name: 'Section Hero',
        type: 'hero',
        elements: [
          { id: 'title', label: 'Titre principal', type: 'textarea', key: 'marketplace.hero.title', defaultValue: 'Découvrez notre marketplace' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'marketplace.hero.subtitle', defaultValue: 'Explorez des milliers de produits digitaux' },
          { id: 'tagline', label: 'Tagline', type: 'text', key: 'marketplace.hero.tagline', defaultValue: 'Tout ce dont vous avez besoin' },
          { id: 'searchPlaceholder', label: 'Placeholder recherche', type: 'text', key: 'marketplace.searchPlaceholder', defaultValue: 'Rechercher un produit...' },
          { id: 'bgGradient', label: 'Dégradé de fond', type: 'color', key: 'marketplace.hero.bgGradient', defaultValue: '#1e293b' },
        ],
      },
      {
        id: 'cta',
        name: 'Call to Action',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre CTA', type: 'text', key: 'marketplace.cta.title', defaultValue: 'Prêt à commencer ?' },
          { id: 'subtitle', label: 'Sous-titre CTA', type: 'textarea', key: 'marketplace.cta.subtitle', defaultValue: 'Rejoignez des milliers d\'entrepreneurs' },
          { id: 'startFree', label: 'Bouton Commencer gratuitement', type: 'text', key: 'marketplace.cta.startFree', defaultValue: 'Commencer gratuitement' },
          { id: 'joinCommunity', label: 'Bouton Rejoindre communauté', type: 'text', key: 'marketplace.cta.joinCommunity', defaultValue: 'Rejoindre la communauté' },
        ],
      },
      {
        id: 'filters',
        name: 'Filtres',
        type: 'content',
        elements: [
          { id: 'filtersActive', label: 'Label Filtres actifs', type: 'text', key: 'marketplace.filtersActive', defaultValue: 'Filtres actifs' },
          { id: 'filterCategory', label: 'Label Catégorie', type: 'text', key: 'marketplace.filterLabels.category', defaultValue: 'Catégorie' },
          { id: 'filterType', label: 'Label Type', type: 'text', key: 'marketplace.filterLabels.type', defaultValue: 'Type' },
          { id: 'filterPriceRange', label: 'Label Fourchette prix', type: 'text', key: 'marketplace.filterLabels.priceRange', defaultValue: 'Fourchette de prix' },
          { id: 'filterVerified', label: 'Label Vérifié', type: 'text', key: 'marketplace.filterLabels.verified', defaultValue: 'Vérifié' },
          { id: 'filterFeatured', label: 'Label En vedette', type: 'text', key: 'marketplace.filterLabels.featured', defaultValue: 'En vedette' },
          { id: 'filterTag', label: 'Label Tag', type: 'text', key: 'marketplace.filterLabels.tag', defaultValue: 'Tag' },
          { id: 'filterClear', label: 'Bouton Effacer', type: 'text', key: 'marketplace.filterLabels.clear', defaultValue: 'Effacer' },
          { id: 'filterAll', label: 'Label Tout', type: 'text', key: 'marketplace.filterLabels.all', defaultValue: 'Tout' },
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    route: '/dashboard',
    description: 'Personnalisez tous les éléments du tableau de bord',
    icon: Layout,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'welcomeMessage', label: 'Message de bienvenue', type: 'textarea', key: 'dashboard.welcome', defaultValue: 'Bienvenue sur votre tableau de bord' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'dashboard.subtitle', defaultValue: 'Gérez votre boutique en toute simplicité' },
          { id: 'titleWithStore', label: 'Titre avec nom boutique', type: 'text', key: 'dashboard.titleWithStore', defaultValue: 'Tableau de bord' },
          { id: 'online', label: 'Label En ligne', type: 'text', key: 'dashboard.online', defaultValue: 'En ligne' },
          { id: 'refresh', label: 'Label Actualiser', type: 'text', key: 'dashboard.refresh', defaultValue: 'Actualiser' },
          { id: 'createStorePrompt', label: 'Message Créer boutique', type: 'textarea', key: 'dashboard.createStorePrompt', defaultValue: 'Créez votre première boutique pour commencer' },
          { id: 'createStoreButton', label: 'Bouton Créer boutique', type: 'text', key: 'dashboard.createStoreButton', defaultValue: 'Créer ma boutique' },
        ],
      },
    ],
  },
  {
    id: 'storefront',
    name: 'Storefront',
    route: '/stores/:slug',
    description: 'Personnalisez tous les éléments de la page boutique',
    icon: ShoppingCart,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'storefront.header.title', defaultValue: 'Boutique' },
          { id: 'subtitle', label: 'Sous-titre', type: 'textarea', key: 'storefront.header.subtitle', defaultValue: 'Découvrez nos produits' },
          { id: 'noProducts', label: 'Message Aucun produit', type: 'textarea', key: 'storefront.noProducts', defaultValue: 'Aucun produit disponible pour le moment' },
          { id: 'loading', label: 'Message Chargement', type: 'text', key: 'storefront.loading', defaultValue: 'Chargement des produits...' },
        ],
      },
    ],
  },
  {
    id: 'productDetail',
    name: 'Détail Produit',
    route: '/stores/:slug/products/:productSlug',
    description: 'Personnalisez tous les éléments de la page produit',
    icon: Package,
    sections: [
      {
        id: 'cta',
        name: 'Call to Action',
        type: 'content',
        elements: [
          { id: 'addToCart', label: 'Texte "Ajouter au panier"', type: 'text', key: 'productDetail.cta.addToCart', defaultValue: 'Ajouter au panier' },
          { id: 'buyNow', label: 'Texte "Acheter maintenant"', type: 'text', key: 'productDetail.cta.buyNow', defaultValue: 'Acheter maintenant' },
          { id: 'outOfStock', label: 'Message Rupture de stock', type: 'text', key: 'productDetail.outOfStock', defaultValue: 'Rupture de stock' },
          { id: 'freeProduct', label: 'Label Produit gratuit', type: 'text', key: 'productDetail.freeProduct', defaultValue: 'Gratuit' },
          { id: 'loading', label: 'Message Chargement', type: 'text', key: 'productDetail.loading', defaultValue: 'Chargement du produit...' },
        ],
      },
    ],
  },
  {
    id: 'cart',
    name: 'Panier',
    route: '/cart',
    description: 'Personnalisez tous les éléments de la page panier',
    icon: ShoppingCart,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'title', label: 'Titre', type: 'text', key: 'cart.title', defaultValue: 'Mon panier' },
          { id: 'emptyMessage', label: 'Message panier vide', type: 'textarea', key: 'cart.emptyMessage', defaultValue: 'Votre panier est vide' },
          { id: 'emptySubtitle', label: 'Sous-titre panier vide', type: 'textarea', key: 'cart.emptySubtitle', defaultValue: 'Ajoutez des produits pour commencer' },
          { id: 'emptyCta', label: 'Bouton Continuer shopping', type: 'text', key: 'cart.emptyCta', defaultValue: 'Continuer mes achats' },
          { id: 'clearCart', label: 'Bouton Vider panier', type: 'text', key: 'cart.clearCart', defaultValue: 'Vider le panier' },
          { id: 'itemCount', label: 'Label Nombre d\'articles', type: 'text', key: 'cart.itemCount', defaultValue: 'articles' },
        ],
      },
    ],
  },
  {
    id: 'auth',
    name: 'Authentification',
    route: '/auth',
    description: 'Personnalisez tous les éléments de la page connexion/inscription',
    icon: Users,
    sections: [
      {
        id: 'header',
        name: 'En-tête',
        type: 'content',
        elements: [
          { id: 'loginTitle', label: 'Titre connexion', type: 'text', key: 'auth.login.title', defaultValue: 'Connexion' },
          { id: 'signupTitle', label: 'Titre inscription', type: 'text', key: 'auth.signup.title', defaultValue: 'Créer un compte' },
          { id: 'welcomeMessage', label: 'Message de bienvenue', type: 'textarea', key: 'auth.welcome', defaultValue: 'Bienvenue sur Payhuk' },
          { id: 'loginButton', label: 'Bouton Se connecter', type: 'text', key: 'auth.login.button', defaultValue: 'Se connecter' },
          { id: 'signupButton', label: 'Bouton S\'inscrire', type: 'text', key: 'auth.signup.button', defaultValue: 'S\'inscrire' },
          { id: 'forgotPassword', label: 'Lien Mot de passe oublié', type: 'text', key: 'auth.forgotPassword.link', defaultValue: 'Mot de passe oublié ?' },
          { id: 'alreadyHaveAccount', label: 'Message Déjà un compte', type: 'text', key: 'auth.alreadyHaveAccount', defaultValue: 'Déjà un compte ?' },
          { id: 'noAccount', label: 'Message Pas de compte', type: 'text', key: 'auth.noAccount', defaultValue: 'Pas encore de compte ?' },
        ],
      },
    ],
  },
];

export const PagesCustomizationSection = ({ onChange }: PagesCustomizationSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState<string>('landing');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [pageValues, setPageValues] = useState<Record<string, Record<string, any>>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  // Charger les valeurs existantes
  useEffect(() => {
    if (customizationData?.pages) {
      setPageValues(customizationData.pages);
    }
  }, [customizationData]);

  const selectedPageConfig = useMemo(() => 
    PAGES_CONFIG.find(p => p.id === selectedPage),
    [selectedPage]
  );

  const handleElementChange = useCallback((pageId: string, elementKey: string, value: any) => {
    setPageValues(prev => {
      const updated = {
        ...prev,
        [pageId]: {
          ...prev[pageId],
          [elementKey]: value,
        },
      };
      
      // Sauvegarder automatiquement avec les données à jour
      save('pages', {
        ...prev,
        [pageId]: {
          ...prev[pageId],
          [elementKey]: value,
        },
      }).catch(console.error);
      
      return updated;
    });

    if (onChange) onChange();
  }, [save, onChange]);

  const handleImageUpload = useCallback(async (pageId: string, elementKey: string, file: File) => {
    try {
      setUploadingImages(prev => ({ ...prev, [`${pageId}.${elementKey}`]: true }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${pageId}/${elementKey}-${Date.now()}.${fileExt}`;
      const filePath = `page-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(filePath);

      handleElementChange(pageId, elementKey, publicUrl);

      toast({
        title: 'Image uploadée',
        description: 'L\'image a été uploadée avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'uploader l\'image.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(prev => ({ ...prev, [`${pageId}.${elementKey}`]: false }));
    }
  }, [handleElementChange, toast]);

  const getElementValue = useCallback((pageId: string, elementKey: string, defaultValue?: string) => {
    return pageValues[pageId]?.[elementKey] ?? defaultValue ?? '';
  }, [pageValues]);

  const renderElementEditor = useCallback((pageId: string, element: PageElement) => {
    const value = getElementValue(pageId, element.key, element.defaultValue);

    switch (element.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
            placeholder={element.defaultValue}
            className="text-sm"
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
            placeholder={element.defaultValue}
            rows={3}
            className="text-sm"
          />
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value || element.defaultValue || '#000000'}
              onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={value || element.defaultValue || ''}
              onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
              placeholder={element.defaultValue}
              className="flex-1 text-sm"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {value && (
              <div className="relative w-32 h-32 border-2 border-dashed border-border rounded-lg overflow-hidden">
                <img src={value} alt={element.label} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleElementChange(pageId, element.key, '')}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(pageId, element.key, file);
                }}
                className="hidden"
                id={`image-${pageId}-${element.key}`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`image-${pageId}-${element.key}`)?.click()}
                disabled={uploadingImages[`${pageId}.${element.key}`]}
                className="w-full sm:w-auto"
              >
                {uploadingImages[`${pageId}.${element.key}`] ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {value ? 'Remplacer' : 'Uploader'}
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'font':
        return (
          <Select
            value={value || element.defaultValue || 'Poppins'}
            onValueChange={(val) => handleElementChange(pageId, element.key, val)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Poppins">Poppins</SelectItem>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
              <SelectItem value="Open Sans">Open Sans</SelectItem>
              <SelectItem value="Montserrat">Montserrat</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || element.defaultValue || 0}
            onChange={(e) => handleElementChange(pageId, element.key, parseFloat(e.target.value) || 0)}
            className="text-sm"
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value || element.defaultValue || ''}
            onChange={(e) => handleElementChange(pageId, element.key, e.target.value)}
            placeholder={element.defaultValue}
            className="text-sm"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value ?? (element.defaultValue === 'true')}
              onChange={(e) => handleElementChange(pageId, element.key, e.target.checked)}
              className="rounded"
            />
            <Label className="text-sm">{element.label}</Label>
          </div>
        );

      default:
        return null;
    }
  }, [getElementValue, handleElementChange, handleImageUpload, uploadingImages]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sélection de la page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Sélectionner une page
          </CardTitle>
          <CardDescription>
            Choisissez la page que vous souhaitez personnaliser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PAGES_CONFIG.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page.id);
                    setSelectedSection(page.sections[0]?.id || '');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPage === page.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold">{page.name}</div>
                      <div className="text-xs text-muted-foreground">{page.route}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {page.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Éditeur de la page sélectionnée */}
      {selectedPageConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <selectedPageConfig.icon className="h-5 w-5" />
                  {selectedPageConfig.name}
                </CardTitle>
                <CardDescription>
                  Personnalisez tous les éléments de cette page
                </CardDescription>
              </div>
              <Badge variant="outline">{selectedPageConfig.sections.length} sections</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedSection || selectedPageConfig.sections[0]?.id} onValueChange={setSelectedSection}>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <TabsList className="inline-flex w-full justify-start p-1">
                  {selectedPageConfig.sections.map((section) => (
                    <TabsTrigger key={section.id} value={section.id} className="text-xs sm:text-sm shrink-0">
                      {section.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {selectedPageConfig.sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {section.elements.map((element) => (
                      <div key={element.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${selectedPage}-${element.id}`} className="text-sm font-medium">
                            {element.label}
                          </Label>
                          {element.description && (
                            <Badge variant="secondary" className="text-xs">
                              {element.type}
                            </Badge>
                          )}
                        </div>
                        {element.description && (
                          <p className="text-xs text-muted-foreground">{element.description}</p>
                        )}
                        {renderElementEditor(selectedPage, element)}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


/**
 * Platform Customization - Page d'administration centralisée
 * Permet de personnaliser tous les éléments de la plateforme
 * Date: 2025-01-30
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Palette,
  Image,
  Type,
  Settings,
  Mail,
  Globe,
  Shield,
  Bell,
  DollarSign,
  Users,
  ShoppingCart,
  FileText,
  Zap,
  Save,
  Eye,
  RefreshCw,
  Layout,
  Home,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DesignBrandingSection } from '@/components/admin/customization/DesignBrandingSection';
import { PlatformSettingsSection } from '@/components/admin/customization/PlatformSettingsSection';
import { ContentManagementSection } from '@/components/admin/customization/ContentManagementSection';
import { IntegrationsSection } from '@/components/admin/customization/IntegrationsSection';
import { SecuritySection } from '@/components/admin/customization/SecuritySection';
import { FeaturesSection } from '@/components/admin/customization/FeaturesSection';
import { NotificationsSection } from '@/components/admin/customization/NotificationsSection';
import { PagesCustomizationSection } from '@/components/admin/customization/PagesCustomizationSection';
import { LandingPageCustomizationSection } from '@/components/admin/customization/LandingPageCustomizationSection';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

type CustomizationSection = 
  | 'design'
  | 'settings'
  | 'content'
  | 'integrations'
  | 'security'
  | 'features'
  | 'notifications'
  | 'landing'
  | 'pages';

interface SectionConfig {
  id: CustomizationSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const sections: SectionConfig[] = [
  {
    id: 'design',
    label: 'Design & Branding',
    icon: Palette,
    description: 'Couleurs, logos, typographie, thème',
    badge: 'Visuel',
  },
  {
    id: 'settings',
    label: 'Paramètres Plateforme',
    icon: Settings,
    description: 'Commissions, retraits, limites',
  },
  {
    id: 'content',
    label: 'Contenu & Textes',
    icon: FileText,
    description: 'Textes, emails, notifications',
  },
  {
    id: 'integrations',
    label: 'Intégrations',
    icon: Globe,
    description: 'APIs, webhooks, services externes',
  },
  {
    id: 'security',
    label: 'Sécurité',
    icon: Shield,
    description: '2FA, permissions, audit',
  },
  {
    id: 'features',
    label: 'Fonctionnalités',
    icon: Zap,
    description: 'Activer/désactiver des fonctionnalités',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Configuration des notifications',
  },
  {
    id: 'landing',
    label: 'Page d\'accueil',
    icon: Home,
    description: 'Personnalisez tous les éléments de la page d\'accueil',
    badge: 'Important',
  },
  {
    id: 'pages',
    label: 'Pages',
    icon: Layout,
    description: 'Personnalisation de chaque page',
    badge: 'Nouveau',
  },
];

export const PlatformCustomization = () => {
  const [activeSection, setActiveSection] = useState<CustomizationSection>('design');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { saveAll, isSaving, previewMode, togglePreview, load, customizationData } = usePlatformCustomization();
  
  // Charger les données au montage
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        await load();
      } catch (error) {
        console.warn('Error loading customization data:', error);
        toast({
          title: 'Avertissement',
          description: 'Impossible de charger les paramètres de personnalisation. Utilisation des valeurs par défaut.',
          variant: 'default',
        });
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [load, toast]);

  // Détecter les changements non sauvegardés
  useEffect(() => {
    // Cette logique sera gérée par chaque section via onChange
  }, [customizationData]);

  const handleSave = async () => {
    if (previewMode) {
      toast({
        title: '⚠️ Mode aperçu actif',
        description: 'Désactivez le mode aperçu pour sauvegarder les modifications.',
        variant: 'default',
      });
      return;
    }
    
    try {
      await saveAll();
      setHasUnsavedChanges(false);
      toast({
        title: '✅ Sauvegarde réussie',
        description: 'Toutes les modifications ont été enregistrées.',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder les modifications.',
        variant: 'destructive',
      });
    }
  };

  const handleSectionChange = useCallback((section: CustomizationSection) => {
    setActiveSection(section);
  }, []);

  const handleChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const renderSectionContent = useMemo(() => {
    switch (activeSection) {
      case 'design':
        return <DesignBrandingSection onChange={handleChange} />;
      case 'settings':
        return <PlatformSettingsSection onChange={handleChange} />;
      case 'content':
        return <ContentManagementSection onChange={handleChange} />;
      case 'integrations':
        return <IntegrationsSection onChange={handleChange} />;
      case 'security':
        return <SecuritySection onChange={handleChange} />;
      case 'features':
        return <FeaturesSection onChange={handleChange} />;
      case 'notifications':
        return <NotificationsSection onChange={handleChange} />;
      case 'landing':
        return <LandingPageCustomizationSection onChange={handleChange} />;
      case 'pages':
        return <PagesCustomizationSection onChange={handleChange} />;
      default:
        return null;
    }
  }, [activeSection, handleChange]);

  const activeSectionConfig = sections.find(s => s.id === activeSection);

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden">
        {/* Sidebar - Responsive avec drawer mobile */}
        <aside className="w-full lg:w-64 border-r bg-card/50 backdrop-blur-sm flex flex-col shrink-0 max-h-screen lg:max-h-[calc(100vh-4rem)]">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Personnalisation
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configurez tous les aspects de la plateforme
            </p>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-2 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      'w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                      'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                    aria-label={section.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary-foreground')} />
                    <span className="flex-1 text-left truncate">{section.label}</span>
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                        {section.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer avec actions */}
          <div className="p-4 border-t space-y-2">
                  <Button
                    onClick={togglePreview}
                    variant={previewMode ? "default" : "outline"}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? 'Quitter l\'aperçu' : 'Aperçu'}
                  </Button>
                  {previewMode && (
                    <p className="text-xs text-amber-600 text-center mt-1">
                      Mode aperçu actif - Les modifications ne seront pas sauvegardées
                    </p>
                  )}
            <Button
              onClick={handleSave}
              disabled={(!hasUnsavedChanges && !previewMode) || isSaving || previewMode}
              className="w-full"
              size="sm"
              variant={previewMode ? "secondary" : "default"}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : previewMode ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mode aperçu actif
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
            {/* Header - Responsive */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3 flex-wrap">
                    {activeSectionConfig && (
                      <>
                        <activeSectionConfig.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary shrink-0" />
                        <span className="truncate">{activeSectionConfig.label}</span>
                      </>
                    )}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                    {activeSectionConfig?.description}
                  </p>
                </div>
              </div>
              <Separator />
            </div>

            {/* Section Content */}
            <div className="space-y-4 sm:space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="flex flex-col items-center gap-3 sm:gap-4">
                    <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    <p className="text-sm sm:text-base text-muted-foreground">Chargement des paramètres...</p>
                  </div>
                </div>
              ) : (
                renderSectionContent
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
};


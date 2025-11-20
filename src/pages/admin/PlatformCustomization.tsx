/**
 * Platform Customization - Page d'administration centralisée
 * Permet de personnaliser tous les éléments de la plateforme
 * Date: 2025-01-30
 */

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DesignBrandingSection } from '@/components/admin/customization/DesignBrandingSection';
import { PlatformSettingsSection } from '@/components/admin/customization/PlatformSettingsSection';
import { ContentManagementSection } from '@/components/admin/customization/ContentManagementSection';
import { IntegrationsSection } from '@/components/admin/customization/IntegrationsSection';
import { SecuritySection } from '@/components/admin/customization/SecuritySection';
import { FeaturesSection } from '@/components/admin/customization/FeaturesSection';
import { NotificationsSection } from '@/components/admin/customization/NotificationsSection';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

type CustomizationSection = 
  | 'design'
  | 'settings'
  | 'content'
  | 'integrations'
  | 'security'
  | 'features'
  | 'notifications';

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
];

export const PlatformCustomization = () => {
  const [activeSection, setActiveSection] = useState<CustomizationSection>('design');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  const { saveAll, isSaving, previewMode, togglePreview } = usePlatformCustomization();

  const handleSave = async () => {
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

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'design':
        return <DesignBrandingSection onChange={() => setHasUnsavedChanges(true)} />;
      case 'settings':
        return <PlatformSettingsSection onChange={() => setHasUnsavedChanges(true)} />;
      case 'content':
        return <ContentManagementSection onChange={() => setHasUnsavedChanges(true)} />;
      case 'integrations':
        return <IntegrationsSection onChange={() => setHasUnsavedChanges(true)} />;
      case 'security':
        return <SecuritySection onChange={() => setHasUnsavedChanges(true)} />;
      case 'features':
        return <FeaturesSection onChange={() => setHasUnsavedChanges(true)} />;
      case 'notifications':
        return <NotificationsSection onChange={() => setHasUnsavedChanges(true)} />;
      default:
        return null;
    }
  };

  const activeSectionConfig = sections.find(s => s.id === activeSection);

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card/50 backdrop-blur-sm flex flex-col">
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
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'text-primary-foreground')} />
                    <span className="flex-1 text-left">{section.label}</span>
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs">
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
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Quitter l\'aperçu' : 'Aperçu'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="w-full"
              size="sm"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
            {hasUnsavedChanges && (
              <p className="text-xs text-muted-foreground text-center">
                Modifications non sauvegardées
              </p>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    {activeSectionConfig && (
                      <>
                        <activeSectionConfig.icon className="h-8 w-8 text-primary" />
                        {activeSectionConfig.label}
                      </>
                    )}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {activeSectionConfig?.description}
                  </p>
                </div>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Modifications en attente
                  </Badge>
                )}
              </div>
              <Separator />
            </div>

            {/* Section Content */}
            <div className="space-y-6">
              {renderSectionContent()}
            </div>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
};


/**
 * Section Fonctionnalités
 * Activer/désactiver toutes les fonctionnalités de la plateforme
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Zap, Search, Users, Gift, Star, ShoppingCart, GraduationCap, CreditCard, Globe, Shield, Bell, TrendingUp } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

interface FeaturesSectionProps {
  onChange?: () => void;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  route?: string;
}

const ALL_FEATURES: Feature[] = [
  // Commerce
  {
    id: 'affiliation',
    name: 'Programme d\'affiliation',
    description: 'Système de parrainage et commissions pour les produits',
    category: 'Commerce',
    icon: TrendingUp,
    enabled: true,
    route: '/dashboard/affiliates',
  },
  {
    id: 'gift_cards',
    name: 'Cartes cadeaux',
    description: 'Vente et utilisation de cartes cadeaux',
    category: 'Commerce',
    icon: Gift,
    enabled: true,
    route: '/dashboard/gift-cards',
  },
  {
    id: 'loyalty',
    name: 'Programme de fidélité',
    description: 'Points de fidélité et récompenses',
    category: 'Commerce',
    icon: Star,
    enabled: true,
    route: '/admin/loyalty',
  },
  {
    id: 'referrals',
    name: 'Parrainage',
    description: 'Système de parrainage utilisateur',
    category: 'Commerce',
    icon: Users,
    enabled: true,
    route: '/admin/referrals',
  },
  
  // Produits
  {
    id: 'digital_products',
    name: 'Produits digitaux',
    description: 'Vente de produits numériques (ebooks, logiciels, etc.)',
    category: 'Produits',
    icon: ShoppingCart,
    enabled: true,
    route: '/dashboard/digital-products',
  },
  {
    id: 'physical_products',
    name: 'Produits physiques',
    description: 'Vente de produits physiques avec gestion d\'inventaire',
    category: 'Produits',
    icon: ShoppingCart,
    enabled: true,
    route: '/dashboard/products',
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Réservation et gestion de services',
    category: 'Produits',
    icon: ShoppingCart,
    enabled: true,
    route: '/dashboard/bookings',
  },
  {
    id: 'courses',
    name: 'Cours en ligne',
    description: 'Création et vente de cours en ligne',
    category: 'Produits',
    icon: GraduationCap,
    enabled: true,
    route: '/dashboard/courses',
  },
  
  // Paiements
  {
    id: 'moneroo',
    name: 'Moneroo',
    description: 'Intégration Moneroo pour les paiements',
    category: 'Paiements',
    icon: CreditCard,
    enabled: true,
  },
  {
    id: 'paydunya',
    name: 'PayDunya',
    description: 'Intégration PayDunya pour les paiements',
    category: 'Paiements',
    icon: CreditCard,
    enabled: true,
  },
  
  // Intégrations
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Système de webhooks pour intégrations externes',
    category: 'Intégrations',
    icon: Globe,
    enabled: true,
    route: '/admin/webhooks',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Outils d\'analyse et de statistiques',
    category: 'Intégrations',
    icon: TrendingUp,
    enabled: true,
    route: '/admin/analytics',
  },
  
  // Sécurité
  {
    id: 'two_factor',
    name: 'Authentification à deux facteurs (2FA)',
    description: 'Sécurité renforcée avec 2FA',
    category: 'Sécurité',
    icon: Shield,
    enabled: true,
    route: '/admin/security',
  },
  {
    id: 'kyc',
    name: 'Vérification d\'identité (KYC)',
    description: 'Système de vérification d\'identité',
    category: 'Sécurité',
    icon: Shield,
    enabled: true,
    route: '/admin/kyc',
  },
  
  // Notifications
  {
    id: 'email_notifications',
    name: 'Notifications email',
    description: 'Envoi de notifications par email',
    category: 'Notifications',
    icon: Bell,
    enabled: true,
  },
  {
    id: 'sms_notifications',
    name: 'Notifications SMS',
    description: 'Envoi de notifications par SMS',
    category: 'Notifications',
    icon: Bell,
    enabled: false,
  },
  {
    id: 'push_notifications',
    name: 'Notifications push',
    description: 'Notifications dans le navigateur',
    category: 'Notifications',
    icon: Bell,
    enabled: true,
  },
];

export const FeaturesSection = ({ onChange }: FeaturesSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [features, setFeatures] = useState<Feature[]>(ALL_FEATURES);

  useEffect(() => {
    // Charger les états depuis la configuration
    if (customizationData?.features?.enabled || customizationData?.features?.disabled) {
      setFeatures(prev => prev.map(feature => {
        const isEnabled = customizationData.features.enabled?.includes(feature.id) ?? 
                         !customizationData.features.disabled?.includes(feature.id);
        return { ...feature, enabled: isEnabled };
      }));
    }
  }, [customizationData]);

  const categories = Array.from(new Set(ALL_FEATURES.map(f => f.category)));

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleFeature = (featureId: string, enabled: boolean) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, enabled } : f
    ));

    const enabledFeatures = features
      .filter(f => f.id === featureId ? enabled : f.enabled)
      .map(f => f.id);
    
    const disabledFeatures = features
      .filter(f => f.id === featureId ? !enabled : !f.enabled)
      .map(f => f.id);

    save('features', {
      enabled: enabledFeatures,
      disabled: disabledFeatures,
    });

    if (onChange) onChange();
  };

  const enabledCount = features.filter(f => f.enabled).length;
  const disabledCount = features.filter(f => !f.enabled).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Fonctionnalités de la plateforme
              </CardTitle>
              <CardDescription>
                Activez ou désactivez des fonctionnalités de la plateforme
              </CardDescription>
            </div>
            <div className="flex gap-4 text-sm">
              <Badge variant="default" className="bg-green-500">
                {enabledCount} activées
              </Badge>
              <Badge variant="secondary">
                {disabledCount} désactivées
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche et filtres */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une fonctionnalité..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Toutes
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Liste des fonctionnalités */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredFeatures.map((feature) => {
              const Icon = feature.icon;
              
              return (
                <Card key={feature.id} className={feature.enabled ? 'border-primary/20' : 'opacity-60'}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${feature.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`h-5 w-5 ${feature.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="text-base font-semibold">{feature.name}</Label>
                            <Badge variant="outline" className="text-xs">
                              {feature.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                          {feature.route && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Route: <code className="bg-muted px-1 rounded">{feature.route}</code>
                            </p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune fonctionnalité trouvée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Section Gestion du Contenu
 * Textes, emails, notifications - Personnalisation complète
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Mail, Bell, Globe, Search, Save, RefreshCw } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

interface ContentManagementSectionProps {
  onChange?: () => void;
}

// Textes clés importants de la plateforme
const KEY_TEXTS = [
  { key: 'marketplace.hero.title', label: 'Titre principal marketplace', category: 'Marketplace' },
  { key: 'marketplace.hero.subtitle', label: 'Sous-titre marketplace', category: 'Marketplace' },
  { key: 'marketplace.hero.tagline', label: 'Slogan marketplace', category: 'Marketplace' },
  { key: 'dashboard.welcome', label: 'Message de bienvenue dashboard', category: 'Dashboard' },
  { key: 'footer.about', label: 'À propos (footer)', category: 'Footer' },
  { key: 'footer.contact', label: 'Contact (footer)', category: 'Footer' },
  { key: 'errors.generic', label: 'Message d\'erreur générique', category: 'Erreurs' },
  { key: 'errors.notFound', label: 'Page non trouvée', category: 'Erreurs' },
  { key: 'settings.title', label: 'Titre paramètres', category: 'Paramètres' },
  { key: 'notifications.title', label: 'Titre notifications', category: 'Notifications' },
];

export const ContentManagementSection = ({ onChange }: ContentManagementSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customizationData?.content?.texts) {
      setCustomTexts(customizationData.content.texts);
    }
  }, [customizationData]);

  const categories = Array.from(new Set(KEY_TEXTS.map(t => t.category)));

  const filteredTexts = KEY_TEXTS.filter(text => {
    const matchesSearch = text.label.toLowerCase().includes(searchText.toLowerCase()) ||
                         text.key.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || text.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTextChange = (key: string, value: string) => {
    setCustomTexts(prev => ({ ...prev, [key]: value }));
    save('content', {
      ...customizationData?.content,
      texts: {
        ...customTexts,
        [key]: value,
      },
    });
    if (onChange) onChange();
  };

  const resetText = (key: string) => {
    const newTexts = { ...customTexts };
    delete newTexts[key];
    setCustomTexts(newTexts);
    save('content', {
      ...customizationData?.content,
      texts: newTexts,
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="texts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="texts">
            <FileText className="h-4 w-4 mr-2" />
            Textes ({KEY_TEXTS.length})
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="h-4 w-4 mr-2" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Textes */}
        <TabsContent value="texts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Textes de la plateforme</CardTitle>
              <CardDescription>
                Personnalisez les textes affichés sur la plateforme. Les modifications sont appliquées en temps réel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche et filtres */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un texte..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Tous
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

              {/* Liste des textes */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredTexts.map((text) => {
                  const currentValue = customTexts[text.key] || text.key;
                  const isCustom = !!customTexts[text.key];

                  return (
                    <Card key={text.key} className={isCustom ? 'border-primary' : ''}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Label className="text-sm font-semibold">{text.label}</Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Clé: <code className="bg-muted px-1 rounded">{text.key}</code>
                              </p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {text.category}
                              </Badge>
                            </div>
                            {isCustom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetText(text.key)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Réinitialiser
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Valeur actuelle:
                            </Label>
                            <Textarea
                              value={currentValue}
                              onChange={(e) => handleTextChange(text.key, e.target.value)}
                              rows={2}
                              className="font-medium"
                            />
                            {!isCustom && (
                              <p className="text-xs text-muted-foreground">
                                Valeur par défaut: {text.key}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails */}
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modèles d'emails</CardTitle>
              <CardDescription>
                Personnalisez les emails envoyés aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email de bienvenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Sujet et contenu de l'email de bienvenue..."
                      rows={6}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email de commande</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Sujet et contenu de l'email de confirmation de commande..."
                      rows={6}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email de paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Sujet et contenu de l'email de confirmation de paiement..."
                      rows={6}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email de réinitialisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Sujet et contenu de l'email de réinitialisation de mot de passe..."
                      rows={6}
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages de notification</CardTitle>
              <CardDescription>
                Personnalisez les messages de notification affichés aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Notification de nouvelle commande</Label>
                  <Input
                    placeholder="Vous avez reçu une nouvelle commande"
                    defaultValue={customizationData?.content?.notifications?.newOrder || ''}
                    onChange={(e) => {
                      save('content', {
                        ...customizationData?.content,
                        notifications: {
                          ...customizationData?.content?.notifications,
                          newOrder: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notification de paiement reçu</Label>
                  <Input
                    placeholder="Paiement reçu avec succès"
                    defaultValue={customizationData?.content?.notifications?.paymentReceived || ''}
                    onChange={(e) => {
                      save('content', {
                        ...customizationData?.content,
                        notifications: {
                          ...customizationData?.content?.notifications,
                          paymentReceived: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notification de nouveau message</Label>
                  <Input
                    placeholder="Vous avez reçu un nouveau message"
                    defaultValue={customizationData?.content?.notifications?.newMessage || ''}
                    onChange={(e) => {
                      save('content', {
                        ...customizationData?.content,
                        notifications: {
                          ...customizationData?.content?.notifications,
                          newMessage: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

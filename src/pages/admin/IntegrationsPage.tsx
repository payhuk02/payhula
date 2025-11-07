/**
 * Integrations Configuration Page
 * Date: 30 Janvier 2025
 * 
 * Page de configuration pour toutes les intégrations (Zoom, OpenAI, Shipping APIs)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Video,
  Brain,
  Truck,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { Skeleton } from '@/components/ui/skeleton';

interface StoreIntegration {
  id: string;
  store_id: string;
  integration_type: string;
  display_name: string;
  config: Record<string, any>;
  is_active: boolean;
  is_enabled: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function IntegrationsPage() {
  const { store, isLoading: storeLoading } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<StoreIntegration | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');

  // Fetch integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['store-integrations', store?.id],
    queryFn: async () => {
      if (!store?.id) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StoreIntegration[];
    },
    enabled: !!store?.id,
  });

  // Create/Update integration
  const saveIntegration = useMutation({
    mutationFn: async ({
      integration,
      isNew,
    }: {
      integration: Partial<StoreIntegration>;
      isNew: boolean;
    }) => {
      if (!store?.id) throw new Error('Store ID manquant');

      if (isNew) {
        const { data, error } = await supabase
          .from('store_integrations')
          .insert([{
            ...integration,
            store_id: store.id,
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('store_integrations')
          .update(integration)
          .eq('id', selectedIntegration?.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      setIsDialogOpen(false);
      setSelectedIntegration(null);
      setSelectedType('');
      toast({
        title: '✅ Intégration sauvegardée',
        description: 'La configuration a été sauvegardée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder la configuration',
        variant: 'destructive',
      });
    },
  });

  // Delete integration
  const deleteIntegration = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('store_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast({
        title: '✅ Intégration supprimée',
        description: 'L\'intégration a été supprimée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer l\'intégration',
        variant: 'destructive',
      });
    },
  });

  // Toggle integration
  const toggleIntegration = useMutation({
    mutationFn: async ({
      integrationId,
      isActive,
    }: {
      integrationId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from('store_integrations')
        .update({ is_active: isActive })
        .eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-integrations'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de l\'intégration a été mis à jour',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });

  const integrationTypes = [
    { value: 'zoom', label: 'Zoom', icon: Video, description: 'Video conferencing pour services en ligne' },
    { value: 'openai', label: 'OpenAI', icon: Brain, description: 'Génération de contenu IA' },
    { value: 'shipping_fedex', label: 'FedEx', icon: Truck, description: 'Livraison FedEx' },
    { value: 'shipping_dhl', label: 'DHL', icon: Truck, description: 'Livraison DHL' },
    { value: 'shipping_ups', label: 'UPS', icon: Truck, description: 'Livraison UPS' },
  ];

  const getIntegrationByType = (type: string) => {
    return integrations.find(i => i.integration_type === type);
  };

  if (storeLoading || isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6 space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96 w-full" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">
                    Aucune boutique trouvée. Veuillez créer une boutique pour configurer les intégrations.
                  </p>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Intégrations
              </h1>
              <p className="text-muted-foreground">
                Configurez vos intégrations tierces (Zoom, OpenAI, Shipping APIs)
              </p>
            </div>

            <Tabs defaultValue="zoom" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="zoom">
                  <Video className="h-4 w-4 mr-2" />
                  Video Conferencing
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Features
                </TabsTrigger>
                <TabsTrigger value="shipping">
                  <Truck className="h-4 w-4 mr-2" />
                  Shipping APIs
                </TabsTrigger>
              </TabsList>

              {/* Zoom Tab */}
              <TabsContent value="zoom" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Zoom Video Conferencing</CardTitle>
                        <CardDescription>
                          Configurez Zoom pour créer automatiquement des réunions pour vos services
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedIntegration(getIntegrationByType('zoom') || null);
                          setSelectedType('zoom');
                          setIsDialogOpen(true);
                        }}
                      >
                        {getIntegrationByType('zoom') ? (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Configurer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getIntegrationByType('zoom') ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Video className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{getIntegrationByType('zoom')?.display_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {getIntegrationByType('zoom')?.is_active ? 'Actif' : 'Inactif'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={getIntegrationByType('zoom')?.is_active}
                              onCheckedChange={(checked) => {
                                toggleIntegration.mutate({
                                  integrationId: getIntegrationByType('zoom')!.id,
                                  isActive: checked,
                                });
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteIntegration.mutate(getIntegrationByType('zoom')!.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune configuration Zoom. Cliquez sur "Configurer" pour commencer.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>AI Features</CardTitle>
                        <CardDescription>
                          Configurez OpenAI pour la génération de contenu intelligent
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedIntegration(getIntegrationByType('openai') || null);
                          setSelectedType('openai');
                          setIsDialogOpen(true);
                        }}
                      >
                        {getIntegrationByType('openai') ? (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Configurer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {getIntegrationByType('openai') ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Brain className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{getIntegrationByType('openai')?.display_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {getIntegrationByType('openai')?.is_active ? 'Actif' : 'Inactif'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={getIntegrationByType('openai')?.is_active}
                              onCheckedChange={(checked) => {
                                toggleIntegration.mutate({
                                  integrationId: getIntegrationByType('openai')!.id,
                                  isActive: checked,
                                });
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteIntegration.mutate(getIntegrationByType('openai')!.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune configuration OpenAI. Cliquez sur "Configurer" pour commencer.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shipping Tab */}
              <TabsContent value="shipping" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping APIs</CardTitle>
                    <CardDescription>
                      Configurez vos transporteurs (FedEx, DHL, UPS)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['shipping_fedex', 'shipping_dhl', 'shipping_ups'].map((type) => {
                        const integration = getIntegrationByType(type);
                        const typeLabel = type.replace('shipping_', '').toUpperCase();
                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Truck className="h-5 w-5 text-primary" />
                              <div>
                                <div className="font-medium">{integration?.display_name || typeLabel}</div>
                                <div className="text-sm text-muted-foreground">
                                  {integration ? (integration.is_active ? 'Actif' : 'Inactif') : 'Non configuré'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {integration && (
                                <Switch
                                  checked={integration.is_active}
                                  onCheckedChange={(checked) => {
                                    toggleIntegration.mutate({
                                      integrationId: integration.id,
                                      isActive: checked,
                                    });
                                  }}
                                />
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIntegration(integration || null);
                                  setSelectedType(type);
                                  setIsDialogOpen(true);
                                }}
                              >
                                {integration ? (
                                  <>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Configurer
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Configuration Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedIntegration ? 'Modifier l\'intégration' : 'Configurer l\'intégration'}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez les paramètres de l'intégration {selectedType}
                  </DialogDescription>
                </DialogHeader>
                <IntegrationConfigForm
                  integration={selectedIntegration}
                  integrationType={selectedType}
                  onSubmit={(data) => {
                    saveIntegration.mutate({
                      integration: data,
                      isNew: !selectedIntegration,
                    });
                  }}
                />
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// Integration Config Form Component
const IntegrationConfigForm = ({
  integration,
  integrationType,
  onSubmit,
}: {
  integration: StoreIntegration | null;
  integrationType: string;
  onSubmit: (data: Partial<StoreIntegration>) => void;
}) => {
  const [formData, setFormData] = useState<Partial<StoreIntegration>>({
    integration_type: integrationType,
    display_name: integration?.display_name || integrationType.replace('shipping_', '').toUpperCase(),
    config: integration?.config || {},
    is_active: integration?.is_active ?? true,
    is_enabled: integration?.is_enabled ?? true,
  });

  const getConfigFields = () => {
    switch (integrationType) {
      case 'zoom':
        return (
          <>
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.config?.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value },
                })}
                placeholder="Zoom API Key"
              />
            </div>
            <div>
              <Label>API Secret</Label>
              <Input
                type="password"
                value={formData.config?.api_secret || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_secret: e.target.value },
                })}
                placeholder="Zoom API Secret"
              />
            </div>
            <div>
              <Label>Account ID (optionnel)</Label>
              <Input
                value={formData.config?.account_id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, account_id: e.target.value },
                })}
                placeholder="Zoom Account ID (pour OAuth)"
              />
            </div>
          </>
        );
      case 'openai':
        return (
          <>
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.config?.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value },
                })}
                placeholder="OpenAI API Key"
              />
            </div>
            <div>
              <Label>Model (optionnel)</Label>
              <Input
                value={formData.config?.model || 'gpt-4-turbo-preview'}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, model: e.target.value },
                })}
                placeholder="gpt-4-turbo-preview"
              />
            </div>
          </>
        );
      case 'shipping_fedex':
      case 'shipping_dhl':
      case 'shipping_ups':
        return (
          <>
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.config?.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value },
                })}
                placeholder="Shipping API Key"
              />
            </div>
            <div>
              <Label>API Secret / Password</Label>
              <Input
                type="password"
                value={formData.config?.api_secret || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_secret: e.target.value },
                })}
                placeholder="Shipping API Secret"
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={formData.config?.account_number || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, account_number: e.target.value },
                })}
                placeholder="Account Number"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nom d'affichage</Label>
        <Input
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          placeholder="Nom de l'intégration"
        />
      </div>
      {getConfigFields()}
      <div className="flex items-center justify-between">
        <div>
          <Label>Activer l'intégration</Label>
          <p className="text-sm text-muted-foreground">
            Activez ou désactivez cette intégration
          </p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => {}}>
          Annuler
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {integration ? 'Modifier' : 'Créer'}
        </Button>
      </DialogFooter>
    </div>
  );
};


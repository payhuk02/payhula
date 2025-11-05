/**
 * WebhooksManager - Gestionnaire de webhooks pour produits physiques
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Webhook,
  Plus,
  Edit,
  Trash2,
  Play,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';
import {
  useStoreWebhooks,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookStats,
} from '@/hooks/physical/usePhysicalWebhooks';
import { WebhookForm } from './WebhookForm';
import { WebhookLogs } from './WebhookLogs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const WebhooksManager = () => {
  // Récupérer le store de l'utilisateur
  const { data: stores } = useQuery({
    queryKey: ['userStores'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('stores')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(1);

      return data || [];
    },
  });
  const storeId = stores?.[0]?.id;
  const { data: webhooks, isLoading, error } = useStoreWebhooks(storeId);
  const { data: stats } = useWebhookStats(storeId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<string | null>(null);

  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();

  const handleDelete = async (webhookId: string) => {
    await deleteWebhook.mutateAsync(webhookId);
    setDeletingWebhook(null);
  };

  const handleTest = async (webhookId: string) => {
    if (!storeId) return;
    await testWebhook.mutateAsync({ webhookId, storeId });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des webhooks. Veuillez réessayer plus tard.
        </AlertDescription>
      </Alert>
    );
  }

  if (!storeId) {
    return (
      <Alert>
        <AlertDescription>
          Aucun store trouvé. Veuillez créer un store d'abord.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_webhooks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_webhooks} actifs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Déclenchés</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_triggered}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_success} réussis
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_failures} échecs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_response_time_ms ? `${stats.avg_response_time_ms.toFixed(0)}ms` : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                Temps de réponse
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks Produits Physiques
              </CardTitle>
              <CardDescription>
                Configurez les webhooks pour recevoir des notifications sur les événements de vos produits physiques
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau webhook</DialogTitle>
                  <DialogDescription>
                    Configurez un webhook pour recevoir des notifications automatiques
                  </DialogDescription>
                </DialogHeader>
                <WebhookForm
                  storeId={storeId}
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!webhooks || webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun webhook</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre premier webhook pour recevoir des notifications automatiques
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un webhook
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Événement</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Déclenchements</TableHead>
                  <TableHead>Dernier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{webhook.event_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {webhook.target_url}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.is_active ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{webhook.trigger_count || 0}</div>
                        <div className="text-xs text-muted-foreground">
                          {webhook.success_count || 0} réussis, {webhook.failure_count || 0} échecs
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.last_triggered_at ? (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(webhook.last_triggered_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingWebhook(webhook.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setViewingLogs(webhook.id)}>
                            <Activity className="h-4 w-4 mr-2" />
                            Voir les logs
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTest(webhook.id)}
                            disabled={testWebhook.isPending}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Tester
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingWebhook(webhook.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingWebhook && (
        <Dialog open={!!editingWebhook} onOpenChange={() => setEditingWebhook(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Modifier le webhook</DialogTitle>
              <DialogDescription>
                Modifiez la configuration de votre webhook
              </DialogDescription>
            </DialogHeader>
            <WebhookForm
              webhookId={editingWebhook}
              storeId={storeId!}
              onSuccess={() => setEditingWebhook(null)}
              onCancel={() => setEditingWebhook(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Logs Dialog */}
      {viewingLogs && (
        <Dialog open={!!viewingLogs} onOpenChange={() => setViewingLogs(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Logs du webhook</DialogTitle>
              <DialogDescription>
                Historique des envois de webhooks
              </DialogDescription>
            </DialogHeader>
            <WebhookLogs webhookId={viewingLogs} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deletingWebhook && (
        <AlertDialog open={!!deletingWebhook} onOpenChange={() => setDeletingWebhook(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera définitivement le webhook.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingWebhook)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteWebhook.isPending ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

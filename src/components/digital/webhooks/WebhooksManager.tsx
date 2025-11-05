/**
 * WebhooksManager - Gestionnaire de webhooks pour produits digitaux
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
} from '@/hooks/digital/useWebhooks';
import { WebhookForm } from './WebhookForm';
import { WebhookLogs } from './WebhookLogs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const WebhooksManager = () => {
  const { data: webhooks, isLoading, error } = useStoreWebhooks();
  const { data: stats } = useWebhookStats();
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
    await testWebhook.mutateAsync(webhookId);
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

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Webhooks total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Actifs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_sent}</div>
              <div className="text-sm text-muted-foreground">Envoyés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {stats.success_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Taux de succès</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Configurez les webhooks pour intégrer avec Zapier, Make ou vos scripts
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau webhook</DialogTitle>
                  <DialogDescription>
                    Configurez un webhook pour recevoir des notifications d'événements
                  </DialogDescription>
                </DialogHeader>
                <WebhookForm
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
                Créez votre premier webhook pour intégrer avec des services externes
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
                  <TableHead>Nom</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Événements</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Statistiques</TableHead>
                  <TableHead>Dernière utilisation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {webhook.url.length > 40
                          ? `${webhook.url.substring(0, 40)}...`
                          : webhook.url}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 3).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.is_active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {webhook.total_succeeded} / {webhook.total_sent}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {webhook.total_sent > 0
                            ? ((webhook.total_succeeded / webhook.total_sent) * 100).toFixed(1)
                            : 0}
                          % succès
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.last_sent_at ? (
                        <div className="text-sm">
                          {format(new Date(webhook.last_sent_at), 'dd/MM/yyyy HH:mm', {
                            locale: fr,
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Jamais</span>
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
                          <DropdownMenuItem
                            onClick={() => setEditingWebhook(webhook.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTest(webhook.id)}
                            disabled={testWebhook.isPending}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Tester
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setViewingLogs(webhook.id)}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Voir les logs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingWebhook(webhook.id)}
                            className="text-red-600"
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

      {/* Dialog d'édition */}
      {editingWebhook && (
        <Dialog open={!!editingWebhook} onOpenChange={(open) => !open && setEditingWebhook(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le webhook</DialogTitle>
              <DialogDescription>
                Mettez à jour la configuration du webhook
              </DialogDescription>
            </DialogHeader>
            <WebhookForm
              webhookId={editingWebhook}
              onSuccess={() => setEditingWebhook(null)}
              onCancel={() => setEditingWebhook(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog des logs */}
      {viewingLogs && (
        <Dialog open={!!viewingLogs} onOpenChange={(open) => !open && setViewingLogs(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Logs du webhook</DialogTitle>
              <DialogDescription>
                Historique des webhooks envoyés
              </DialogDescription>
            </DialogHeader>
            <WebhookLogs webhookId={viewingLogs} />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingWebhook} onOpenChange={(open) => !open && setDeletingWebhook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce webhook ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingWebhook && handleDelete(deletingWebhook)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


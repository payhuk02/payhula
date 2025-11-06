/**
 * Composant pour les alertes d'expiration
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { useExpirationAlerts, useResolveExpirationAlert } from '@/hooks/physical/useLotsExpiration';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export function ExpirationAlerts() {
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: alerts, isLoading } = useExpirationAlerts({ resolved: false });
  const resolveAlert = useResolveExpirationAlert();

  const handleResolve = async (alertId: string) => {
    if (!resolutionAction) {
      alert('Veuillez sélectionner une action de résolution');
      return;
    }

    try {
      await resolveAlert.mutateAsync({
        alertId,
        resolutionAction: resolutionAction as any,
        resolutionNotes: resolutionNotes || undefined,
      });
      setResolvingAlert(null);
      setResolutionAction('');
      setResolutionNotes('');
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertTypeBadge = (type: string) => {
    switch (type) {
      case 'expiring_today':
        return <Badge variant="destructive">Expire aujourd'hui</Badge>;
      case 'expiring_soon':
        return <Badge variant="default" className="bg-orange-500">Expire bientôt</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const unresolvedAlerts = alerts?.filter((alert) => !alert.is_resolved) || [];

  if (unresolvedAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes d'Expiration
          </CardTitle>
          <CardDescription>
            Aucune alerte d'expiration en cours
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertes d'Expiration ({unresolvedAlerts.length})
        </CardTitle>
        <CardDescription>
          Produits expirés ou expirant bientôt nécessitant une action
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Date Expiration</TableHead>
              <TableHead>Jours Restants</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unresolvedAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium">{alert.lot.lot_number}</TableCell>
                <TableCell>
                  {/* Product name would come from a join */}
                  Produit #{alert.lot.physical_product_id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {alert.lot.expiration_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(alert.lot.expiration_date), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {alert.days_until_expiration !== undefined ? (
                    <span className={alert.days_until_expiration <= 0 ? 'text-red-500 font-bold' : ''}>
                      {alert.days_until_expiration} jours
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{getAlertTypeBadge(alert.alert_type)}</TableCell>
                <TableCell>{alert.lot.current_quantity}</TableCell>
                <TableCell className="text-right">
                  <Dialog open={resolvingAlert === alert.id} onOpenChange={(open) => {
                    if (!open) {
                      setResolvingAlert(null);
                      setResolutionAction('');
                      setResolutionNotes('');
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setResolvingAlert(alert.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Résoudre
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Résoudre l'Alerte</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Action de Résolution</Label>
                          <Select value={resolutionAction} onValueChange={setResolutionAction}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sold">Vendu</SelectItem>
                              <SelectItem value="discounted">Soldé</SelectItem>
                              <SelectItem value="returned">Retourné au fournisseur</SelectItem>
                              <SelectItem value="destroyed">Détruit</SelectItem>
                              <SelectItem value="transferred">Transféré</SelectItem>
                              <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            placeholder="Notes sur la résolution..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setResolvingAlert(null);
                              setResolutionAction('');
                              setResolutionNotes('');
                            }}
                          >
                            Annuler
                          </Button>
                          <Button onClick={() => handleResolve(alert.id)}>
                            Confirmer
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}




/**
 * Stock Alerts Component
 * Date: 2025-01-28
 * 
 * Component for displaying and managing stock alerts
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Package, X } from 'lucide-react';
import { useStockAlerts, useResolveStockAlert } from '@/hooks/physical/useAdvancedInventory';
import { useStore } from '@/hooks/use-store';
import { StockAlert } from '@/hooks/physical/useAdvancedInventory';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const StockAlerts: React.FC = () => {
  const { store } = useStore();
  const { data: alerts = [], isLoading } = useStockAlerts(store?.id, false);
  const { data: unresolvedAlerts = [] } = useStockAlerts(store?.id, false);
  const resolveMutation = useResolveStockAlert();

  const [selectedAlert, setSelectedAlert] = React.useState<StockAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = React.useState('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return 'Rupture de stock';
      case 'low_stock':
        return 'Stock faible';
      case 'overstock':
        return 'Surstock';
      case 'reorder':
        return 'Réapprovisionnement';
      default:
        return type;
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    await resolveMutation.mutateAsync({
      id: selectedAlert.id,
      resolution_notes: resolutionNotes,
    });
    setSelectedAlert(null);
    setResolutionNotes('');
  };

  const unresolvedCount = unresolvedAlerts.filter((a) => !a.is_resolved).length;

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alertes de stock</CardTitle>
              <CardDescription>
                Surveillez les niveaux de stock et les alertes de réapprovisionnement
              </CardDescription>
            </div>
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                {unresolvedCount} non résolues
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Aucune alerte de stock pour le moment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Entrepôt</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {getAlertTypeLabel(alert.alert_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.warehouse_inventory?.inventory_item?.sku || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {alert.warehouse_inventory?.warehouse?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.current_quantity}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">
                          {alert.threshold_quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getSeverityColor(alert.severity)} text-white`}
                        variant="default"
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(alert.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {alert.is_resolved ? (
                        <Badge variant="outline" className="text-green-600">
                          Résolu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Résoudre
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre l'alerte</DialogTitle>
            <DialogDescription>
              Ajoutez des notes sur la résolution de cette alerte de stock.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {getAlertTypeLabel(selectedAlert.alert_type)}
                  </div>
                  <div>
                    <span className="font-medium">Produit:</span>{' '}
                    {selectedAlert.warehouse_inventory?.inventory_item?.sku || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Entrepôt:</span>{' '}
                    {selectedAlert.warehouse_inventory?.warehouse?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Quantité actuelle:</span>{' '}
                    {selectedAlert.current_quantity}
                  </div>
                  <div>
                    <span className="font-medium">Seuil:</span>{' '}
                    {selectedAlert.threshold_quantity}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes de résolution</Label>
                <Textarea
                  id="notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ex: Stock réapprovisionné, commande passée au fournisseur..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAlert(null);
                setResolutionNotes('');
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleResolve} disabled={resolveMutation.isPending}>
              Résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};




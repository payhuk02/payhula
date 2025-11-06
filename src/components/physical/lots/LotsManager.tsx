/**
 * Gestionnaire de lots de produits
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Warehouse,
  RefreshCw,
} from 'lucide-react';
import { useProductLots, useDeleteLot } from '@/hooks/physical/useLotsExpiration';
import { LotForm } from './LotForm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LotsManagerProps {
  physicalProductId: string;
  variantId?: string;
  warehouseId?: string;
}

export function LotsManager({ physicalProductId, variantId, warehouseId }: LotsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<string | null>(null);

  const { data: lots, isLoading } = useProductLots(physicalProductId, {
    variantId,
    warehouseId,
  });

  const deleteLot = useDeleteLot();

  const getStatusBadge = (status: string, expirationDate?: string) => {
    if (status === 'expired') {
      return <Badge variant="destructive">Expiré</Badge>;
    }
    if (status === 'expiring_soon') {
      return <Badge variant="default" className="bg-orange-500">Expire bientôt</Badge>;
    }
    if (status === 'active') {
      if (expirationDate) {
        const daysUntilExpiration = Math.ceil(
          (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiration <= 7) {
          return <Badge variant="default" className="bg-yellow-500">Expire dans {daysUntilExpiration}j</Badge>;
        }
      }
      return <Badge variant="default" className="bg-green-500">Actif</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getRotationMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      FIFO: 'Premier entré, premier sorti',
      LIFO: 'Dernier entré, premier sorti',
      FEFO: 'Premier expiré, premier sorti',
      manual: 'Manuel',
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const activeLots = lots?.filter((lot) => lot.status === 'active') || [];
  const expiredLots = lots?.filter((lot) => lot.status === 'expired') || [];
  const expiringSoonLots = lots?.filter((lot) => lot.status === 'expiring_soon') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Gestion des Lots</h3>
          <p className="text-muted-foreground">
            Gérez les lots de produits avec dates d'expiration et rotation FIFO/LIFO/FEFO
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Lot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Lot</DialogTitle>
            </DialogHeader>
            <LotForm
              physicalProductId={physicalProductId}
              variantId={variantId}
              warehouseId={warehouseId}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Tous ({lots?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="active">
            Actifs ({activeLots.length})
          </TabsTrigger>
          <TabsTrigger value="expiring">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Expirent bientôt ({expiringSoonLots.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expirés ({expiredLots.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <LotsTable
            lots={lots || []}
            onEdit={setEditingLot}
            onDelete={(lotId) => {
              if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                deleteLot.mutate(lotId);
              }
            }}
            getStatusBadge={getStatusBadge}
            getRotationMethodLabel={getRotationMethodLabel}
          />
        </TabsContent>

        <TabsContent value="active">
          <LotsTable
            lots={activeLots}
            onEdit={setEditingLot}
            onDelete={(lotId) => {
              if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                deleteLot.mutate(lotId);
              }
            }}
            getStatusBadge={getStatusBadge}
            getRotationMethodLabel={getRotationMethodLabel}
          />
        </TabsContent>

        <TabsContent value="expiring">
          <LotsTable
            lots={expiringSoonLots}
            onEdit={setEditingLot}
            onDelete={(lotId) => {
              if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                deleteLot.mutate(lotId);
              }
            }}
            getStatusBadge={getStatusBadge}
            getRotationMethodLabel={getRotationMethodLabel}
          />
        </TabsContent>

        <TabsContent value="expired">
          <LotsTable
            lots={expiredLots}
            onEdit={setEditingLot}
            onDelete={(lotId) => {
              if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
                deleteLot.mutate(lotId);
              }
            }}
            getStatusBadge={getStatusBadge}
            getRotationMethodLabel={getRotationMethodLabel}
          />
        </TabsContent>
      </Tabs>

      {editingLot && (
        <Dialog open={!!editingLot} onOpenChange={() => setEditingLot(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le Lot</DialogTitle>
            </DialogHeader>
            <LotForm
              lotId={editingLot}
              physicalProductId={physicalProductId}
              variantId={variantId}
              warehouseId={warehouseId}
              onSuccess={() => setEditingLot(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function LotsTable({
  lots,
  onEdit,
  onDelete,
  getStatusBadge,
  getRotationMethodLabel,
}: {
  lots: any[];
  onEdit: (lotId: string) => void;
  onDelete: (lotId: string) => void;
  getStatusBadge: (status: string, expirationDate?: string) => JSX.Element;
  getRotationMethodLabel: (method: string) => string;
}) {
  if (lots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun lot trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro de Lot</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Date Réception</TableHead>
              <TableHead>Date Expiration</TableHead>
              <TableHead>Rotation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell className="font-medium">{lot.lot_number}</TableCell>
                <TableCell>
                  {lot.current_quantity - lot.reserved_quantity} / {lot.initial_quantity}
                  {lot.reserved_quantity > 0 && (
                    <span className="text-muted-foreground text-sm ml-2">
                      ({lot.reserved_quantity} réservé)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {lot.received_date
                    ? format(new Date(lot.received_date), 'dd MMM yyyy', { locale: fr })
                    : '-'}
                </TableCell>
                <TableCell>
                  {lot.expiration_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(lot.expiration_date), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{getRotationMethodLabel(lot.rotation_method)}</TableCell>
                <TableCell>{getStatusBadge(lot.status, lot.expiration_date)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(lot.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(lot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}




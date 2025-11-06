/**
 * Gestionnaire de numéros de série
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Hash,
  Plus,
  Edit,
  Search,
  RefreshCw,
  Package,
  AlertCircle,
} from 'lucide-react';
import {
  useProductSerialNumbers,
  useSerialNumberByNumber,
} from '@/hooks/physical/useSerialTracking';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SerialNumberForm } from './SerialNumberForm';
import { SerialTraceabilityView } from './SerialTraceabilityView';

interface SerialNumbersManagerProps {
  physicalProductId: string;
  variantId?: string;
}

export function SerialNumbersManager({ physicalProductId, variantId }: SerialNumbersManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSerial, setEditingSerial] = useState<string | null>(null);
  const [viewingTraceability, setViewingTraceability] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: serials, isLoading } = useProductSerialNumbers(physicalProductId, {
    variantId,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  });

  const deleteSerial = useDeleteSerialNumber();

  const filteredSerials = serials?.filter((serial) =>
    serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    serial.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    serial.mac_address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      manufactured: { label: 'Fabriqué', variant: 'secondary' },
      in_stock: { label: 'En Stock', variant: 'default', className: 'bg-green-500' },
      reserved: { label: 'Réservé', variant: 'default', className: 'bg-yellow-500' },
      sold: { label: 'Vendu', variant: 'default', className: 'bg-blue-500' },
      shipped: { label: 'Expédié', variant: 'default', className: 'bg-purple-500' },
      delivered: { label: 'Livré', variant: 'default', className: 'bg-indigo-500' },
      returned: { label: 'Retourné', variant: 'secondary' },
      refurbished: { label: 'Reconditionné', variant: 'secondary' },
      warranty_repair: { label: 'Réparation Garantie', variant: 'default', className: 'bg-orange-500' },
      damaged: { label: 'Endommagé', variant: 'destructive' },
      scrapped: { label: 'Mis au Rebut', variant: 'destructive' },
    };

    const badge = badges[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    );
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

  const statusCounts = serials?.reduce((acc, serial) => {
    acc[serial.status] = (acc[serial.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold">Gestion des Numéros de Série</h3>
          <p className="text-muted-foreground">
            Gérez les numéros de série et suivez la traçabilité complète
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter Numéro de Série
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un Numéro de Série</DialogTitle>
            </DialogHeader>
            <SerialNumberForm
              physicalProductId={physicalProductId}
              variantId={variantId}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro de série, IMEI, MAC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les statuts</option>
              <option value="in_stock">En Stock</option>
              <option value="sold">Vendu</option>
              <option value="shipped">Expédié</option>
              <option value="delivered">Livré</option>
              <option value="warranty_repair">Réparation Garantie</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">En Stock</div>
            <div className="text-2xl font-bold">{statusCounts.in_stock || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Vendu</div>
            <div className="text-2xl font-bold">{statusCounts.sold || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">En Réparation</div>
            <div className="text-2xl font-bold">{statusCounts.warranty_repair || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{serials?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Serial Numbers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Numéros de Série</CardTitle>
          <CardDescription>
            Liste de tous les numéros de série pour ce produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSerials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Hash className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun numéro de série trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de Série</TableHead>
                  <TableHead>IMEI / MAC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Garantie</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerials.map((serial) => (
                  <TableRow key={serial.id}>
                    <TableCell className="font-medium font-mono">{serial.serial_number}</TableCell>
                    <TableCell>
                      {serial.imei && <div className="text-sm">IMEI: {serial.imei}</div>}
                      {serial.mac_address && <div className="text-sm">MAC: {serial.mac_address}</div>}
                    </TableCell>
                    <TableCell>{getStatusBadge(serial.status)}</TableCell>
                    <TableCell>
                      {serial.customer_id ? (
                        <span className="text-sm">Client #{serial.customer_id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {serial.warranty_end_date ? (
                        <div className="text-sm">
                          Jusqu'au {new Date(serial.warranty_end_date).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTraceability(serial.id)}
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSerial(serial.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSerial && (
        <Dialog open={!!editingSerial} onOpenChange={() => setEditingSerial(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le Numéro de Série</DialogTitle>
            </DialogHeader>
            <SerialNumberForm
              serialNumberId={editingSerial}
              physicalProductId={physicalProductId}
              variantId={variantId}
              onSuccess={() => setEditingSerial(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Traceability Dialog */}
      {viewingTraceability && (
        <Dialog open={!!viewingTraceability} onOpenChange={() => setViewingTraceability(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Traçabilité Complète</DialogTitle>
            </DialogHeader>
            <SerialTraceabilityView serialNumberId={viewingTraceability} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Delete mutation hook
function useDeleteSerialNumber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumberId: string) => {
      const { error } = await supabase
        .from('serial_numbers')
        .delete()
        .eq('id', serialNumberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-serial-numbers'] });
    },
  });
}


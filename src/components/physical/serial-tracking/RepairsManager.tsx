/**
 * Gestionnaire de réparations
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRepairs } from '@/hooks/physical/useSerialTracking';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Wrench, Eye } from 'lucide-react';

interface RepairsManagerProps {
  storeId: string;
}

export function RepairsManager({ storeId }: RepairsManagerProps) {
  const { data: repairs, isLoading } = useRepairs();

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      received: { label: 'Reçu', variant: 'secondary' },
      diagnosed: { label: 'Diagnostiqué', variant: 'default', className: 'bg-blue-500' },
      in_progress: { label: 'En Cours', variant: 'default', className: 'bg-yellow-500' },
      waiting_parts: { label: 'En Attente Pièces', variant: 'default', className: 'bg-orange-500' },
      completed: { label: 'Terminée', variant: 'default', className: 'bg-green-500' },
      returned: { label: 'Retourné', variant: 'default', className: 'bg-purple-500' },
      cancelled: { label: 'Annulée', variant: 'secondary' },
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
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Réparations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!repairs || repairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune réparation</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro Réparation</TableHead>
                <TableHead>Date Réception</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Problème</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Coût Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairs.map((repair) => (
                <TableRow key={repair.id}>
                  <TableCell className="font-medium font-mono">{repair.repair_number}</TableCell>
                  <TableCell>
                    {format(new Date(repair.received_date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {repair.repair_type === 'warranty' ? 'Garantie' : 
                     repair.repair_type === 'out_of_warranty' ? 'Hors Garantie' : 
                     'Payé par Client'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{repair.issue_description}</TableCell>
                  <TableCell>{getStatusBadge(repair.status)}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0,
                    }).format(repair.total_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}



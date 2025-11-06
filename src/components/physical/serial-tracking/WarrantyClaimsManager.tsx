/**
 * Gestionnaire de réclamations garantie
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWarrantyClaims } from '@/hooks/physical/useSerialTracking';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Eye } from 'lucide-react';

interface WarrantyClaimsManagerProps {
  storeId: string;
}

export function WarrantyClaimsManager({ storeId }: WarrantyClaimsManagerProps) {
  const { data: claims, isLoading } = useWarrantyClaims();

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      pending: { label: 'En Attente', variant: 'secondary' },
      under_review: { label: 'En Examen', variant: 'default', className: 'bg-yellow-500' },
      approved: { label: 'Approuvée', variant: 'default', className: 'bg-green-500' },
      rejected: { label: 'Rejetée', variant: 'destructive' },
      repair_in_progress: { label: 'Réparation en Cours', variant: 'default', className: 'bg-blue-500' },
      repaired: { label: 'Réparée', variant: 'default', className: 'bg-green-500' },
      replacement_sent: { label: 'Remplacement Envoyé', variant: 'default', className: 'bg-purple-500' },
      refunded: { label: 'Remboursée', variant: 'default', className: 'bg-indigo-500' },
      resolved: { label: 'Résolue', variant: 'default', className: 'bg-green-500' },
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
          <AlertTriangle className="h-5 w-5" />
          Réclamations Garantie
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!claims || claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune réclamation garantie</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro Réclamation</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Problème</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium font-mono">{claim.claim_number}</TableCell>
                  <TableCell>
                    {format(new Date(claim.claim_date), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{claim.issue_description}</TableCell>
                  <TableCell>{getStatusBadge(claim.status)}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0,
                    }).format(claim.total_cost)}
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




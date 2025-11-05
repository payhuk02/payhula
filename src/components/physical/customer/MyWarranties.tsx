/**
 * MyWarranties - Gestion des garanties produits physiques (client)
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export const MyWarranties = () => {
  const navigate = useNavigate();

  const { data: warranties, isLoading, error } = useQuery({
    queryKey: ['customerWarranties'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer les garanties enregistrées
      const { data, error: warrantiesError } = await supabase
        .from('warranty_registrations')
        .select(`
          *,
          warranty:product_warranties (
            id,
            warranty_type,
            duration_months,
            coverage_details
          ),
          product:products (
            id,
            name,
            image_url
          ),
          order:orders (
            id,
            order_number
          )
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      if (warrantiesError) throw warrantiesError;

      return data || [];
    },
  });

  const getStatusBadge = (isExpired: boolean, expiryDate?: string) => {
    if (isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expirée
        </Badge>
      );
    }

    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 30) {
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-500">
            <AlertTriangle className="h-3 w-3" />
            Expire bientôt
          </Badge>
        );
      }
    }

    return (
      <Badge variant="default" className="gap-1 bg-green-500">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
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
        <AlertDescription>
          Erreur lors du chargement de vos garanties. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Mes Garanties
        </CardTitle>
        <CardDescription>
          Gérez vos garanties produits physiques
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!warranties || warranties.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune garantie</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas encore enregistré de garantie
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date d'expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warranties.map((warranty: any) => (
                <TableRow key={warranty.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {warranty.product?.image_url && (
                        <img
                          src={warranty.product.image_url}
                          alt={warranty.product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="text-sm font-medium">
                        {warranty.product?.name || 'Produit'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      #{warranty.order?.order_number || warranty.order_id?.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {warranty.warranty?.warranty_type || 'Standard'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {warranty.expiry_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(warranty.expiry_date), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(warranty.is_expired || false, warranty.expiry_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/warranties/${warranty.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
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
};


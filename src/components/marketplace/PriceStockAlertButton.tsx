import { useState, useEffect } from 'react';
import { Bell, BellOff, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreatePriceAlert, useCreateStockAlert, useDeletePriceAlert, useDeleteStockAlert, useHasPriceAlert, useHasStockAlert } from '@/hooks/usePriceStockAlerts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PriceStockAlertButtonProps {
  productId: string;
  productName: string;
  currentPrice: number;
  currency: string;
  productType?: string | null;
  stockQuantity?: number | null;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PriceStockAlertButton({
  productId,
  productName,
  currentPrice,
  currency,
  productType,
  stockQuantity,
  className = '',
  variant = 'outline',
  size = 'sm',
}: PriceStockAlertButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const { toast } = useToast();

  // Récupérer l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  // Vérifier si les alertes existent
  const { data: hasPriceAlert, refetch: refetchPriceAlert } = useHasPriceAlert(userId, productId);
  const { data: hasStockAlert, refetch: refetchStockAlert } = useHasStockAlert(userId, productId);

  // Mutations
  const createPriceAlert = useCreatePriceAlert();
  const createStockAlert = useCreateStockAlert();
  const deletePriceAlert = useDeletePriceAlert();
  const deleteStockAlert = useDeleteStockAlert();

  const handleCreatePriceAlert = async () => {
    if (!userId) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour créer une alerte',
        variant: 'destructive',
      });
      return;
    }

    const target = parseFloat(targetPrice);
    if (isNaN(target) || target <= 0) {
      toast({
        title: 'Prix invalide',
        description: 'Veuillez entrer un prix valide',
        variant: 'destructive',
      });
      return;
    }

    if (target >= currentPrice) {
      toast({
        title: 'Prix trop élevé',
        description: 'Le prix cible doit être inférieur au prix actuel',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createPriceAlert.mutateAsync({
        userId,
        productId,
        targetPrice: target,
      });
      setPriceDialogOpen(false);
      setTargetPrice('');
      refetchPriceAlert();
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleDeletePriceAlert = async () => {
    if (!userId) return;

    try {
      // Récupérer l'ID de l'alerte
      const { data: alert } = await supabase
        .from('price_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (alert) {
        await deletePriceAlert.mutateAsync({
          alertId: alert.id,
          userId,
        });
        refetchPriceAlert();
      }
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleCreateStockAlert = async () => {
    if (!userId) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour créer une alerte',
        variant: 'destructive',
      });
      return;
    }

    if (productType !== 'physical') {
      toast({
        title: 'Produit non physique',
        description: 'Les alertes de stock sont uniquement disponibles pour les produits physiques',
        variant: 'destructive',
      });
      return;
    }

    if (stockQuantity !== null && stockQuantity > 0) {
      toast({
        title: 'Produit en stock',
        description: 'Le produit est actuellement en stock',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createStockAlert.mutateAsync({
        userId,
        productId,
      });
      setStockDialogOpen(false);
      refetchStockAlert();
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleDeleteStockAlert = async () => {
    if (!userId) return;

    try {
      // Récupérer l'ID de l'alerte
      const { data: alert } = await supabase
        .from('stock_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (alert) {
        await deleteStockAlert.mutateAsync({
          alertId: alert.id,
          userId,
        });
        refetchStockAlert();
      }
    } catch (error) {
      // Error already handled in mutation
    }
  };

  // Gérer le clic si l'utilisateur n'est pas connecté
  const handlePriceAlertClick = () => {
    if (!userId) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour créer une alerte',
        variant: 'destructive',
      });
      return;
    }
    setPriceDialogOpen(true);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Bouton Alerte Prix */}
      {hasPriceAlert ? (
        <Button
          variant={variant}
          size={size}
          onClick={handleDeletePriceAlert}
          disabled={deletePriceAlert.isPending || !userId}
          className="w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base border-2"
        >
          {deletePriceAlert.isPending ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
          ) : (
            <BellOff className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          )}
          <span className="hidden sm:inline">Retirer alerte</span>
          <span className="sm:hidden">Retirer</span>
        </Button>
      ) : (
        <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className="w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base border-2"
              onClick={(e) => {
                if (!userId) {
                  e.preventDefault();
                  handlePriceAlertClick();
                }
              }}
            >
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Alerte prix</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alerte de prix</DialogTitle>
              <DialogDescription>
                Recevez une notification lorsque le prix de "{productName}" atteint votre objectif
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="current-price">Prix actuel</Label>
                <div className="text-2xl font-bold text-primary mt-1">
                  {currentPrice.toLocaleString('fr-FR')} {currency}
                </div>
              </div>
              <div>
                <Label htmlFor="target-price">Prix cible</Label>
                <Input
                  id="target-price"
                  type="number"
                  placeholder="Ex: 5000"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  min={0}
                  max={currentPrice}
                  step="1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Vous serez notifié lorsque le prix sera inférieur ou égal à ce montant
                </p>
              </div>
              <Button
                onClick={handleCreatePriceAlert}
                disabled={createPriceAlert.isPending || !targetPrice}
                className="w-full"
              >
                {createPriceAlert.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  'Créer l\'alerte'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bouton Alerte Stock (uniquement pour produits physiques) */}
      {productType === 'physical' && (
        hasStockAlert ? (
          <Button
            variant={variant}
            size={size}
            onClick={handleDeleteStockAlert}
            disabled={deleteStockAlert.isPending}
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base border-2"
          >
            {deleteStockAlert.isPending ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
            ) : (
              <BellOff className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            )}
            <span className="hidden sm:inline">Retirer alerte stock</span>
            <span className="sm:hidden">Retirer stock</span>
          </Button>
        ) : (
          <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={variant}
                size={size}
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base border-2"
                disabled={stockQuantity !== null && stockQuantity > 0}
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="hidden sm:inline">Alerte stock</span>
                <span className="sm:hidden">Stock</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alerte de stock</DialogTitle>
                <DialogDescription>
                  Recevez une notification lorsque "{productName}" sera de nouveau en stock
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Vous serez notifié par email lorsque ce produit sera de nouveau disponible.
                  </p>
                </div>
                <Button
                  onClick={handleCreateStockAlert}
                  disabled={createStockAlert.isPending || (stockQuantity !== null && stockQuantity > 0)}
                  className="w-full"
                >
                  {createStockAlert.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    'Créer l\'alerte'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )
      )}
    </div>
  );
}


/**
 * Promotions Manager Component
 * Date: 2025-01-28
 * 
 * Component for managing product promotions
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MoreVertical, Edit, Trash2, Tag, Calendar, Users } from 'lucide-react';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  ProductPromotion,
} from '@/hooks/physical/usePromotions';
import { useStore } from '@/hooks/use-store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PromotionsManager: React.FC = () => {
  const { store } = useStore();
  const { data: promotions = [], isLoading } = usePromotions(store?.id);
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<ProductPromotion | null>(null);
  const [deletePromotionId, setDeletePromotionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    discount_type: 'percentage' as const,
    discount_value: 0,
    applies_to: 'all_products' as const,
    product_ids: [] as string[],
    category_ids: [] as string[],
    collection_ids: [] as string[],
    applies_to_variants: true,
    variant_ids: [] as string[],
    min_purchase_amount: undefined as number | undefined,
    min_quantity: undefined as number | undefined,
    max_uses: undefined as number | undefined,
    max_uses_per_customer: undefined as number | undefined,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: undefined as string | undefined,
    is_active: true,
    is_automatic: false,
  });

  const handleOpenDialog = (promotion?: ProductPromotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        code: promotion.code || '',
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        applies_to: promotion.applies_to,
        product_ids: promotion.product_ids || [],
        category_ids: promotion.category_ids || [],
        collection_ids: promotion.collection_ids || [],
        applies_to_variants: promotion.applies_to_variants,
        variant_ids: promotion.variant_ids || [],
        min_purchase_amount: promotion.min_purchase_amount,
        min_quantity: promotion.min_quantity,
        max_uses: promotion.max_uses,
        max_uses_per_customer: promotion.max_uses_per_customer,
        starts_at: promotion.starts_at.slice(0, 16),
        ends_at: promotion.ends_at ? promotion.ends_at.slice(0, 16) : undefined,
        is_active: promotion.is_active,
        is_automatic: promotion.is_automatic,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: '',
        description: '',
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        applies_to: 'all_products',
        product_ids: [],
        category_ids: [],
        collection_ids: [],
        applies_to_variants: true,
        variant_ids: [],
        min_purchase_amount: undefined,
        min_quantity: undefined,
        max_uses: undefined,
        max_uses_per_customer: undefined,
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: undefined,
        is_active: true,
        is_automatic: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    const promotionData = {
      ...formData,
      store_id: store.id,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : undefined,
    };

    if (editingPromotion) {
      await updateMutation.mutateAsync({
        id: editingPromotion.id,
        ...promotionData,
      });
    } else {
      await createMutation.mutateAsync(promotionData);
    }

    setIsDialogOpen(false);
    setEditingPromotion(null);
  };

  const handleDelete = async () => {
    if (!deletePromotionId) return;
    await deleteMutation.mutateAsync(deletePromotionId);
    setDeletePromotionId(null);
  };

  const isActive = (promotion: ProductPromotion) => {
    const now = new Date();
    return (
      promotion.is_active &&
      new Date(promotion.starts_at) <= now &&
      (!promotion.ends_at || new Date(promotion.ends_at) >= now)
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Promotions</CardTitle>
            <CardDescription>
              Gérez vos promotions et codes de réduction
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une promotion
          </Button>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune promotion configurée. Créez votre première promotion pour commencer.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Portée</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Utilisations</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell className="font-medium">{promotion.name}</TableCell>
                    <TableCell>
                      {promotion.code ? (
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {promotion.code}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {promotion.discount_type === 'percentage' && '%'}
                        {promotion.discount_type === 'fixed_amount' && 'Montant fixe'}
                        {promotion.discount_type === 'free_shipping' && 'Livraison gratuite'}
                        {promotion.discount_type === 'buy_x_get_y' && 'Acheter X obtenir Y'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promotion.discount_type === 'percentage'
                        ? `${promotion.discount_value}%`
                        : `${promotion.discount_value} XOF`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {promotion.applies_to === 'all_products' && 'Tous les produits'}
                        {promotion.applies_to === 'specific_products' && 'Produits spécifiques'}
                        {promotion.applies_to === 'categories' && 'Catégories'}
                        {promotion.applies_to === 'collections' && 'Collections'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(promotion.starts_at), 'dd MMM yyyy', { locale: fr })}
                          {promotion.ends_at &&
                            ` - ${format(new Date(promotion.ends_at), 'dd MMM yyyy', { locale: fr })}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {promotion.current_uses}
                          {promotion.max_uses && ` / ${promotion.max_uses}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isActive(promotion) ? (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(promotion)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletePromotionId(promotion.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
            </DialogTitle>
            <DialogDescription>
              Configurez votre promotion ou code de réduction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code promotionnel (optionnel)</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="EXEMPLE2025"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Type de réduction *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed_amount">Montant fixe</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                    <SelectItem value="buy_x_get_y">Acheter X obtenir Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">Valeur *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
                {formData.discount_type === 'percentage' && (
                  <p className="text-xs text-muted-foreground">En pourcentage (ex: 10 pour 10%)</p>
                )}
                {formData.discount_type === 'fixed_amount' && (
                  <p className="text-xs text-muted-foreground">En XOF</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applies_to">S'applique à *</Label>
              <Select
                value={formData.applies_to}
                onValueChange={(value: any) => setFormData({ ...formData, applies_to: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_products">Tous les produits</SelectItem>
                  <SelectItem value="specific_products">Produits spécifiques</SelectItem>
                  <SelectItem value="categories">Catégories</SelectItem>
                  <SelectItem value="collections">Collections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Date de début *</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Date de fin (optionnel)</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, ends_at: e.target.value || undefined })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite d'utilisations (optionnel)</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_uses: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses_per_customer">Par client (optionnel)</Label>
                <Input
                  id="max_uses_per_customer"
                  type="number"
                  min="1"
                  value={formData.max_uses_per_customer || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_uses_per_customer: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount">Montant minimum (optionnel)</Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase_amount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_purchase_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="is_automatic"
                  checked={formData.is_automatic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_automatic: checked as boolean })
                  }
                />
                <Label htmlFor="is_automatic" className="cursor-pointer">
                  Application automatique
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Actif
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPromotion ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletePromotionId}
        onOpenChange={(open) => !open && setDeletePromotionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};




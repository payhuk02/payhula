/**
 * Composant amélioré de gestion des bundles de produits physiques
 * Date: 28 Janvier 2025
 * Avec gestion inventaire, promotions automatiques, prix dynamiques
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ShoppingBag,
  TrendingDown,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  PackageSearch,
  Percent,
} from 'lucide-react';
import {
  useBundles,
  useBundle,
  useCreateBundle,
  useUpdateBundle,
  useCheckBundleAvailability,
  useApplyBundlePromotion,
  Bundle,
  BundleType,
} from '@/hooks/physical/useBundles';
import { useStore } from '@/hooks/useStore';
import { usePhysicalProducts } from '@/hooks/physical/usePhysicalProducts';
import { useToast } from '@/hooks/use-toast';

export function BundlesManager() {
  const { store } = useStore();
  const { toast } = useToast();
  const { data: bundles, isLoading } = useBundles(store?.id || null, { is_active: true });
  const { data: products } = usePhysicalProducts(store?.id || null);
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const checkAvailability = useCheckBundleAvailability();
  const applyPromotion = useApplyBundlePromotion();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [bundleForm, setBundleForm] = useState({
    name: '',
    description: '',
    type: 'fixed' as BundleType,
    bundle_price: 0,
    track_inventory: false,
    total_quantity: 0,
    is_active: true,
    show_savings: true,
    show_individual_prices: false,
    items: [] as Array<{
      product_id: string;
      variant_id?: string;
      quantity: number;
      price: number;
      is_required: boolean;
    }>,
  });
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [promotionType, setPromotionType] = useState<'percentage' | 'amount'>('percentage');

  // Calculer le prix original et les économies
  const bundleCalculations = useMemo(() => {
    const originalPrice = bundleForm.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountAmount = originalPrice - bundleForm.bundle_price;
    const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

    return {
      originalPrice,
      discountAmount,
      discountPercentage,
    };
  }, [bundleForm.items, bundleForm.bundle_price]);

  const handleCreateBundle = async () => {
    if (!store?.id || bundleForm.items.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un produit au bundle',
        variant: 'destructive',
      });
      return;
    }

    await createBundle.mutateAsync({
      store_id: store.id,
      ...bundleForm,
    });

    setShowCreateDialog(false);
    resetForm();
  };

  const handleApplyPromotion = async () => {
    if (!selectedBundle) return;

    await applyPromotion.mutateAsync({
      bundleId: selectedBundle.id,
      discountPercentage: promotionType === 'percentage' ? promotionDiscount : undefined,
      discountAmount: promotionType === 'amount' ? promotionDiscount : undefined,
    });

    setShowPromotionDialog(false);
    setPromotionDiscount(0);
    setSelectedBundle(null);
  };

  const resetForm = () => {
    setBundleForm({
      name: '',
      description: '',
      type: 'fixed',
      bundle_price: 0,
      track_inventory: false,
      total_quantity: 0,
      is_active: true,
      show_savings: true,
      show_individual_prices: false,
      items: [],
    });
  };

  const addProductToBundle = (productId: string, variantId?: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = bundleForm.items.find(
      (item) => item.product_id === productId && item.variant_id === variantId
    );

    if (existingItem) {
      setBundleForm({
        ...bundleForm,
        items: bundleForm.items.map((item) =>
          item.product_id === productId && item.variant_id === variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      setBundleForm({
        ...bundleForm,
        items: [
          ...bundleForm.items,
          {
            product_id: productId,
            variant_id: variantId,
            quantity: 1,
            price: product.price || 0,
            is_required: true,
          },
        ],
      });
    }

    // Recalculer le prix du bundle automatiquement
    const newOriginalPrice = bundleForm.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) + (product.price || 0);
    const suggestedDiscount = newOriginalPrice * 0.1; // 10% de réduction par défaut
    setBundleForm({
      ...bundleForm,
      bundle_price: newOriginalPrice - suggestedDiscount,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Gestion des Bundles
              </CardTitle>
              <CardDescription>
                Créez et gérez des bundles de produits avec promotions automatiques
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Bundle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!bundles || bundles.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun bundle créé. Créez votre premier bundle pour commencer.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prix Original</TableHead>
                  <TableHead>Prix Bundle</TableHead>
                  <TableHead>Économies</TableHead>
                  <TableHead>Inventaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell className="font-medium">{bundle.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{bundle.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="line-through text-muted-foreground">
                        {bundle.original_price.toLocaleString()} FCFA
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {bundle.bundle_price.toLocaleString()} FCFA
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -{bundle.discount_percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bundle.track_inventory ? (
                        <span>{bundle.total_quantity || 0} unités</span>
                      ) : (
                        <span className="text-muted-foreground">Illimité</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bundle.is_active ? (
                        <Badge variant="default">Actif</Badge>
                      ) : (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBundle(bundle);
                            setShowPromotionDialog(true);
                          }}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          Promotion
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBundle(bundle);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
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

      {/* Dialog Création Bundle */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un Bundle</DialogTitle>
            <DialogDescription>
              Créez un bundle de produits avec prix dynamiques et promotions
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList>
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="pricing">Prix</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du Bundle</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  placeholder="Ex: Pack Starter"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  placeholder="Description du bundle..."
                />
              </div>
              <div className="space-y-2">
                <Label>Type de Bundle</Label>
                <Select
                  value={bundleForm.type}
                  onValueChange={(v) => setBundleForm({ ...bundleForm, type: v as BundleType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixé (produits définis)</SelectItem>
                    <SelectItem value="flexible">Flexible (choix parmi produits)</SelectItem>
                    <SelectItem value="mix_and_match">Mix & Match</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="track-inventory"
                  checked={bundleForm.track_inventory}
                  onCheckedChange={(checked) =>
                    setBundleForm({ ...bundleForm, track_inventory: checked })
                  }
                />
                <Label htmlFor="track-inventory">Suivre l'inventaire</Label>
              </div>
              {bundleForm.track_inventory && (
                <div className="space-y-2">
                  <Label>Quantité disponible</Label>
                  <Input
                    type="number"
                    value={bundleForm.total_quantity}
                    onChange={(e) =>
                      setBundleForm({ ...bundleForm, total_quantity: Number(e.target.value) })
                    }
                    min="0"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="space-y-2">
                <Label>Ajouter des produits</Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {products?.map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      onClick={() => addProductToBundle(product.id)}
                      className="justify-start"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      {product.name}
                    </Button>
                  ))}
                </div>
              </div>
              {bundleForm.items.length > 0 && (
                <div className="space-y-2">
                  <Label>Produits dans le bundle</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundleForm.items.map((item, index) => {
                        const product = products?.find((p) => p.id === item.product_id);
                        return (
                          <TableRow key={index}>
                            <TableCell>{product?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...bundleForm.items];
                                  newItems[index].quantity = Number(e.target.value);
                                  setBundleForm({ ...bundleForm, items: newItems });
                                }}
                                min="1"
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const newItems = [...bundleForm.items];
                                  newItems[index].price = Number(e.target.value);
                                  setBundleForm({ ...bundleForm, items: newItems });
                                }}
                                min="0"
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              {(item.price * item.quantity).toLocaleString()} FCFA
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setBundleForm({
                                    ...bundleForm,
                                    items: bundleForm.items.filter((_, i) => i !== index),
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Prix Original: {bundleCalculations.originalPrice.toLocaleString()} FCFA</p>
                      <p className="text-sm text-muted-foreground">
                        Économies: {bundleCalculations.discountAmount.toLocaleString()} FCFA ({bundleCalculations.discountPercentage.toFixed(1)}%)
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>Prix du Bundle</Label>
                  <Input
                    type="number"
                    value={bundleForm.bundle_price}
                    onChange={(e) =>
                      setBundleForm({ ...bundleForm, bundle_price: Number(e.target.value) })
                    }
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Le prix sera automatiquement ajusté pour refléter les économies
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-savings"
                    checked={bundleForm.show_savings}
                    onCheckedChange={(checked) =>
                      setBundleForm({ ...bundleForm, show_savings: checked })
                    }
                  />
                  <Label htmlFor="show-savings">Afficher les économies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-individual"
                    checked={bundleForm.show_individual_prices}
                    onCheckedChange={(checked) =>
                      setBundleForm({ ...bundleForm, show_individual_prices: checked })
                    }
                  />
                  <Label htmlFor="show-individual">Afficher les prix individuels</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateBundle}
              disabled={createBundle.isPending || bundleForm.items.length === 0}
            >
              {createBundle.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Promotion */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appliquer une Promotion</DialogTitle>
            <DialogDescription>
              Appliquez une promotion automatique au bundle: {selectedBundle?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de promotion</Label>
              <Select
                value={promotionType}
                onValueChange={(v) => setPromotionType(v as 'percentage' | 'amount')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="amount">Montant fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {promotionType === 'percentage' ? 'Pourcentage de réduction' : 'Montant de réduction'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={promotionDiscount}
                  onChange={(e) => setPromotionDiscount(Number(e.target.value))}
                  min="0"
                  max={promotionType === 'percentage' ? 100 : undefined}
                />
                <span className="text-sm text-muted-foreground">
                  {promotionType === 'percentage' ? '%' : 'FCFA'}
                </span>
              </div>
            </div>
            {selectedBundle && (
              <Alert>
                <Percent className="h-4 w-4" />
                <AlertDescription>
                  Prix actuel: {selectedBundle.bundle_price.toLocaleString()} FCFA
                  {promotionType === 'percentage' && promotionDiscount > 0 && (
                    <p className="mt-1">
                      Nouveau prix: {((selectedBundle.original_price * (100 - promotionDiscount)) / 100).toLocaleString()} FCFA
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromotionDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleApplyPromotion}
              disabled={applyPromotion.isPending || promotionDiscount <= 0}
            >
              {applyPromotion.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Application...
                </>
              ) : (
                'Appliquer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


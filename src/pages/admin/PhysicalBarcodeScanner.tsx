/**
 * Page de gestion du Scanner de Codes-barres
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarcodeScanner,
} from '@/components/physical/barcode/BarcodeScanner';
import { BarcodeGenerator } from '@/components/physical/barcode/BarcodeGenerator';
import {
  useBarcodeScanner,
  useProductByBarcode,
  useUpdateStockByBarcode,
  BarcodeScanResult,
} from '@/hooks/physical/useBarcodeScanner';
import { Camera, Search, Package, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PhysicalBarcodeScanner() {
  const [showScanner, setShowScanner] = useState(false);
  const [searchBarcode, setSearchBarcode] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockMovementType, setStockMovementType] = useState<'adjustment' | 'receipt' | 'sale'>('adjustment');
  const { toast } = useToast();

  const { data: productData, isLoading: isLoadingProduct } = useProductByBarcode(scannedBarcode);
  const updateStockMutation = useUpdateStockByBarcode();

  const handleScanSuccess = (result: BarcodeScanResult) => {
    setScannedBarcode(result.code);
    setShowScanner(false);
    toast({
      title: 'Code-barres scanné',
      description: `Code: ${result.code} (${result.format})`,
    });
  };

  const handleSearch = () => {
    if (searchBarcode.trim()) {
      setScannedBarcode(searchBarcode.trim());
    }
  };

  const handleUpdateStock = async () => {
    if (!scannedBarcode) return;

    try {
      await updateStockMutation.mutateAsync({
        barcode: scannedBarcode,
        quantity: stockQuantity,
        movementType: stockMovementType,
        notes: `Mise à jour via scanner: ${scannedBarcode}`,
      });
      setShowStockUpdate(false);
      setStockQuantity(1);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">Scanner de Codes-barres</h1>
              <p className="text-muted-foreground">
                Scannez, recherchez et gérez les codes-barres de vos produits physiques
              </p>
            </div>

            <Tabs defaultValue="scanner" className="space-y-4">
              <TabsList>
                <TabsTrigger value="scanner">Scanner</TabsTrigger>
                <TabsTrigger value="search">Recherche</TabsTrigger>
                <TabsTrigger value="generator">Générateur</TabsTrigger>
              </TabsList>

              <TabsContent value="scanner" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Scanner Mobile
                    </CardTitle>
                    <CardDescription>
                      Utilisez la caméra de votre appareil pour scanner un code-barres
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowScanner(true)} className="w-full" size="lg">
                      <Camera className="mr-2 h-4 w-4" />
                      Ouvrir le Scanner
                    </Button>
                  </CardContent>
                </Card>

                {scannedBarcode && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Résultat du Scan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Code-barres scanné</Label>
                        <Badge variant="outline" className="font-mono text-lg p-2">
                          {scannedBarcode}
                        </Badge>
                      </div>

                      {isLoadingProduct ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : productData ? (
                        <div className="space-y-4">
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-semibold">Produit trouvé</p>
                                <p>
                                  {productData.type === 'serial'
                                    ? `Numéro de série: ${productData.data.serial_number}`
                                    : `Item d'inventaire trouvé`}
                                </p>
                                {productData.data.physical_product?.product && (
                                  <p>
                                    Produit:{' '}
                                    {productData.data.physical_product.product.name}
                                  </p>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => setShowStockUpdate(true)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Mettre à jour le stock
                            </Button>
                            <Button
                              onClick={() => setScannedBarcode(null)}
                              variant="ghost"
                            >
                              Effacer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Aucun produit trouvé avec ce code-barres
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Recherche par Code-barres
                    </CardTitle>
                    <CardDescription>
                      Entrez manuellement un code-barres pour rechercher un produit
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Entrez un code-barres"
                        value={searchBarcode}
                        onChange={(e) => setSearchBarcode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                      />
                      <Button onClick={handleSearch}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>

                    {scannedBarcode && (
                      <div className="space-y-4">
                        {isLoadingProduct ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : productData ? (
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-semibold">Produit trouvé</p>
                                {productData.data.physical_product?.product && (
                                  <p>
                                    {productData.data.physical_product.product.name}
                                  </p>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Aucun produit trouvé avec ce code-barres
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="generator" className="space-y-4">
                <BarcodeGenerator />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Dialog Scanner */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scanner de Code-barres</DialogTitle>
            <DialogDescription>
              Positionnez le code-barres dans le cadre de la caméra
            </DialogDescription>
          </DialogHeader>
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
            autoStop={true}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Mise à jour Stock */}
      <Dialog open={showStockUpdate} onOpenChange={setShowStockUpdate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le Stock</DialogTitle>
            <DialogDescription>
              Modifier la quantité de stock pour le code-barres: {scannedBarcode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de mouvement</Label>
              <select
                value={stockMovementType}
                onChange={(e) =>
                  setStockMovementType(e.target.value as 'adjustment' | 'receipt' | 'sale')
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="adjustment">Ajustement</option>
                <option value="receipt">Réception</option>
                <option value="sale">Vente</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStockUpdate(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleUpdateStock}
                disabled={updateStockMutation.isPending}
              >
                {updateStockMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}


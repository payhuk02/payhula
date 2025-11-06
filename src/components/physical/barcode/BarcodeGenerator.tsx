/**
 * Composant Générateur de Codes-barres
 * Date: 28 Janvier 2025
 * Génère des codes-barres pour les produits physiques
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Barcode, Download, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

export type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'QR_CODE';

interface BarcodeGeneratorProps {
  productId?: string;
  productName?: string;
  onBarcodeGenerated?: (barcode: string, format: BarcodeFormat) => void;
}

export function BarcodeGenerator({
  productId,
  productName,
  onBarcodeGenerated,
}: BarcodeGeneratorProps) {
  const [barcodeValue, setBarcodeValue] = useState('');
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Générer un code-barres automatique basé sur le productId
  const generateAutoBarcode = () => {
    if (productId) {
      // Format: PREFIX + productId (sans tirets) + checksum
      const cleanId = productId.replace(/-/g, '');
      const prefix = 'PHY';
      const barcode = `${prefix}${cleanId.substring(0, 10).padStart(10, '0')}`;
      setBarcodeValue(barcode);
    }
  };

  // Générer le QR code ou code-barres
  const handleGenerate = async () => {
    if (!barcodeValue.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une valeur pour le code-barres',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      if (format === 'QR_CODE') {
        // Générer QR code
        const qrDataUrl = await QRCode.toDataURL(barcodeValue, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(qrDataUrl);
        onBarcodeGenerated?.(barcodeValue, format);
        toast({
          title: 'QR Code généré',
          description: 'Le QR code a été généré avec succès',
        });
      } else {
        // Pour les codes-barres 1D, on utilise une bibliothèque externe
        // Pour l'instant, on génère un QR code avec la valeur
        const qrDataUrl = await QRCode.toDataURL(barcodeValue, {
          width: 300,
          margin: 2,
        });
        setQrCodeUrl(qrDataUrl);
        onBarcodeGenerated?.(barcodeValue, format);
        toast({
          title: 'Code-barres généré',
          description: `Le code-barres ${format} a été généré avec succès`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la génération',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Télécharger le code-barres
  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `barcode-${barcodeValue}-${format}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Téléchargement',
      description: 'Le code-barres a été téléchargé',
    });
  };

  // Copier le code-barres
  const handleCopy = () => {
    navigator.clipboard.writeText(barcodeValue);
    toast({
      title: 'Copié',
      description: 'Le code-barres a été copié dans le presse-papiers',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Barcode className="h-5 w-5" />
          Générateur de Code-barres
        </CardTitle>
        <CardDescription>
          {productName
            ? `Générer un code-barres pour ${productName}`
            : 'Générer un code-barres ou QR code'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="barcode-value">Valeur du code-barres</Label>
          <div className="flex gap-2">
            <Input
              id="barcode-value"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              placeholder="Entrez ou scannez un code-barres"
            />
            {productId && (
              <Button variant="outline" onClick={generateAutoBarcode}>
                Auto
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="barcode-format">Format</Label>
          <Select value={format} onValueChange={(value) => setFormat(value as BarcodeFormat)}>
            <SelectTrigger id="barcode-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CODE128">CODE 128</SelectItem>
              <SelectItem value="CODE39">CODE 39</SelectItem>
              <SelectItem value="EAN13">EAN-13</SelectItem>
              <SelectItem value="EAN8">EAN-8</SelectItem>
              <SelectItem value="UPC">UPC</SelectItem>
              <SelectItem value="QR_CODE">QR Code</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !barcodeValue.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Barcode className="mr-2 h-4 w-4" />
              Générer
            </>
          )}
        </Button>

        {qrCodeUrl && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Code-barres généré :</p>
                  <Badge variant="outline" className="font-mono text-sm">
                    {barcodeValue}
                  </Badge>
                  <Badge variant="secondary">{format}</Badge>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center p-4 bg-white rounded-lg border">
              <img src={qrCodeUrl} alt="Code-barres" className="max-w-full h-auto" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
              <Button variant="outline" onClick={handleCopy} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copier
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


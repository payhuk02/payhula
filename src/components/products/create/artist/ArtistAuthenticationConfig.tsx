/**
 * Artist Product - Authentication Configuration
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, FileText, PenTool, Upload, X, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import type { ArtistProductFormData } from '@/types/artist-product';

interface ArtistAuthenticationConfigProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}

export const ArtistAuthenticationConfig = ({ data, onUpdate }: ArtistAuthenticationConfigProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: '❌ Format non supporté',
        description: 'Veuillez uploader un fichier PDF ou une image (JPG, PNG)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { url, error } = await uploadToSupabaseStorage(file, {
        bucket: 'product-files',
        path: 'certificates',
        filePrefix: 'certificate',
      });

      if (error) throw error;

      if (url) {
        onUpdate({ certificate_file_url: url });
        toast({
          title: '✅ Certificat uploadé',
          description: 'Le certificat d\'authenticité a été uploadé avec succès',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Erreur d\'upload',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveCertificate = () => {
    onUpdate({ certificate_file_url: '' });
    toast({
      title: 'Certificat supprimé',
      description: 'Le certificat a été retiré',
    });
  };

  return (
    <div className="space-y-6">
      {/* Certificate of Authenticity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Certificat d'authenticité
              </CardTitle>
              <CardDescription>
                Cette œuvre dispose-t-elle d'un certificat d'authenticité ?
              </CardDescription>
            </div>
            <Switch
              checked={data.certificate_of_authenticity ?? false}
              onCheckedChange={(checked) => onUpdate({ certificate_of_authenticity: checked })}
            />
          </div>
        </CardHeader>
        {data.certificate_of_authenticity && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Uploader le certificat d'authenticité</Label>
              {data.certificate_file_url ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Certificat uploadé</p>
                      <p className="text-xs text-muted-foreground">
                        {data.certificate_file_url.split('/').pop()}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCertificate}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? 'Upload en cours...' : 'Cliquez pour uploader (PDF, JPG, PNG)'}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/jpg"
                    onChange={handleCertificateUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Le certificat d'authenticité sera visible par les acheteurs sur la page produit. 
                Il renforce la confiance et la valeur de l'œuvre.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Signature Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-blue-500" />
                Signature authentifiée
              </CardTitle>
              <CardDescription>
                L'œuvre est-elle signée par l'artiste ?
              </CardDescription>
            </div>
            <Switch
              checked={data.signature_authenticated ?? false}
              onCheckedChange={(checked) => onUpdate({ signature_authenticated: checked })}
            />
          </div>
        </CardHeader>
        {data.signature_authenticated && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature_location">Emplacement de la signature</Label>
              <Input
                id="signature_location"
                placeholder="Ex: En bas à droite, Au dos, Sur le cadre"
                value={data.signature_location || ''}
                onChange={(e) => onUpdate({ signature_location: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Indiquez où se trouve la signature sur l'œuvre
              </p>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Une signature authentifiée augmente significativement la valeur et l'authenticité de l'œuvre.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Edition Info */}
      {(data.edition_type === 'limited_edition' || data.edition_type === 'print') && (
        <Card>
          <CardHeader>
            <CardTitle>Informations d'édition</CardTitle>
            <CardDescription>
              Détails sur l'édition limitée ou la reproduction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edition_number">Numéro d'édition</Label>
                <Input
                  id="edition_number"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={data.edition_number || ''}
                  onChange={(e) => onUpdate({ edition_number: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_editions">Total d'éditions</Label>
                <Input
                  id="total_editions"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={data.total_editions || ''}
                  onChange={(e) => onUpdate({ total_editions: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>
            {data.edition_number && data.total_editions && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Édition {data.edition_number} sur {data.total_editions}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Valeur ajoutée :</strong> Les certificats d'authenticité et signatures authentifiées 
          renforcent la confiance des acheteurs et peuvent justifier un prix plus élevé pour l'œuvre.
        </AlertDescription>
      </Alert>
    </div>
  );
};


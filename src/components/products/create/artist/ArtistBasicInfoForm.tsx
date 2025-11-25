/**
 * Artist Product - Basic Info Form
 * Date: 28 Janvier 2025
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X, Loader2, Globe, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import type { ArtistProductFormData, ArtistSocialLinks } from '@/types/artist-product';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

interface ArtistBasicInfoFormProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}

export const ArtistBasicInfoForm = ({ data, onUpdate }: ArtistBasicInfoFormProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { url, error } = await uploadToSupabaseStorage(file, {
          bucket: 'product-images',
          path: 'artist',
          filePrefix: 'artwork',
          onProgress: (progress) => setUploadProgress(progress),
        });

        if (error) throw error;
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (validUrls.length > 0) {
        onUpdate({ images: [...(data.images || []), ...validUrls] });
        toast({
          title: "✅ Images uploadées",
          description: `${validUrls.length} image(s) ajoutée(s) avec succès`,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Erreur d'upload",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...(data.images || [])];
    newImages.splice(index, 1);
    onUpdate({ images: newImages });
  };

  const handleTagAdd = (tag: string) => {
    if (!tag.trim()) return;
    const newTags = [...(data.tags || []), tag.trim()];
    onUpdate({ tags: newTags });
  };

  const handleTagRemove = (index: number) => {
    const newTags = [...(data.tags || [])];
    newTags.splice(index, 1);
    onUpdate({ tags: newTags });
  };

  const updateSocialLink = (platform: keyof ArtistSocialLinks, value: string) => {
    onUpdate({
      artist_social_links: {
        ...(data.artist_social_links || {}),
        [platform]: value || undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Informations Artiste */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <h3 className="text-lg font-semibold">Informations Artiste</h3>
        
        <div className="space-y-2">
          <Label htmlFor="artist_name">Nom de l'artiste *</Label>
          <Input
            id="artist_name"
            placeholder="Ex: Jean Dupont"
            value={data.artist_name || ''}
            onChange={(e) => onUpdate({ artist_name: e.target.value })}
            onKeyDown={handleSpaceKeyDown}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist_bio">Biographie de l'artiste</Label>
          <Textarea
            id="artist_bio"
            placeholder="Présentez-vous et votre parcours artistique..."
            value={data.artist_bio || ''}
            onChange={(e) => onUpdate({ artist_bio: e.target.value })}
            onKeyDown={handleSpaceKeyDown}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist_website">Site web / Portfolio</Label>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Input
              id="artist_website"
              type="url"
              placeholder="https://votre-site.com"
              value={data.artist_website || ''}
              onChange={(e) => onUpdate({ artist_website: e.target.value })}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="space-y-3">
          <Label>Réseaux sociaux (optionnel)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              <Input
                placeholder="@votre_instagram"
                value={data.artist_social_links?.instagram || ''}
                onChange={(e) => updateSocialLink('instagram', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
              />
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              <Input
                placeholder="Votre page Facebook"
                value={data.artist_social_links?.facebook || ''}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
              />
            </div>
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-blue-400" />
              <Input
                placeholder="@votre_twitter"
                value={data.artist_social_links?.twitter || ''}
                onChange={(e) => updateSocialLink('twitter', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
              />
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              <Input
                placeholder="Votre chaîne YouTube"
                value={data.artist_social_links?.youtube || ''}
                onChange={(e) => updateSocialLink('youtube', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Informations Œuvre */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">Informations Œuvre</h3>

        <div className="space-y-2">
          <Label htmlFor="artwork_title">Titre de l'œuvre *</Label>
          <Input
            id="artwork_title"
            placeholder="Ex: La Nuit Étoilée"
            value={data.artwork_title || ''}
            onChange={(e) => onUpdate({ artwork_title: e.target.value })}
            onKeyDown={handleSpaceKeyDown}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="artwork_year">Année de création</Label>
            <Input
              id="artwork_year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="2024"
              value={data.artwork_year || ''}
              onChange={(e) => onUpdate({ artwork_year: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artwork_medium">Médium / Technique *</Label>
            <Input
              id="artwork_medium"
              placeholder="Ex: Huile sur toile, Acrylique, Photographie, Roman"
              value={data.artwork_medium || ''}
              onChange={(e) => onUpdate({ artwork_medium: e.target.value })}
              onKeyDown={handleSpaceKeyDown}
            />
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
          <Label>Dimensions</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Largeur"
                value={data.artwork_dimensions?.width || ''}
                onChange={(e) => onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || { width: null, height: null, depth: null, unit: 'cm' }),
                    width: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Hauteur"
                value={data.artwork_dimensions?.height || ''}
                onChange={(e) => onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || { width: null, height: null, depth: null, unit: 'cm' }),
                    height: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })}
              />
            </div>
            <div>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={data.artwork_dimensions?.unit || 'cm'}
                onChange={(e) => onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || { width: null, height: null, depth: null, unit: 'cm' }),
                    unit: e.target.value as 'cm' | 'in',
                  },
                })}
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description de l'œuvre *</Label>
        <RichTextEditorPro
          content={data.description || ''}
          onChange={(content) => onUpdate({ description: content })}
          placeholder="Décrivez votre œuvre en détail..."
          showWordCount={true}
          maxHeight="400px"
        />
      </div>

      {/* Prix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Prix de vente (XOF) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="1"
            placeholder="10000"
            value={data.price || ''}
            onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compare_at_price">Prix de comparaison (XOF)</Label>
          <Input
            id="compare_at_price"
            type="number"
            min="0"
            step="1"
            placeholder="15000"
            value={data.compare_at_price || ''}
            onChange={(e) => onUpdate({ compare_at_price: e.target.value ? parseFloat(e.target.value) : null })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_per_item">Coût par article (XOF)</Label>
          <Input
            id="cost_per_item"
            type="number"
            min="0"
            step="1"
            placeholder="5000"
            value={data.cost_per_item || ''}
            onChange={(e) => onUpdate({ cost_per_item: e.target.value ? parseFloat(e.target.value) : null })}
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Images de l'œuvre *</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.images?.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
              <img
                src={image}
                alt={`Artwork ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <label className={`aspect-square rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-col gap-2 ${
            uploading 
              ? 'border-primary bg-primary/5 cursor-wait' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer text-muted-foreground hover:text-foreground'
          }`}>
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-primary font-medium">{uploadProgress}%</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Ajouter</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.tags?.map((tag, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleTagRemove(index)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Ajouter un tag"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTagAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};


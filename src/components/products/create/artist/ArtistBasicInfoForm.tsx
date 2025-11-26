/**
 * Artist Product - Basic Info Form
 * Date: 28 Janvier 2025
 */

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X, Loader2, Globe, Instagram, Facebook, Twitter, Youtube, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ArtistProductFormData, ArtistSocialLinks } from '@/types/artist-product';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { logger } from '@/lib/logger';

interface ArtistBasicInfoFormProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}

export const ArtistBasicInfoForm = ({ data, onUpdate }: ArtistBasicInfoFormProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  
  // Compteurs pour éviter les boucles infinies de réessais
  const artistPhotoRetryCount = useRef(0);
  const artworkImageRetryCounts = useRef<Map<number, number>>(new Map());

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Vérifier l'authentification avec getSession (plus fiable que getUser)
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session || !session.user) {
        logger.error('Erreur authentification upload images œuvre', { error: authError });
        throw new Error("Non authentifié. Veuillez vous reconnecter.");
      }

      // Validation préventive : vérifier tous les fichiers AVANT upload
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const invalidFiles: string[] = [];
      
      // Validation synchrone (type MIME et extension)
      for (const file of Array.from(files)) {
        // Vérifier le type MIME
        if (!file.type || !file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} (type MIME: ${file.type || 'inconnu'})`);
          continue;
        }
        
        // Vérifier l'extension
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !validExtensions.includes(fileExt)) {
          invalidFiles.push(`${file.name} (extension: .${fileExt || 'inconnue'})`);
          continue;
        }
      }

      if (invalidFiles.length > 0) {
        toast({
          title: "❌ Fichiers invalides",
          description: `Les fichiers suivants ne sont pas des images valides : ${invalidFiles.join(', ')}. Veuillez utiliser des images (PNG, JPG, WEBP, GIF).`,
          variant: "destructive",
        });
        setUploading(false);
        setUploadProgress(0);
        e.target.value = '';
        return;
      }

      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validation supplémentaire pour chaque fichier (double sécurité)
        if (!file.type || !file.type.startsWith('image/')) {
          throw new Error(`Le fichier "${file.name}" n'est pas une image valide (type: ${file.type || 'inconnu'})`);
        }

        // Générer un nom de fichier unique
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        
        // Forcer le Content-Type selon l'extension (plus fiable que file.type qui peut être incorrect)
        // Cela garantit que Supabase Storage reçoit toujours un type MIME valide
        let contentType: string;
        if (fileExt === 'png') {
          contentType = 'image/png';
        } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
          contentType = 'image/jpeg';
        } else if (fileExt === 'webp') {
          contentType = 'image/webp';
        } else if (fileExt === 'gif') {
          contentType = 'image/gif';
        } else {
          // Fallback : utiliser file.type si disponible, sinon image/png par défaut
          contentType = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
        }
        
        const fileName = `artist/artwork_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

        logger.info('Upload image œuvre - Détails', {
          fileName: file.name,
          fileSize: file.size,
          originalFileType: file.type,
          correctedContentType: contentType,
          targetPath: fileName,
          index
        });

        // SOLUTION CRITIQUE : Utiliser XMLHttpRequest directement pour contrôler le Content-Type
        // Note: session est déjà déclarée dans handleImageUpload, on la réutilise
        if (!session) {
          throw new Error("Non authentifié");
        }

        const projectUrl = supabase.supabaseUrl;
        const uploadUrl = `${projectUrl}/storage/v1/object/product-images/${fileName}`;

        // Upload via XMLHttpRequest avec Content-Type explicite
        const uploadData = await new Promise<{ path: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = ((index + 1) / files.length) * 100;
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve({ path: response.path || fileName });
              } catch {
                resolve({ path: fileName });
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.message || error.error || `Erreur upload: ${xhr.statusText} (${xhr.status})`));
              } catch {
                reject(new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`));
              }
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Erreur réseau lors de l\'upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload annulé'));
          });

          xhr.open('POST', uploadUrl);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.setRequestHeader('Content-Type', contentType); // CRITIQUE : Forcer le Content-Type
          xhr.setRequestHeader('x-upsert', 'false');
          xhr.setRequestHeader('cache-control', '3600');

          xhr.send(file);
        });

        const uploadError = null; // Pas d'erreur si on arrive ici

        if (uploadError) {
          logger.error('Erreur upload image œuvre', { 
            error: uploadError, 
            errorMessage: uploadError.message,
            fileName: file.name,
            contentType,
            fileType: file.type,
            index
          });
          throw uploadError;
        }
        if (!uploadData || !uploadData.path) throw new Error('Upload réussi mais aucun chemin retourné');

        const pathToUse = uploadData.path;
        
        logger.info('Vérification chemin upload (œuvre)', {
          fileName: fileName,
          uploadDataPath: pathToUse,
          pathsMatch: pathToUse === fileName,
          index
        });

        // Récupérer l'URL publique
        const { data: { publicUrl }, error: urlError } = supabase.storage
          .from("product-images")
          .getPublicUrl(pathToUse);

        if (urlError) {
          logger.error('Erreur génération URL publique (œuvre)', { error: urlError, path: pathToUse, index });
          throw urlError;
        }

        if (!publicUrl) {
          logger.error('Aucune URL publique retournée (œuvre)', { path: pathToUse, uploadData, index });
          throw new Error('Aucune URL publique retournée');
        }

        // Vérifier le format de l'URL
        const isValidUrl = publicUrl.startsWith('http://') || publicUrl.startsWith('https://');
        if (!isValidUrl) {
          logger.error('URL publique invalide (œuvre)', { publicUrl, path: pathToUse, index });
          throw new Error(`URL publique invalide: ${publicUrl}`);
        }

        // IMPORTANT: Le bucket product-images est public selon la migration
        // Cependant, il peut y avoir un délai de propagation ou un problème de RLS
        // Nous allons essayer plusieurs stratégies pour obtenir une URL fonctionnelle
        let finalUrl = publicUrl;
        let urlType = 'public';
        
        // Attendre un peu pour que Supabase finalise l'upload
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Stratégie 1: Vérifier via l'API Supabase que le fichier existe
        try {
          const { data: fileList, error: listError } = await supabase.storage
            .from("product-images")
            .list(uploadData.path.split('/').slice(0, -1).join('/') || 'artist', {
              limit: 1000,
              search: uploadData.path.split('/').pop()
            });
          
          const fileExists = fileList?.some(file => file.name === uploadData.path.split('/').pop());
          
          if (!fileExists && listError) {
            logger.warn('⚠️ Impossible de vérifier l\'existence du fichier via l\'API (œuvre)', { 
              error: listError,
              path: uploadData.path,
              index
            });
          } else if (!fileExists) {
            logger.warn('⚠️ Le fichier n\'apparaît pas encore dans la liste (peut être normal si upload récent) (œuvre)', { 
              path: uploadData.path,
              index
            });
          } else {
            logger.info('✅ Fichier confirmé présent dans le bucket (œuvre)', { 
              path: uploadData.path,
              index
            });
            
            // IMPORTANT: Comme le bucket est maintenant public avec les politiques RLS correctes,
            // nous devrions pouvoir utiliser directement l'URL publique.
            // Testons l'URL publique avant d'essayer le téléchargement.
            try {
              const testResponse = await fetch(publicUrl, { 
                method: 'HEAD',
                cache: 'no-cache'
              });
              
              if (testResponse.ok) {
                const contentType = testResponse.headers.get('content-type');
                if (contentType && contentType.startsWith('image/')) {
                  logger.info('✅ URL publique fonctionne correctement (œuvre)', {
                    path: uploadData.path,
                    index,
                    contentType
                  });
                  // Utiliser directement l'URL publique
                  finalUrl = publicUrl;
                  urlType = 'public';
                  // Pas besoin de blob URL, l'URL publique fonctionne
                } else {
                  logger.warn('⚠️ URL publique retourne un type non-image (œuvre)', {
                    path: uploadData.path,
                    index,
                    contentType
                  });
                }
              } else {
                logger.warn('⚠️ URL publique non accessible (œuvre) - status: ' + testResponse.status, {
                  path: uploadData.path,
                  index
                });
              }
            } catch (testError) {
              logger.warn('⚠️ Test URL publique échoué (œuvre), mais on continue avec l\'URL publique', {
                path: uploadData.path,
                index,
                error: testError
              });
              // On continue avec l'URL publique car le bucket est public
            }
          }
        } catch (verifyError) {
          logger.warn('⚠️ Erreur vérification existence fichier (œuvre)', { 
            error: verifyError,
            path: uploadData.path,
            index
          });
        }
        
        // Si aucune stratégie n'a fonctionné, utiliser l'URL publique par défaut
        
        logger.info('Image œuvre - URL finale sélectionnée', {
          urlType,
          url: finalUrl.substring(0, 80) + '...',
          index
        });

        logger.info('Image œuvre uploadée', { 
          url: finalUrl.substring(0, 80) + '...',
          path: pathToUse,
          fileName: file.name,
          index,
          urlFormat: 'valid'
        });

        setUploadProgress(Math.round(((index + 1) / files.length) * 100));
        return finalUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null && url !== undefined);

      if (validUrls.length > 0) {
        // Réinitialiser les compteurs de réessais pour les nouvelles images
        const startIndex = (data.images || []).length;
        validUrls.forEach((_, idx) => {
          artworkImageRetryCounts.current.set(startIndex + idx, 0);
        });
        
        onUpdate({ images: [...(data.images || []), ...validUrls] });
        toast({
          title: "✅ Images uploadées",
          description: `${validUrls.length} image(s) ajoutée(s) avec succès`,
        });
      }
    } catch (error) {
      logger.error('Erreur upload images œuvre', { error });
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
    // Réinitialiser le compteur de réessais pour cette image
    artworkImageRetryCounts.current.delete(index);
    // Réinitialiser les compteurs pour les images suivantes
    artworkImageRetryCounts.current.forEach((_, idx) => {
      if (idx > index) {
        artworkImageRetryCounts.current.delete(idx);
        artworkImageRetryCounts.current.set(idx - 1, 0);
      }
    });
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

        {/* Photo de l'artiste */}
        <div className="space-y-2">
          <Label htmlFor="artist_photo">Photo de l'artiste (optionnel)</Label>
          <div className="flex items-center gap-4">
            {data.artist_photo_url ? (
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-primary/30 bg-muted shadow-md flex-shrink-0 group">
                {imageLoading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {!imageError && (
                <img
                  src={data.artist_photo_url}
                  alt="Photo de l'artiste"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                  loading="eager"
                  decoding="async"
                  style={{
                    imageRendering: 'high-quality',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  onLoad={() => {
                    setImageLoading(false);
                    setImageError(false);
                    logger.info('Photo artiste chargée avec succès', { url: data.artist_photo_url });
                  }}
                  onLoadStart={() => {
                    setImageLoading(true);
                    setImageError(false);
                  }}
                  onError={async (e) => {
                    const imgElement = e.currentTarget;
                    const failedUrl = imgElement.src;
                    
                    // Limiter le nombre de tentatives pour éviter les boucles infinies
                    const MAX_RETRIES = 2;
                    if (artistPhotoRetryCount.current >= MAX_RETRIES) {
                      logger.warn('Nombre maximum de tentatives atteint pour la photo artiste', { 
                        retryCount: artistPhotoRetryCount.current,
                        url: failedUrl.substring(0, 100) + '...'
                      });
                      setImageError(true);
                      setImageLoading(false);
                      return;
                    }
                    
                    artistPhotoRetryCount.current += 1;
                    
                    logger.error('Erreur chargement photo artiste', { 
                      url: failedUrl.substring(0, 100) + '...',
                      isSupabaseUrl: failedUrl.includes('.supabase.co'),
                      isSignedUrl: failedUrl.includes('/sign/'),
                      isPublicUrl: failedUrl.includes('/public/'),
                      retryAttempt: artistPhotoRetryCount.current,
                      maxRetries: MAX_RETRIES
                    });
                    
                    // Si c'est une URL Supabase, essayer une seule stratégie de réessai
                    if (failedUrl.includes('.supabase.co') && artistPhotoRetryCount.current <= MAX_RETRIES) {
                      // Extraire le chemin du fichier
                      let filePath: string | null = null;
                      
                      const pathMatch = failedUrl.match(/product-images\/(.+?)(\?|$)/);
                      filePath = pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : null;
                      
                      if (filePath) {
                        // Attendre un peu pour la propagation
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Essayer une URL signée (dernière tentative)
                        try {
                          const { data: signedData, error: signedError } = await supabase.storage
                            .from("product-images")
                            .createSignedUrl(filePath, 86400); // 24 heures
                          
                          if (!signedError && signedData?.signedUrl) {
                            logger.info('✅ URL signée créée après réessai', { 
                              filePath,
                              retryAttempt: artistPhotoRetryCount.current
                            });
                            onUpdate({ artist_photo_url: signedData.signedUrl });
                            setImageError(false);
                            setImageLoading(true);
                            // Ne pas réinitialiser le compteur, car si ça échoue encore, on veut arrêter
                            return;
                          }
                        } catch (signError) {
                          logger.error('Erreur création URL signée après réessai', { 
                            error: signError, 
                            filePath,
                            retryAttempt: artistPhotoRetryCount.current
                          });
                        }
                      }
                    }
                    
                    // Si toutes les stratégies ont échoué, afficher le placeholder d'erreur
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  />
                )}
                <div className={`absolute inset-0 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 z-10 ${
                  imageError ? 'flex flex-col gap-2' : 'hidden'
                }`}>
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground px-2 mb-2">Image non accessible</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Réessayer de charger l'image
                        setImageError(false);
                        setImageLoading(true);
                        const img = new Image();
                        img.onload = () => {
                          setImageLoading(false);
                          setImageError(false);
                        };
                        img.onerror = () => {
                          setImageError(true);
                          setImageLoading(false);
                        };
                        img.src = data.artist_photo_url || '';
                      }}
                      className="text-xs"
                    >
                      Réessayer
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onUpdate({ artist_photo_url: undefined });
                    setImageError(false);
                    setImageLoading(true);
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700 z-10"
                  aria-label="Supprimer la photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/25 bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <label className={`flex-1 aspect-square max-w-[200px] min-w-[150px] rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-col gap-2 ${
              uploading 
                ? 'border-primary bg-primary/5 cursor-wait' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer text-muted-foreground hover:text-foreground'
            }`}>
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-primary font-medium">{uploadProgress}%</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs text-center px-2">Ajouter une photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Validation préventive stricte AVANT tout traitement
                  
                  // 1. Vérifier le type MIME
                  if (!file.type || !file.type.startsWith('image/')) {
                    toast({
                      title: "❌ Erreur",
                      description: `Le fichier sélectionné n'est pas une image valide. Type détecté: ${file.type || 'inconnu'}. Veuillez sélectionner une image (PNG, JPG, WEBP).`,
                      variant: "destructive",
                    });
                    e.target.value = ''; // Reset input
                    return;
                  }

                  // 2. Vérifier l'extension du fichier
                  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
                  const fileExt = file.name.split('.').pop()?.toLowerCase();
                  if (!fileExt || !validExtensions.includes(fileExt)) {
                    toast({
                      title: "❌ Erreur",
                      description: `Extension de fichier non supportée (.${fileExt || 'inconnue'}). Veuillez utiliser une image (PNG, JPG, WEBP, GIF).`,
                      variant: "destructive",
                    });
                    e.target.value = ''; // Reset input
                    return;
                  }

                  // 3. Vérifier les magic bytes (signature du fichier) pour s'assurer que c'est vraiment une image
                  try {
                    const arrayBuffer = await file.slice(0, 12).arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    
                    // Signatures de fichiers image courantes
                    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
                    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
                    const isGIF = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
                    const isWebP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && 
                                   bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
                    
                    if (!isJPEG && !isPNG && !isGIF && !isWebP) {
                      toast({
                        title: "❌ Erreur",
                        description: `Le fichier sélectionné n'est pas une image valide. La signature du fichier ne correspond pas à une image (PNG, JPG, WEBP, GIF). Le fichier pourrait être corrompu ou être un autre type de fichier.`,
                        variant: "destructive",
                      });
                      e.target.value = ''; // Reset input
                      return;
                    }
                  } catch (magicBytesError) {
                    logger.warn('Erreur lors de la vérification des magic bytes', { error: magicBytesError });
                    // Continuer quand même si la vérification échoue (ne pas bloquer l'upload)
                  }

                  setUploading(true);
                  setUploadProgress(0);

                  try {
                    // Vérifier l'authentification avec getSession (plus fiable que getUser)
                    const { data: { session }, error: authError } = await supabase.auth.getSession();
                    if (authError || !session || !session.user) {
                      logger.error('Erreur authentification upload photo artiste', { error: authError });
                      throw new Error("Non authentifié. Veuillez vous reconnecter.");
                    }

                    // Générer un nom de fichier unique
                    const fileName = `artist/artist-photo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

                    // Forcer le Content-Type selon l'extension (plus fiable que file.type qui peut être incorrect)
                    // Cela garantit que Supabase Storage reçoit toujours un type MIME valide
                    let contentType: string;
                    if (fileExt === 'png') {
                      contentType = 'image/png';
                    } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
                      contentType = 'image/jpeg';
                    } else if (fileExt === 'webp') {
                      contentType = 'image/webp';
                    } else if (fileExt === 'gif') {
                      contentType = 'image/gif';
                    } else {
                      // Fallback : utiliser file.type si disponible, sinon image/png par défaut
                      contentType = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
                    }

                    logger.info('Upload photo artiste - Détails', {
                      fileName: file.name,
                      fileSize: file.size,
                      originalFileType: file.type,
                      correctedContentType: contentType,
                      targetPath: fileName
                    });

                    // SOLUTION CRITIQUE : Utiliser XMLHttpRequest directement pour contrôler le Content-Type
                    // Supabase JS client a un bug qui ignore le type MIME du File object dans certains cas
                    // Note: session est déjà déclarée plus haut, on la réutilise
                    if (!session) {
                      throw new Error("Non authentifié");
                    }

                    const projectUrl = supabase.supabaseUrl;
                    const uploadUrl = `${projectUrl}/storage/v1/object/product-images/${fileName}`;

                    // Upload via XMLHttpRequest avec Content-Type explicite
                    const uploadData = await new Promise<{ path: string }>((resolve, reject) => {
                      const xhr = new XMLHttpRequest();

                      xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                          const progress = (e.loaded / e.total) * 100;
                          setUploadProgress(progress);
                        }
                      });

                      xhr.addEventListener('load', () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                          try {
                            const response = JSON.parse(xhr.responseText);
                            resolve({ path: response.path || fileName });
                          } catch {
                            resolve({ path: fileName });
                          }
                        } else {
                          try {
                            const error = JSON.parse(xhr.responseText);
                            reject(new Error(error.message || error.error || `Erreur upload: ${xhr.statusText} (${xhr.status})`));
                          } catch {
                            reject(new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`));
                          }
                        }
                      });

                      xhr.addEventListener('error', () => {
                        reject(new Error('Erreur réseau lors de l\'upload'));
                      });

                      xhr.addEventListener('abort', () => {
                        reject(new Error('Upload annulé'));
                      });

                      xhr.open('POST', uploadUrl);
                      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
                      xhr.setRequestHeader('Content-Type', contentType); // CRITIQUE : Forcer le Content-Type
                      xhr.setRequestHeader('x-upsert', 'false');
                      xhr.setRequestHeader('cache-control', '3600');

                      xhr.send(file);
                    });

                    const uploadError = null; // Pas d'erreur si on arrive ici

                    if (uploadError) {
                      logger.error('Erreur upload photo artiste', { 
                        error: uploadError, 
                        errorMessage: uploadError.message,
                        fileName: file.name,
                        contentType,
                        fileType: file.type
                      });
                      throw uploadError;
                    }

                    if (!uploadData || !uploadData.path) {
                      throw new Error('Upload réussi mais aucun chemin retourné');
                    }

                    // IMPORTANT: Vérifier que le chemin retourné correspond au chemin uploadé
                    // Parfois Supabase peut modifier le chemin (normalisation, etc.)
                    const actualPath = uploadData.path;
                    const expectedPath = fileName;
                    
                    logger.info('Vérification chemin upload', {
                      fileName: fileName,
                      uploadDataPath: actualPath,
                      pathsMatch: actualPath === expectedPath,
                      pathLength: actualPath.length,
                      expectedLength: expectedPath.length
                    });

                    // Utiliser le chemin retourné par Supabase (plus fiable)
                    // Mais aussi logger le chemin attendu pour diagnostic
                    const pathToUse = actualPath;

                    // Récupérer l'URL publique avec le chemin exact retourné par Supabase
                    const { data: { publicUrl }, error: urlError } = supabase.storage
                      .from("product-images")
                      .getPublicUrl(pathToUse);

                    if (urlError) {
                      logger.error('Erreur génération URL publique', { error: urlError, path: uploadData.path });
                      throw urlError;
                    }

                    if (!publicUrl) {
                      logger.error('Aucune URL publique retournée', { path: uploadData.path, uploadData });
                      throw new Error('Aucune URL publique retournée');
                    }

                    // Vérifier le format de l'URL
                    const isValidUrl = publicUrl.startsWith('http://') || publicUrl.startsWith('https://');
                    if (!isValidUrl) {
                      logger.error('URL publique invalide', { publicUrl, path: uploadData.path });
                      throw new Error(`URL publique invalide: ${publicUrl}`);
                    }

                    // IMPORTANT: Le bucket product-images est public selon la migration
                    // Cependant, il peut y avoir un délai de propagation ou un problème de RLS
                    // Nous allons essayer plusieurs stratégies pour obtenir une URL fonctionnelle
                    let finalUrl = publicUrl;
                    let urlType = 'public';
                    
                    // Attendre un peu pour que Supabase finalise l'upload
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Stratégie 1: Vérifier via l'API Supabase que le fichier existe
                    try {
                      const { data: fileList, error: listError } = await supabase.storage
                        .from("product-images")
                        .list(uploadData.path.split('/').slice(0, -1).join('/') || 'artist', {
                          limit: 1000,
                          search: uploadData.path.split('/').pop()
                        });
                      
                      const fileExists = fileList?.some(file => file.name === uploadData.path.split('/').pop());
                      
                      if (!fileExists && listError) {
                        logger.warn('⚠️ Impossible de vérifier l\'existence du fichier via l\'API', { 
                          error: listError,
                          path: uploadData.path
                        });
                      } else if (!fileExists) {
                        logger.warn('⚠️ Le fichier n\'apparaît pas encore dans la liste (peut être normal si upload récent)', { 
                          path: uploadData.path
                        });
                      } else {
                        logger.info('✅ Fichier confirmé présent dans le bucket', { 
                          path: uploadData.path
                        });
                        
                        // IMPORTANT: Comme le bucket est maintenant public avec les politiques RLS correctes,
                        // nous devrions pouvoir utiliser directement l'URL publique.
                        // Testons d'abord l'URL publique avant d'essayer le téléchargement.
                        try {
                          const testResponse = await fetch(publicUrl, { 
                            method: 'HEAD',
                            cache: 'no-cache'
                          });
                          
                          if (testResponse.ok) {
                            const contentType = testResponse.headers.get('content-type');
                            if (contentType && contentType.startsWith('image/')) {
                              logger.info('✅ URL publique fonctionne correctement', {
                                path: uploadData.path,
                                contentType
                              });
                              // Utiliser directement l'URL publique
                              finalUrl = publicUrl;
                              urlType = 'public';
                              // Pas besoin de blob URL, l'URL publique fonctionne
                            } else {
                              logger.warn('⚠️ URL publique retourne un type non-image', {
                                path: uploadData.path,
                                contentType
                              });
                              // Continuer avec la stratégie de téléchargement seulement si nécessaire
                            }
                          } else {
                            logger.warn('⚠️ URL publique non accessible (status: ' + testResponse.status + ')', {
                              path: uploadData.path
                            });
                          }
                        } catch (testError) {
                          logger.warn('⚠️ Test URL publique échoué, mais on continue avec l\'URL publique de toute façon', {
                            path: uploadData.path,
                            error: testError
                          });
                          // On continue avec l'URL publique car le bucket est public
                          // Si ça ne marche pas, l'image affichera une erreur et le handler onError prendra le relais
                        }
                      }
                    } catch (verifyError) {
                      logger.warn('⚠️ Erreur vérification existence fichier', { 
                        error: verifyError,
                        path: uploadData.path
                      });
                    }
                    
                    // Si aucune stratégie n'a fonctionné, utiliser l'URL publique par défaut
                    // (elle peut fonctionner après un délai de propagation)
                    
                    logger.info('Photo artiste - URL finale sélectionnée', {
                      urlType,
                      url: finalUrl.substring(0, 80) + '...',
                      path: uploadData.path
                    });

                    logger.info('Photo artiste uploadée avec succès - Résumé', { 
                      pathUsed: pathToUse,
                      fileName: file.name, 
                      fileSize: file.size,
                      publicUrl: publicUrl.substring(0, 100) + '...',
                      finalUrl: finalUrl.substring(0, 100) + '...',
                      finalUrlType: urlType,
                      note: urlType === 'signed' ? 'URL signée utilisée (fallback)' : 'URL publique utilisée'
                    });
                    
                    // Réinitialiser les états et assigner l'URL
                    setImageError(false);
                    setImageLoading(true);
                    artistPhotoRetryCount.current = 0; // Réinitialiser le compteur après un nouvel upload
                    
                    // Log avant mise à jour
                    logger.info('Mise à jour formData avec artist_photo_url', { 
                      url: finalUrl.substring(0, 80) + '...',
                      urlType: urlType,
                      currentData: data.artist_photo_url ? 'exists' : 'null'
                    });
                    
                    onUpdate({ artist_photo_url: finalUrl });
                    
                    // Log après mise à jour
                    setTimeout(() => {
                      logger.info('Vérification après mise à jour', { 
                        note: 'Vérifiez localStorage et formData pour confirmer la sauvegarde',
                        url: finalUrl.substring(0, 80) + '...'
                      });
                    }, 100);
                    
                      toast({
                        title: "✅ Photo uploadée",
                        description: "Photo de l'artiste ajoutée avec succès",
                      });
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
                }}
                className="hidden"
                disabled={uploading}
              />
            </label>
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

        {/* Lien de l'œuvre (si non physique) */}
        {!data.requires_shipping && (
          <div className="space-y-2">
            <Label htmlFor="artwork_link_url">
              Lien vers l'œuvre <span className="text-muted-foreground text-sm">(si œuvre non physique)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Input
                id="artwork_link_url"
                type="url"
                placeholder="https://exemple.com/mon-œuvre ou lien vers vidéo, musique, livre numérique, etc."
                value={data.artwork_link_url || ''}
                onChange={(e) => onUpdate({ artwork_link_url: e.target.value })}
                onKeyDown={handleSpaceKeyDown}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Exemples : lien vers une vidéo YouTube, un livre numérique, une musique en streaming, une galerie en ligne, etc.
            </p>
          </div>
        )}
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
            <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group bg-muted">
              <img
                src={image}
                alt={`Artwork ${index + 1}`}
                className="w-full h-full object-cover"
                onError={async (e) => {
                  const imgElement = e.currentTarget;
                  const failedUrl = imgElement.src;
                  
                  // Limiter le nombre de tentatives pour éviter les boucles infinies
                  const MAX_RETRIES = 2;
                  const currentRetryCount = artworkImageRetryCounts.current.get(index) || 0;
                  
                  if (currentRetryCount >= MAX_RETRIES) {
                    logger.warn('Nombre maximum de tentatives atteint pour l\'image œuvre', { 
                      retryCount: currentRetryCount,
                      index,
                      url: failedUrl.substring(0, 100) + '...'
                    });
                    // Afficher un placeholder d'erreur
                    imgElement.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-2 text-center error-placeholder';
                    errorDiv.textContent = 'Erreur chargement';
                    if (!imgElement.parentElement?.querySelector('.error-placeholder')) {
                      imgElement.parentElement?.appendChild(errorDiv);
                    }
                    return;
                  }
                  
                  artworkImageRetryCounts.current.set(index, currentRetryCount + 1);
                  
                  logger.error('Erreur chargement image œuvre', { 
                    url: failedUrl.substring(0, 100) + '...',
                    index,
                    isSupabaseUrl: failedUrl.includes('.supabase.co'),
                    isSignedUrl: failedUrl.includes('/sign/'),
                    isPublicUrl: failedUrl.includes('/public/'),
                    retryAttempt: currentRetryCount + 1,
                    maxRetries: MAX_RETRIES
                  });
                  
                  // Si c'est une URL Supabase, essayer une seule stratégie de réessai
                  if (failedUrl.includes('.supabase.co') && currentRetryCount < MAX_RETRIES) {
                    // Extraire le chemin du fichier
                    const pathMatch = failedUrl.match(/product-images\/(.+?)(\?|$)/);
                    const filePath = pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : null;
                    
                    if (filePath) {
                      // Attendre un peu pour la propagation
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      
                      // Essayer une URL signée (dernière tentative)
                      try {
                        const { data: signedData, error: signedError } = await supabase.storage
                          .from("product-images")
                          .createSignedUrl(filePath, 86400);
                        
                        if (!signedError && signedData?.signedUrl) {
                          logger.info('✅ URL signée créée après réessai - œuvre', { 
                            filePath, 
                            index,
                            retryAttempt: currentRetryCount + 1
                          });
                          const newImages = [...(data.images || [])];
                          newImages[index] = signedData.signedUrl;
                          onUpdate({ images: newImages });
                          return;
                        }
                      } catch (signError) {
                        logger.error('Erreur création URL signée après réessai - œuvre', { 
                          error: signError, 
                          filePath, 
                          index,
                          retryAttempt: currentRetryCount + 1
                        });
                      }
                    }
                  }
                  
                  // Si toutes les stratégies ont échoué, afficher un placeholder d'erreur
                  imgElement.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-2 text-center error-placeholder';
                  errorDiv.textContent = 'Erreur chargement';
                  if (!imgElement.parentElement?.querySelector('.error-placeholder')) {
                    imgElement.parentElement?.appendChild(errorDiv);
                  }
                }}
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
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


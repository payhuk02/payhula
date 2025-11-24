/**
 * Utilitaire professionnel pour upload de fichiers vers Supabase Storage
 * 
 * Fonctionnalités :
 * - Validation taille et type de fichier
 * - Progress tracking pour UX optimale
 * - Gestion d'erreurs robuste
 * - Support multi-buckets
 * - Noms de fichiers uniques et sécurisés
 * 
 * @module uploadToSupabase
 */

import { supabase } from '@/integrations/supabase/client';
import { validateFileSecurity, SAFE_MIME_TYPES } from '@/lib/file-security';
import { logger } from '@/lib/logger';

/**
 * Options de configuration pour l'upload
 */
export interface UploadOptions {
  /** Nom du bucket Supabase Storage */
  bucket: string;
  
  /** Chemin optionnel dans le bucket (ex: 'products/images') */
  path?: string;
  
  /** Callback pour suivre la progression (0-100) */
  onProgress?: (progress: number) => void;
  
  /** Taille maximale en bytes (défaut: 10MB) */
  maxSizeBytes?: number;
  
  /** Types MIME autorisés */
  allowedTypes?: string[];
  
  /** Préfixe personnalisé pour le nom de fichier */
  filePrefix?: string;
}

/**
 * Résultat de l'upload
 */
export interface UploadResult {
  /** URL publique du fichier uploadé */
  url: string | null;
  
  /** Chemin complet du fichier dans le bucket */
  path: string | null;
  
  /** Erreur éventuelle */
  error: Error | null;
  
  /** Succès de l'opération */
  success: boolean;
}

/**
 * Types MIME par défaut autorisés pour les images
 */
const DEFAULT_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

/**
 * Taille maximale par défaut : 10MB
 */
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

/**
 * Génère un nom de fichier unique et sécurisé
 */
function generateUniqueFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  const baseName = prefix 
    ? `${prefix}_${timestamp}_${randomString}` 
    : `${timestamp}_${randomString}`;
  
  return `${baseName}.${fileExtension}`;
}

/**
 * Formate les bytes en taille lisible (KB, MB, GB)
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Upload un fichier vers Supabase Storage
 * 
 * @param file - Fichier à uploader
 * @param options - Options de configuration
 * @returns Résultat de l'upload avec URL publique
 * 
 * @example
 * ```typescript
 * const { url, error } = await uploadToSupabaseStorage(file, {
 *   bucket: 'product-images',
 *   path: 'services',
 *   onProgress: (progress) => setUploadProgress(progress),
 * });
 * 
 * if (error) {
 *   toast({ title: "Erreur d'upload", description: error.message });
 * } else {
 *   setImageUrl(url);
 * }
 * ```
 */
export async function uploadToSupabaseStorage(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const {
    bucket,
    path = '',
    onProgress,
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_IMAGE_TYPES,
    filePrefix,
  } = options;

  try {
    // 1. VALIDATION DE SÉCURITÉ CÔTÉ CLIENT (Magic bytes, signatures, extensions dangereuses)
    const securityValidation = await validateFileSecurity(file, allowedTypes);
    
    if (!securityValidation.isValid) {
      throw new Error(securityValidation.error || 'Fichier non valide');
    }
    
    // Avertissements de sécurité (logs mais n'arrête pas l'upload)
    if (securityValidation.warnings && securityValidation.warnings.length > 0) {
      logger.warn('File security warnings', { warnings: securityValidation.warnings, fileName: file.name });
    }

    // 2. VALIDATION BACKEND (Edge Function) - Double vérification
    try {
      // Lire les premiers 16 bytes pour la validation backend
      const firstBytes = await file.slice(0, 16).arrayBuffer();
      const base64Content = btoa(
        String.fromCharCode(...new Uint8Array(firstBytes))
      );

      const { data: { user } } = await supabase.auth.getUser();
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        'validate-file-upload',
        {
          body: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileContent: base64Content,
            allowedTypes,
            maxSizeBytes,
          },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (validationError) {
        logger.warn('Backend validation error (continuing with client validation)', { error: validationError });
        // Continuer avec la validation côté client si le backend échoue
      } else if (validationResult && !validationResult.isValid) {
        throw new Error(validationResult.error || 'Validation backend échouée');
      }
    } catch (backendError) {
      // Si la validation backend échoue (Edge Function non disponible, etc.), 
      // on continue avec la validation côté client uniquement
      logger.warn('Backend validation unavailable, using client validation only', { 
        error: backendError instanceof Error ? backendError.message : String(backendError) 
      });
    }

    // 2. Validation de la taille
    if (file.size > maxSizeBytes) {
      throw new Error(
        `Fichier trop volumineux. Maximum : ${formatFileSize(maxSizeBytes)}, actuel : ${formatFileSize(file.size)}`
      );
    }

    // 3. Validation du type MIME (double vérification)
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = allowedTypes
        .map(type => type.split('/')[1])
        .join(', ');
      throw new Error(
        `Type de fichier non supporté. Types autorisés : ${allowedExtensions}`
      );
    }

    // 4. Générer nom de fichier unique
    const fileName = generateUniqueFileName(file.name, filePrefix);
    const filePath = path ? `${path}/${fileName}` : fileName;

    // 5. Démarrer l'upload
    if (onProgress) onProgress(10);

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Ne pas écraser les fichiers existants
      });

    if (uploadError) {
      throw uploadError;
    }

    if (onProgress) onProgress(70);

    // 6. Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (onProgress) onProgress(100);

    return {
      url: publicUrl,
      path: filePath,
      error: null,
      success: true,
    };

  } catch (error) {
    logger.error('File upload error', { error, bucket, path: options.path, fileName: file.name });
    
    return {
      url: null,
      path: null,
      error: error instanceof Error ? error : new Error('Erreur inconnue lors de l\'upload'),
      success: false,
    };
  }
}

/**
 * Upload multiple fichiers en parallèle
 * 
 * @param files - Liste de fichiers à uploader
 * @param options - Options de configuration (commune à tous les fichiers)
 * @returns Liste des résultats d'upload
 * 
 * @example
 * ```typescript
 * const results = await uploadMultipleFiles(files, {
 *   bucket: 'product-images',
 *   path: 'gallery',
 * });
 * 
 * const successfulUploads = results.filter(r => r.success);
 * const urls = successfulUploads.map(r => r.url);
 * ```
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => 
    uploadToSupabaseStorage(file, options)
  );
  
  return await Promise.all(uploadPromises);
}

/**
 * Supprime un fichier du Storage Supabase
 * 
 * @param bucket - Nom du bucket
 * @param filePath - Chemin du fichier à supprimer
 * @returns Résultat de la suppression
 * 
 * @example
 * ```typescript
 * const { error } = await deleteFromSupabaseStorage('product-images', 'services/123.jpg');
 * ```
 */
export async function deleteFromSupabaseStorage(
  bucket: string,
  filePath: string
): Promise<{ error: Error | null; success: boolean }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;

    return { error: null, success: true };
    
  } catch (error) {
    logger.error('File delete error', { error, bucket, filePath });
    return {
      error: error instanceof Error ? error : new Error('Erreur lors de la suppression'),
      success: false,
    };
  }
}

/**
 * Vérifie si un bucket existe et est accessible
 * 
 * @param bucket - Nom du bucket à vérifier
 * @returns True si le bucket est accessible
 */
export async function checkBucketAccess(bucket: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });

    return !error;
  } catch {
    return false;
  }
}


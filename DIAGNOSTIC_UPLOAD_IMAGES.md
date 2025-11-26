# 🔍 Diagnostic Upload Images - Analyse Complète

## Problème identifié
L'image est uploadée mais ne s'affiche pas. Analyse du nommage des fichiers et de la sauvegarde.

## ✅ Points vérifiés

### 1. Nommage des fichiers
- **Photo artiste** : `artist/artist-photo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
- **Images œuvre** : `artist/artwork_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
- ✅ Format correct avec préfixe `artist/`
- ✅ Nom unique avec timestamp + random string

### 2. Upload vers Supabase Storage
- ✅ Utilise `supabase.storage.from("product-images").upload(fileName, file)`
- ✅ Pattern identique aux composants qui fonctionnent (`ImageUpload.tsx`)
- ✅ Vérifie `uploadData.path` après upload

### 3. Génération de l'URL publique
- ✅ Utilise `supabase.storage.from("product-images").getPublicUrl(uploadData.path)`
- ✅ Vérifie que `publicUrl` n'est pas null

### 4. Sauvegarde dans le formulaire
- ✅ `onUpdate({ artist_photo_url: publicUrl })` - Photo artiste
- ✅ `onUpdate({ images: [...(data.images || []), ...validUrls] })` - Images œuvre
- ✅ Sauvegarde automatique dans `localStorage` (draft) après 2 secondes

### 5. Sauvegarde dans la base de données
- ✅ Table `products` : `image_url` et `images` (JSONB array)
- ✅ Table `artist_products` : `artist_photo_url` (TEXT)
- ✅ Code de sauvegarde dans `CreateArtistProductWizard.tsx` ligne 248

## 🔧 Actions de diagnostic à effectuer

### Étape 1 : Vérifier les logs dans la console
1. Ouvrez la console du navigateur (F12)
2. Uploadez une image
3. Vérifiez les logs :
   - `Photo artiste uploadée avec succès` avec `url`, `path`, `fileName`, `fileSize`
   - L'URL générée doit ressembler à : `https://[project].supabase.co/storage/v1/object/public/product-images/artist/artist-photo_[timestamp]_[random].[ext]`

### Étape 2 : Vérifier le localStorage
1. Ouvrez la console (F12)
2. Tapez : `JSON.parse(localStorage.getItem('artist-product-draft'))`
3. Vérifiez que `artist_photo_url` contient une URL valide
4. Vérifiez que `images` contient un array avec les URLs

### Étape 3 : Tester l'URL directement
1. Copiez l'URL depuis les logs ou le localStorage
2. Collez-la dans un nouvel onglet du navigateur
3. Si l'image s'affiche → Le problème est dans l'affichage React
4. Si erreur 403/404 → Le problème est dans les permissions RLS

### Étape 4 : Vérifier les permissions Supabase Storage
Exécutez ce script SQL dans Supabase Dashboard → SQL Editor :

```sql
-- 1. Vérifier que le bucket est public
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- 2. Vérifier les politiques RLS
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%product-images%';

-- 3. Lister les fichiers dans artist/
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'product-images'
  AND name LIKE 'artist/%'
ORDER BY created_at DESC
LIMIT 10;
```

### Étape 5 : Vérifier la sauvegarde en base de données
Après avoir sauvegardé le produit (brouillon ou publié) :

```sql
-- Vérifier les produits artistes récents
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.images,
  ap.artist_photo_url,
  ap.artist_name,
  ap.artwork_title
FROM products p
JOIN artist_products ap ON ap.product_id = p.id
WHERE p.product_type = 'artist'
ORDER BY p.created_at DESC
LIMIT 5;
```

## 🐛 Problèmes possibles et solutions

### Problème 1 : URL générée incorrecte
**Symptôme** : L'URL dans les logs ne correspond pas au format attendu
**Solution** : Vérifier que `uploadData.path` est bien utilisé pour `getPublicUrl()`

### Problème 2 : Permissions RLS bloquées
**Symptôme** : Erreur 403 lors de l'accès direct à l'URL
**Solution** : Exécuter `fix_product_images_rls_final.sql`

### Problème 3 : Fichier non accessible publiquement
**Symptôme** : Erreur 404 lors de l'accès direct à l'URL
**Solution** : 
1. Vérifier que le bucket est `public = true`
2. Vérifier que le fichier existe dans `storage.objects`
3. Vérifier les politiques RLS pour `SELECT`

### Problème 4 : URL non sauvegardée dans le formulaire
**Symptôme** : L'URL est générée mais `data.artist_photo_url` est undefined
**Solution** : Vérifier que `onUpdate()` est bien appelé avec la bonne clé

### Problème 5 : URL non sauvegardée en base de données
**Symptôme** : L'URL est dans le localStorage mais pas en DB
**Solution** : Vérifier que `saveArtistProduct()` est bien appelé et que l'insertion réussit

## 📝 Checklist de vérification

- [ ] Les logs montrent une URL valide après upload
- [ ] L'URL est accessible directement dans le navigateur
- [ ] Le localStorage contient `artist_photo_url` avec une URL valide
- [ ] Le bucket `product-images` est public
- [ ] Les politiques RLS permettent la lecture publique
- [ ] Le fichier existe dans `storage.objects`
- [ ] L'URL est sauvegardée en base de données après publication

## 🔄 Test complet

1. **Upload photo artiste** :
   - Ouvrir la console
   - Uploader une photo
   - Vérifier les logs : URL générée
   - Vérifier localStorage : `artist_photo_url` présent
   - Tester l'URL directement dans le navigateur

2. **Upload images œuvre** :
   - Uploader plusieurs images
   - Vérifier les logs : URLs générées
   - Vérifier localStorage : `images` array avec URLs
   - Tester chaque URL directement

3. **Sauvegarde** :
   - Cliquer sur "Enregistrer comme brouillon"
   - Vérifier en DB que les données sont sauvegardées
   - Recharger la page
   - Vérifier que les images s'affichent depuis le localStorage

4. **Publication** :
   - Compléter le formulaire
   - Publier le produit
   - Vérifier en DB que `artist_photo_url` et `images` sont sauvegardés
   - Vérifier que les images s'affichent sur la page de détail




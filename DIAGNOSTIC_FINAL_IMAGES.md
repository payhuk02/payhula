# 🔍 Diagnostic Final - Images Non Affichées

## Problème
L'image est uploadée avec succès, mais elle ne s'affiche pas dans le navigateur, même avec une URL signée.

## Causes Possibles

### 1. Politiques RLS Incorrectes
Même si le bucket est marqué comme "Public", les politiques RLS peuvent bloquer l'accès.

### 2. Politiques RLS Conflictuelles
Plusieurs politiques peuvent entrer en conflit et bloquer l'accès.

### 3. Problème de Timing
Le fichier peut ne pas être immédiatement accessible après l'upload.

## Solution : Vérifier et Corriger les Politiques RLS

### Étape 1 : Vérifier les Politiques Actuelles

Exécutez ce script dans Supabase Dashboard → SQL Editor :

```sql
-- Voir toutes les politiques pour product-images
SELECT 
  policyname,
  cmd as operation,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%product-images%'
ORDER BY policyname;
```

### Étape 2 : Vérifier le Statut du Bucket

```sql
-- Vérifier que le bucket est public
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';
```

### Étape 3 : Corriger les Politiques

Exécutez ce script pour corriger les politiques :

```sql
-- 1. S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Supprimer TOUTES les politiques existantes pour product-images
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname LIKE '%product-images%'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
  END LOOP;
END $$;

-- 3. Créer UNE SEULE politique de lecture publique (la plus simple possible)
CREATE POLICY "product-images - Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Créer une politique d'upload pour les utilisateurs authentifiés
CREATE POLICY "product-images - Upload authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 5. Créer une politique de mise à jour
CREATE POLICY "product-images - Update authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Créer une politique de suppression
CREATE POLICY "product-images - Delete authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

### Étape 4 : Vérifier que les Politiques sont Actives

```sql
-- Vérifier les politiques créées
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%product-images%'
ORDER BY policyname;
```

Vous devriez voir exactement 4 politiques :
1. `product-images - Public read access` (SELECT, public)
2. `product-images - Upload authenticated` (INSERT, authenticated)
3. `product-images - Update authenticated` (UPDATE, authenticated)
4. `product-images - Delete authenticated` (DELETE, authenticated)

## Test

1. Rechargez complètement la page (Ctrl+F5)
2. Uploadez une nouvelle image
3. L'image devrait s'afficher

## Si le Problème Persiste

1. **Testez l'URL directement** :
   - Copiez l'URL depuis les logs de la console
   - Collez-la dans un nouvel onglet du navigateur
   - Si l'image s'affiche → problème de timing/cache dans l'application
   - Si l'image ne s'affiche pas → problème de permissions Supabase

2. **Vérifiez les logs Supabase** :
   - Allez dans Supabase Dashboard → Logs
   - Cherchez les erreurs liées à Storage

3. **Contactez le support Supabase** :
   - Si les politiques sont correctes mais que l'image ne s'affiche toujours pas, il peut y avoir un problème avec votre projet Supabase










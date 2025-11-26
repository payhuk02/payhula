# 🔧 Guide de dépannage - Upload images artistes

## ❌ Erreur : "mime type application/json is not supported" (400 Bad Request)

### ✅ Étapes de vérification

#### 1. Vérifier que la migration a été exécutée

Dans Supabase Dashboard > SQL Editor, exécutez :

```sql
-- Vérifier le statut du bucket
SELECT id, name, public, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- Vérifier les politiques RLS
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%product-images%';
```

**Résultats attendus :**
- ✅ `public = true`
- ✅ `allowed_mime_types` contient `image/jpeg`, `image/png`, `image/webp`
- ✅ 4 politiques au total (Upload, Read, Update, Delete)

#### 2. Si la migration n'a pas été exécutée

Exécutez la migration dans Supabase SQL Editor :
- Fichier : `supabase/migrations/20250301_final_fix_product_images_access.sql`
- Copiez tout le contenu et exécutez-le

#### 3. Vérifier l'authentification

Dans la console du navigateur (F12), cherchez :
```
[INFO] Upload photo artiste - Détails
```

Vérifiez que :
- ✅ Un `session` est présent
- ✅ Le `contentType` est correct (image/png, image/jpeg, etc.)
- ✅ Le `fileType` correspond au fichier

#### 4. Vérifier les logs d'erreur détaillés

Après un upload qui échoue, dans la console :
```
[ERROR] Erreur upload photo artiste
```

Notez :
- `errorMessage` : Le message d'erreur complet
- `errorStatus` : Le code HTTP (devrait être 400)
- `contentType` : Le Content-Type détecté

### 🐛 Causes possibles

#### Cause 1 : Politiques RLS manquantes ou incorrectes

**Symptôme :** Erreur 400 avec "mime type application/json"

**Solution :**
1. Exécutez la migration `20250301_final_fix_product_images_access.sql`
2. Attendez 1-2 minutes (propagation Supabase)
3. Réessayez l'upload

#### Cause 2 : Type MIME non autorisé dans le bucket

**Symptôme :** Erreur 400 spécifique au type de fichier

**Solution :**
```sql
-- Vérifier les types autorisés
SELECT allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- Si besoin, mettre à jour
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/jpg', 'image/png', 
  'image/webp', 'image/gif', 'image/svg+xml'
]
WHERE id = 'product-images';
```

#### Cause 3 : Utilisateur non authentifié

**Symptôme :** Erreur d'authentification dans les logs

**Solution :**
1. Déconnectez-vous et reconnectez-vous
2. Vérifiez que la session est active dans Supabase Dashboard > Authentication

#### Cause 4 : Problème de Content-Type

**Symptôme :** Le fichier a un type MIME incorrect

**Solution :** Le code a été corrigé pour détecter automatiquement le Content-Type. Si le problème persiste :
- Vérifiez que le fichier est bien une image
- Essayez avec un autre format (PNG au lieu de JPG, etc.)

### 📋 Checklist de vérification rapide

- [ ] La migration `20250301_final_fix_product_images_access.sql` a été exécutée
- [ ] Le bucket `product-images` est public (`public = true`)
- [ ] 4 politiques RLS existent pour `product-images`
- [ ] L'utilisateur est authentifié (session active)
- [ ] Les types MIME autorisés incluent le format de l'image
- [ ] Les logs montrent un `contentType` correct
- [ ] Aucune erreur CORS dans la console

### 🔍 Script de diagnostic complet

Exécutez ce script dans Supabase SQL Editor pour un diagnostic complet :

```sql
-- Voir le fichier : supabase/migrations/20250301_diagnose_upload_issue.sql
```

### 📞 Si le problème persiste

Partagez :
1. Le résultat complet du script de diagnostic
2. Les logs de la console du navigateur (F12 > Console)
3. Le type de fichier que vous essayez d'uploader
4. Une capture d'écran de l'erreur


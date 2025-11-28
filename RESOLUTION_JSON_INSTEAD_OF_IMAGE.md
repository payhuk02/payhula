# 🔧 RÉSOLUTION - Supabase retourne JSON au lieu d'une image

**Date** : 30 Janvier 2025  
**Problème** : Le serveur répond avec HTTP 200 mais le Content-Type est `application/json` au lieu d'une image

---

## 🔍 DIAGNOSTIC

### Symptômes

- ✅ Upload réussi (pas d'erreur lors de l'upload)
- ✅ HTTP 200 (succès)
- ❌ Content-Type : `application/json` au lieu de `image/jpeg`, `image/png`, etc.
- ❌ Image ne s'affiche pas

### Cause probable

Supabase Storage retourne une réponse JSON d'erreur au lieu de l'image. Cela peut arriver si :

1. **Le fichier n'existe pas** à l'URL générée
2. **Le chemin utilisé pour `getPublicUrl()` est incorrect**
3. **Les permissions bloquent l'accès** même si le fichier existe
4. **Le fichier a été supprimé** après l'upload

---

## ✅ CORRECTIONS APPORTÉES

### 1. Utilisation du chemin exact retourné par l'upload

**Fichier** : `src/utils/uploadToSupabase.ts`

**Avant** :
```typescript
const { data: { publicUrl } } = supabase.storage
  .from(bucket)
  .getPublicUrl(filePath); // Utilisait le chemin construit
```

**Après** :
```typescript
const actualPath = data.path; // Utilise le chemin exact retourné par Supabase
const { data: { publicUrl } } = supabase.storage
  .from(bucket)
  .getPublicUrl(actualPath);
```

**Pourquoi** : Le chemin retourné par Supabase lors de l'upload peut être différent du chemin construit (normalisation, encodage, etc.).

### 2. Vérification du Content-Type après upload

Le code vérifie maintenant que l'URL retourne bien une image :
- Si HTTP 200 mais pas `image/*` → Détecte le problème immédiatement
- Lit la réponse JSON pour afficher l'erreur exacte de Supabase
- Lance une exception avec un message clair

### 3. Logs améliorés

- Log du chemin retourné par Supabase
- Log de l'URL publique générée
- Log de l'erreur JSON si le Content-Type est incorrect

---

## 🧪 DIAGNOSTIC

### Étape 1 : Vérifier les logs de la console

1. **Ouvrez les DevTools** (F12)
2. **Onglet Console**
3. **Cherchez les logs** :
   - `File uploaded, path returned by Supabase` → Vérifiez le `actualPath`
   - `Public URL generated` → Vérifiez l'URL générée
   - `URL returns JSON instead of image` → Erreur détectée

### Étape 2 : Vérifier le fichier dans Supabase

1. **Supabase Dashboard** → **Storage** → **product-images** → **artist/**
2. **Cherchez le fichier** avec le nom indiqué dans les logs
3. **Vérifiez** :
   - Le fichier existe ✅
   - La taille > 0 ✅
   - Le type MIME est une image ✅

### Étape 3 : Comparer les chemins

1. **Chemin dans les logs** (`actualPath`) : ex. `artist/artist-photo_123456_abc.png`
2. **Chemin dans Supabase Dashboard** : Vérifiez qu'ils correspondent
3. **Si différents** → Le problème vient de la génération du chemin

### Étape 4 : Tester l'URL directement

1. **Copiez l'URL** depuis les logs ou le message d'erreur
2. **Ouvrez dans un nouvel onglet**
3. **Si vous voyez du JSON** → Lisez le message d'erreur dans le JSON
4. **Si vous voyez l'image** → Problème côté code React

---

## 🔧 SOLUTIONS

### Solution 1 : Vérifier que le fichier existe

Si le fichier n'existe pas dans Supabase Dashboard :

1. **L'upload a peut-être échoué silencieusement**
2. **Réessayez d'uploader** l'image
3. **Vérifiez les logs d'upload** pour voir s'il y a eu une erreur

### Solution 2 : Vérifier les permissions

Si le fichier existe mais retourne du JSON :

1. **Exécutez le script de correction** : `fix_product_images_permissions.sql`
2. **Vérifiez avec le diagnostic** : `diagnostic_product_images_permissions.sql`
3. **Assurez-vous que** :
   - Le bucket est public
   - La politique SELECT pour public existe

### Solution 3 : Vérifier le chemin

Si les chemins ne correspondent pas :

1. **Vérifiez les logs** pour voir le `actualPath` retourné par Supabase
2. **Comparez avec** le chemin dans le Dashboard
3. **Si différents** → Utilisez toujours `data.path` (déjà corrigé dans le code)

### Solution 4 : Vider le cache et réessayer

1. **Videz le cache du navigateur** (Ctrl+Shift+R)
2. **Réessayez d'uploader** l'image
3. **Vérifiez les nouveaux logs** pour voir si le problème persiste

---

## 📋 CHECKLIST DE RÉSOLUTION

- [ ] Le fichier existe dans Supabase Dashboard → Storage → product-images → artist/
- [ ] Le chemin dans les logs correspond au chemin dans le Dashboard
- [ ] Le bucket est public (vérifié avec le script de diagnostic)
- [ ] La politique SELECT pour public existe (vérifiée avec le script de diagnostic)
- [ ] L'URL générée est correcte (vérifiée dans les logs)
- [ ] Le cache du navigateur a été vidé
- [ ] Un nouveau fichier a été uploadé pour tester

---

## 🚨 SI LE PROBLÈME PERSISTE

### Option 1 : Vérifier les logs Supabase

1. **Supabase Dashboard** → **Logs** → **Storage**
2. **Cherchez les erreurs** liées au fichier
3. **Vérifiez les tentatives d'accès**

### Option 2 : Tester avec curl

```bash
# Remplacer [URL] par l'URL de votre image
curl -I [URL]

# Si vous voyez Content-Type: application/json, lisez le JSON :
curl [URL]
```

### Option 3 : Contacter le support Supabase

Si toutes les vérifications sont correctes mais que le problème persiste, contactez le support Supabase avec :
- L'URL qui retourne du JSON
- Les logs d'upload
- Les résultats du script de diagnostic
- Le message d'erreur JSON exact

---

## ✅ AMÉLIORATIONS DU CODE

Les améliorations suivantes ont été apportées :

1. ✅ **Utilisation de `data.path`** : Utilise le chemin exact retourné par Supabase
2. ✅ **Vérification Content-Type** : Détecte immédiatement si ce n'est pas une image
3. ✅ **Lecture de l'erreur JSON** : Affiche l'erreur exacte de Supabase
4. ✅ **Logs détaillés** : Facilite le diagnostic
5. ✅ **Messages d'erreur clairs** : Indique le problème exact

---

**Prochaine étape** : Vérifiez les logs de la console pour voir le chemin exact et l'URL générée, puis comparez avec le fichier dans Supabase Dashboard.







# 🚨 CORRECTION IMMÉDIATE - Erreur "mime type application/json is not supported"

## ❌ PROBLÈME

L'erreur **"mime type application/json is not supported"** apparaît car Supabase retourne du JSON (erreur) au lieu du fichier image.  
**Cause**: Les politiques RLS du bucket `product-images` bloquent l'accès public.

---

## ✅ SOLUTION (5 MINUTES)

### 1️⃣ Ouvrir Supabase Dashboard

1. Allez sur **https://app.supabase.com**
2. Sélectionnez votre projet **Payhuk**
3. Cliquez sur **"SQL Editor"** dans le menu latéral

### 2️⃣ Copier-Coller la Migration

1. Ouvrez le fichier : `supabase/migrations/20250301_final_fix_product_images_access.sql`
2. **Sélectionnez TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Collez-le** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"** (ou Ctrl+Enter)

### 3️⃣ Vérifier le Résultat

Vous devriez voir dans les résultats :
```
✅ Bucket product-images est PUBLIC
✅ Politique lecture publique: EXISTE
✅ CONFIGURATION CORRECTE !
```

### 4️⃣ Vérifier le Bucket est Public

1. Menu → **Storage** → **Buckets**
2. Cliquez sur **`product-images`**
3. Vérifiez que **"Public bucket"** est **activé** (toggle vert)
4. Si non, activez-le et sauvegardez

### 5️⃣ Attendre et Tester

1. ⏰ **Attendez 2-3 minutes** (propagation Supabase)
2. **Rechargez votre application** (F5)
3. **Réessayez d'uploader une image**
4. ✅ L'image devrait maintenant s'afficher !

---

## 📋 MIGRATION À EXÉCUTER

**Fichier**: `supabase/migrations/20250301_final_fix_product_images_access.sql`

Cette migration :
- ✅ Rend le bucket `product-images` public
- ✅ Supprime toutes les anciennes politiques conflictuelles
- ✅ Crée 4 politiques RLS correctes
- ✅ Vérifie automatiquement la configuration

---

## 🔍 SI ÇA NE MARCHE PAS

1. Vérifiez que la migration s'est bien exécutée (aucune erreur rouge)
2. Vérifiez que le bucket est bien marqué "Public" dans le dashboard
3. Attendez encore 2-3 minutes (propagation Supabase)
4. Testez une URL directement dans votre navigateur

---

**Dernière mise à jour**: 1 Mars 2025



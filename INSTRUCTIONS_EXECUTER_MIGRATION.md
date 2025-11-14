# 🔧 Instructions pour Exécuter la Migration

## 📋 Problème

L'erreur `400 Bad Request` sur `get_user_product_recommendations` indique que la fonction n'existe pas dans la base de données.

## ✅ Solution

Une nouvelle migration a été créée : `20250202_fix_get_user_product_recommendations.sql`

## 🚀 Méthode 1 : Via Supabase CLI (Recommandé)

### Étape 1 : Vérifier la connexion Supabase

```bash
# Vérifier que vous êtes connecté à Supabase
supabase status

# Si vous n'êtes pas connecté, lier votre projet
supabase link --project-ref your-project-id
```

### Étape 2 : Pousser la migration

```bash
# Pousser toutes les migrations (y compris la nouvelle)
supabase db push

# Ou appliquer uniquement la nouvelle migration
supabase migration up
```

## 🚀 Méthode 2 : Via Supabase Dashboard (Manuelle)

### Étape 1 : Accéder au SQL Editor

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet : `your-project-id`
3. Aller dans **SQL Editor** (menu de gauche)
4. Cliquer sur **New Query**

### Étape 2 : Copier le contenu de la migration

1. Ouvrir le fichier : `supabase/migrations/20250202_fix_get_user_product_recommendations.sql`
2. Copier tout le contenu (Ctrl+A, Ctrl+C)

### Étape 3 : Exécuter le script

1. Coller le contenu dans le SQL Editor de Supabase
2. Cliquer sur **Run** (ou Ctrl+Enter)
3. Vérifier que le message de succès s'affiche

### Étape 4 : Vérifier que la fonction est créée

Exécuter cette requête pour vérifier :

```sql
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_product_recommendations';
```

Vous devriez voir la fonction listée.

## 🚀 Méthode 3 : Exécuter Directement le Script SQL

### Option A : Via Supabase Dashboard

1. Aller sur https://supabase.com/dashboard/project/your-project-id/sql/new
2. Copier le contenu de `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql`
3. Coller dans l'éditeur
4. Cliquer sur **Run**

### Option B : Via Supabase CLI

```bash
# Exécuter le script directement
supabase db execute --file FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql
```

## ✅ Vérification

Après avoir exécuté la migration :

1. **Recharger la page marketplace** dans le navigateur
2. **Vérifier la console** :
   - ✅ Plus d'erreur 400
   - ✅ Plus de warning "function does not exist"
   - ✅ Les recommandations peuvent s'afficher (si l'utilisateur est connecté)

3. **Tester la fonction manuellement** (optionnel) :

```sql
-- Remplacer USER_ID par un UUID valide d'un utilisateur
SELECT * FROM get_user_product_recommendations('USER_ID_HERE'::UUID, 6);
```

## 🔍 Dépannage

### Si la migration échoue

1. **Vérifier les tables existent :**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('orders', 'order_items', 'products', 'stores');
   ```

2. **Vérifier les colonnes existent :**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'orders'
   AND column_name IN ('customer_id', 'payment_status');
   ```

3. **Si des colonnes manquent :**
   - Exécuter les migrations manquantes
   - Ou créer les colonnes manuellement

### Si l'erreur persiste après la migration

1. **Vérifier que la fonction est créée :**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_user_product_recommendations';
   ```

2. **Vérifier les permissions :**
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.routine_privileges
   WHERE routine_name = 'get_user_product_recommendations';
   ```

3. **Vider le cache du navigateur :**
   - Appuyer sur Ctrl+Shift+R (Windows/Linux)
   - Ou Cmd+Shift+R (Mac)

## 📝 Notes

- La fonction utilise `SECURITY DEFINER`, donc elle bypasse RLS
- La fonction retourne des recommandations populaires si l'utilisateur n'a pas d'historique d'achat
- La fonction gère les erreurs de manière défensive (ne plante pas si des tables manquent)

## 🔗 Fichiers

- Migration : `supabase/migrations/20250202_fix_get_user_product_recommendations.sql`
- Script SQL : `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql`
- Instructions : `INSTRUCTIONS_EXECUTER_MIGRATION.md` (ce fichier)






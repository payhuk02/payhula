# 🚨 CORRECTION URGENTE : Erreur "currency column does not exist"

## ⚡ Solution en 3 étapes (5 minutes)

### Étape 1: Exécuter le script SQL dans Supabase

1. **Ouvrez Supabase Dashboard** :
   - https://supabase.com/dashboard
   - Connectez-vous
   - Sélectionnez votre projet **Payhula**

2. **Ouvrez le SQL Editor** :
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"** (ou le bouton "+" en haut)

3. **Copiez et exécutez ce script SQL** :

```sql
-- Ajouter la colonne currency
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';

-- Mettre à jour les valeurs existantes
UPDATE public.transactions 
SET currency = 'XOF' 
WHERE currency IS NULL;

-- Rendre la colonne obligatoire
ALTER TABLE public.transactions 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'XOF';

-- Ajouter les autres colonnes nécessaires
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moneroo',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;
```

4. **Cliquez sur "Run"** (ou appuyez sur `Ctrl+Enter` / `Cmd+Enter`)

5. **Vérifiez le résultat** :
   - Vous devriez voir "Success. No rows returned" ou un message de succès
   - S'il y a une erreur, copiez le message et contactez le support

### Étape 2: Rafraîchir le cache Supabase

1. Dans Supabase Dashboard, allez dans **Settings** (icône d'engrenage ⚙️)
2. Cliquez sur **"API"** dans le menu de gauche
3. Faites défiler jusqu'à la section **"Schema Cache"**
4. Cliquez sur **"Refresh schema cache"** ou **"Regenerate types"**
5. Attendez quelques secondes

### Étape 3: Vider le cache du navigateur

1. Sur la page du marketplace, appuyez sur **`Ctrl+Shift+R`** (Windows/Linux) ou **`Cmd+Shift+R`** (Mac)
2. OU utilisez une **fenêtre de navigation privée** (Ctrl+Shift+N)
3. Retournez sur https://payhula.vercel.app/marketplace
4. Testez à nouveau l'achat d'un produit

## ✅ Vérification

Pour vérifier que la colonne existe, exécutez cette requête SQL dans Supabase :

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name = 'currency';
```

**Résultat attendu** :
```
column_name | data_type | is_nullable | column_default
currency    | text      | NO          | 'XOF'::text
```

## 🆘 Si ça ne fonctionne pas

1. **Vérifiez les logs Supabase** :
   - Allez dans **Logs** → **Postgres Logs**
   - Cherchez des erreurs liées à la table `transactions`

2. **Vérifiez que la table existe** :
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'transactions';
   ```
   Si aucune ligne n'est retournée, la table n'existe pas. Contactez le support.

3. **Contactez le support** :
   - Fournissez le message d'erreur exact
   - Fournissez une capture d'écran de l'erreur SQL (si applicable)

## 📁 Fichiers disponibles

- **`FIX_CURRENCY_COLUMN.sql`** : Script SQL complet à la racine du projet
- **`supabase/migrations/20250201_fix_transactions_currency_immediate.sql`** : Migration complète
- **`GUIDE_CORRECTION_ERREUR_CURRENCY.md`** : Guide détaillé

## 🎯 Résumé

**Le problème** : La colonne `currency` n'existe pas dans la table `transactions`

**La solution** : Exécuter le script SQL ci-dessus dans Supabase Dashboard

**Le temps** : 5 minutes maximum

---

**⚠️ IMPORTANT** : Cette correction doit être faite dans Supabase Dashboard. Les changements de code ne suffisent pas, la base de données doit être modifiée.



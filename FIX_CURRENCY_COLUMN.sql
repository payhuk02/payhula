-- ============================================================
-- SOLUTION RAPIDE : Ajouter la colonne currency
-- ============================================================
-- INSTRUCTIONS:
-- 1. Ouvrez Supabase Dashboard → SQL Editor
-- 2. Copiez TOUT ce fichier
-- 3. Collez dans l'éditeur SQL
-- 4. Cliquez sur "Run" (ou Ctrl+Enter)
-- ============================================================

-- Étape 1: Ajouter la colonne currency (si elle n'existe pas)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF';

-- Étape 2: Mettre à jour les valeurs NULL (si la table contient déjà des données)
UPDATE public.transactions 
SET currency = 'XOF' 
WHERE currency IS NULL;

-- Étape 3: Rendre la colonne NOT NULL
ALTER TABLE public.transactions 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'XOF';

-- Étape 4: Ajouter les autres colonnes essentielles (si elles n'existent pas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moneroo',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Étape 5: Ajouter les colonnes PayDunya (si elles n'existent pas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS paydunya_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paydunya_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS paydunya_payment_method TEXT,
ADD COLUMN IF NOT EXISTS paydunya_response JSONB;

-- Étape 6: Vérifier que la colonne existe
SELECT 
  '✅ Colonne currency créée avec succès!' as result,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name = 'currency';

-- ============================================================
-- IMPORTANT: Après avoir exécuté ce script
-- ============================================================
-- 1. Rafraîchissez le cache du schéma dans Supabase Dashboard:
--    Settings → API → "Refresh schema cache"
-- 
-- 2. Videz le cache de votre navigateur (Ctrl+Shift+R)
--
-- 3. Testez à nouveau le paiement sur le marketplace
-- ============================================================


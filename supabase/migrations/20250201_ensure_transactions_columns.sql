-- Migration: Assurer que toutes les colonnes nécessaires existent dans la table transactions
-- Date: 1 Février 2025
-- Description: Ajoute toutes les colonnes manquantes pour le support complet des paiements Moneroo et PayDunya

DO $$
BEGIN
  -- Vérifier et ajouter la colonne currency si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN currency TEXT NOT NULL DEFAULT 'XOF';
    RAISE NOTICE 'Colonne currency ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter la colonne payment_provider si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN payment_provider TEXT DEFAULT 'moneroo' CHECK (payment_provider IN ('moneroo', 'paydunya'));
    RAISE NOTICE 'Colonne payment_provider ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter les colonnes PayDunya si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'paydunya_transaction_id'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN paydunya_transaction_id TEXT;
    RAISE NOTICE 'Colonne paydunya_transaction_id ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'paydunya_checkout_url'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN paydunya_checkout_url TEXT;
    RAISE NOTICE 'Colonne paydunya_checkout_url ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'paydunya_payment_method'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN paydunya_payment_method TEXT;
    RAISE NOTICE 'Colonne paydunya_payment_method ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'paydunya_response'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN paydunya_response JSONB;
    RAISE NOTICE 'Colonne paydunya_response ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter les colonnes Moneroo refund si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'moneroo_refund_id'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN moneroo_refund_id TEXT;
    RAISE NOTICE 'Colonne moneroo_refund_id ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'moneroo_refund_amount'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN moneroo_refund_amount NUMERIC;
    RAISE NOTICE 'Colonne moneroo_refund_amount ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'moneroo_refund_reason'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN moneroo_refund_reason TEXT;
    RAISE NOTICE 'Colonne moneroo_refund_reason ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN refunded_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne refunded_at ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter les colonnes customer si elles n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN customer_email TEXT;
    RAISE NOTICE 'Colonne customer_email ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN customer_name TEXT;
    RAISE NOTICE 'Colonne customer_name ajoutée à la table transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN customer_phone TEXT;
    RAISE NOTICE 'Colonne customer_phone ajoutée à la table transactions';
  END IF;

  -- Vérifier et ajouter la colonne metadata si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.transactions 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Colonne metadata ajoutée à la table transactions';
  END IF;

  -- Créer les index pour les nouvelles colonnes si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND indexname = 'idx_transactions_paydunya_id'
  ) THEN
    CREATE INDEX idx_transactions_paydunya_id ON public.transactions(paydunya_transaction_id) WHERE paydunya_transaction_id IS NOT NULL;
    RAISE NOTICE 'Index idx_transactions_paydunya_id créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND indexname = 'idx_transactions_payment_provider'
  ) THEN
    CREATE INDEX idx_transactions_payment_provider ON public.transactions(payment_provider);
    RAISE NOTICE 'Index idx_transactions_payment_provider créé';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'transactions' 
    AND indexname = 'idx_transactions_currency'
  ) THEN
    CREATE INDEX idx_transactions_currency ON public.transactions(currency);
    RAISE NOTICE 'Index idx_transactions_currency créé';
  END IF;

END $$;

-- Commentaires pour documentation
COMMENT ON COLUMN public.transactions.currency IS 'Devise de la transaction (XOF par défaut)';
COMMENT ON COLUMN public.transactions.payment_provider IS 'Provider de paiement utilisé (moneroo ou paydunya)';
COMMENT ON COLUMN public.transactions.paydunya_transaction_id IS 'ID de transaction PayDunya';
COMMENT ON COLUMN public.transactions.paydunya_checkout_url IS 'URL de checkout PayDunya';
COMMENT ON COLUMN public.transactions.paydunya_payment_method IS 'Méthode de paiement PayDunya utilisée';
COMMENT ON COLUMN public.transactions.paydunya_response IS 'Réponse complète de l''API PayDunya';
COMMENT ON COLUMN public.transactions.moneroo_refund_id IS 'ID de remboursement Moneroo';
COMMENT ON COLUMN public.transactions.moneroo_refund_amount IS 'Montant du remboursement Moneroo';
COMMENT ON COLUMN public.transactions.moneroo_refund_reason IS 'Raison du remboursement Moneroo';
COMMENT ON COLUMN public.transactions.refunded_at IS 'Date et heure du remboursement';
COMMENT ON COLUMN public.transactions.metadata IS 'Métadonnées JSONB de la transaction (inclut userId pour RLS)';


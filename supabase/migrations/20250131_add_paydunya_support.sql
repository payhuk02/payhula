-- Migration: Ajout du support PayDunya dans les transactions
-- Date: 31 Janvier 2025
-- Description: Ajoute les colonnes nécessaires pour supporter PayDunya dans la table transactions

-- Ajouter les colonnes PayDunya à la table transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'moneroo' CHECK (payment_provider IN ('moneroo', 'paydunya')),
ADD COLUMN IF NOT EXISTS paydunya_invoice_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS paydunya_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paydunya_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS paydunya_payment_method TEXT,
ADD COLUMN IF NOT EXISTS paydunya_response JSONB;

-- Renommer les colonnes Moneroo pour plus de clarté (optionnel, commenté pour éviter de casser l'existant)
-- ALTER TABLE public.transactions
-- RENAME COLUMN moneroo_transaction_id TO payment_transaction_id;
-- ALTER TABLE public.transactions
-- RENAME COLUMN moneroo_checkout_url TO payment_checkout_url;
-- ALTER TABLE public.transactions
-- RENAME COLUMN moneroo_payment_method TO payment_method;
-- ALTER TABLE public.transactions
-- RENAME COLUMN moneroo_response TO payment_response;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_transactions_paydunya_invoice_token ON public.transactions(paydunya_invoice_token) WHERE paydunya_invoice_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_paydunya_id ON public.transactions(paydunya_transaction_id) WHERE paydunya_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_payment_provider ON public.transactions(payment_provider);

-- Commentaires
COMMENT ON COLUMN public.transactions.payment_provider IS 'Provider de paiement utilisé (moneroo ou paydunya)';
COMMENT ON COLUMN public.transactions.paydunya_invoice_token IS 'Token de facture PayDunya pour le suivi';
COMMENT ON COLUMN public.transactions.paydunya_transaction_id IS 'ID de transaction PayDunya';
COMMENT ON COLUMN public.transactions.paydunya_checkout_url IS 'URL de checkout PayDunya';
COMMENT ON COLUMN public.transactions.paydunya_payment_method IS 'Méthode de paiement utilisée (mobile_money, credit_card, etc.)';


-- Migration: Correction RLS pour permettre aux clients de créer des transactions
-- Date: 31 Janvier 2025
-- Description: Ajoute des policies RLS pour permettre aux clients de créer leurs propres transactions lors d'achats
-- Note: Utilise customer_email et auth.uid() pour identifier les clients (pas customer_id car peut ne pas exister)

-- ============================================================
-- VÉRIFIER SI customer_id EXISTE DANS LA TABLE
-- ============================================================

DO $$
BEGIN
  -- Vérifier si la colonne customer_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'customer_id'
  ) THEN
    RAISE NOTICE 'La colonne customer_id n''existe pas dans la table transactions, utilisation de customer_email uniquement';
  END IF;
END $$;

-- ============================================================
-- RLS POLICIES POUR CLIENTS (CUSTOMERS)
-- ============================================================

-- Policy: Les clients peuvent créer des transactions pour leurs propres achats
-- Utilise customer_email pour identifier le client (plus fiable que customer_id)
CREATE POLICY "Customers can create transactions for their purchases"
  ON public.transactions FOR INSERT
  WITH CHECK (
    -- L'utilisateur est authentifié
    auth.uid() IS NOT NULL
    AND (
      -- Le customer_email correspond à l'email de l'utilisateur authentifié
      (customer_email IS NOT NULL AND customer_email = (
        SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
      ))
      OR
      -- Ou l'userId est dans les metadata
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      OR
      -- Ou l'utilisateur est dans la table customers avec le même store_id (si la table existe)
      (
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers')
        AND EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.user_id = auth.uid()
          AND c.store_id = transactions.store_id
        )
      )
    )
  );

-- Policy: Les clients peuvent voir leurs propres transactions
CREATE POLICY "Customers can view their own transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Le customer_email correspond à l'email de l'utilisateur authentifié
      (customer_email IS NOT NULL AND customer_email = (
        SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
      ))
      OR
      -- Ou l'userId est dans les metadata
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      OR
      -- Ou l'utilisateur est dans la table customers avec le même store_id (si la table existe)
      (
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers')
        AND EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.user_id = auth.uid()
          AND c.store_id = transactions.store_id
        )
      )
      -- Si customer_id existe, l'utiliser aussi (vérification conditionnelle)
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'transactions' 
          AND column_name = 'customer_id'
        )
        AND customer_id IS NOT NULL 
        AND customer_id = auth.uid()
      )
    )
  );

-- Policy: Les clients peuvent mettre à jour leurs propres transactions (statut seulement)
-- Cette policy permet aux clients de mettre à jour le statut de leurs transactions
-- (par exemple, lors de l'annulation depuis la page Cancel)
CREATE POLICY "Customers can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Le customer_email correspond à l'email de l'utilisateur authentifié
      (customer_email IS NOT NULL AND customer_email = (
        SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
      ))
      OR
      -- Ou l'userId est dans les metadata
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      -- Si customer_id existe, l'utiliser aussi (vérification conditionnelle)
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'transactions' 
          AND column_name = 'customer_id'
        )
        AND customer_id IS NOT NULL 
        AND customer_id = auth.uid()
      )
    )
    -- Seulement pour les statuts "pending" ou "processing" (pas de modification après completion)
    AND status IN ('pending', 'processing', 'cancelled')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Le customer_email correspond à l'email de l'utilisateur authentifié
      (customer_email IS NOT NULL AND customer_email = (
        SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
      ))
      OR
      -- Ou l'userId est dans les metadata
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      -- Si customer_id existe, l'utiliser aussi (vérification conditionnelle)
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'transactions' 
          AND column_name = 'customer_id'
        )
        AND customer_id IS NOT NULL 
        AND customer_id = auth.uid()
      )
    )
  );

-- ============================================================
-- RLS POLICIES POUR TRANSACTION_LOGS
-- ============================================================

-- Policy: Les clients peuvent voir les logs de leurs propres transactions
CREATE POLICY "Customers can view their own transaction logs"
  ON public.transaction_logs FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_logs.transaction_id
      AND (
        -- Le customer_email correspond à l'email de l'utilisateur authentifié
        (t.customer_email IS NOT NULL AND t.customer_email = (
          SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1
        ))
        OR
        -- Ou l'userId est dans les metadata
        (t.metadata->>'userId' IS NOT NULL AND (t.metadata->>'userId')::text = auth.uid()::text)
        -- Si customer_id existe, l'utiliser aussi (vérification conditionnelle)
        OR (
          EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'customer_id'
          )
          AND t.customer_id IS NOT NULL 
          AND t.customer_id = auth.uid()
        )
      )
    )
  );

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON POLICY "Customers can create transactions for their purchases" 
  ON public.transactions IS 'Permet aux clients authentifiés de créer des transactions pour leurs propres achats';

COMMENT ON POLICY "Customers can view their own transactions" 
  ON public.transactions IS 'Permet aux clients de voir leurs propres transactions';

COMMENT ON POLICY "Customers can update their own transactions" 
  ON public.transactions IS 'Permet aux clients de mettre à jour leurs propres transactions (statut seulement)';

COMMENT ON POLICY "Customers can view their own transaction logs" 
  ON public.transaction_logs IS 'Permet aux clients de voir les logs de leurs propres transactions';


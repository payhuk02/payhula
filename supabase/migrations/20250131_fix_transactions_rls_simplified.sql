-- Migration: Correction RLS pour permettre aux clients de créer des transactions (Version Simplifiée)
-- Date: 31 Janvier 2025
-- Description: Ajoute des policies RLS simplifiées qui fonctionnent avec la structure réelle de la table
-- Note: Utilise uniquement auth.uid() et metadata pour identifier les clients

-- ============================================================
-- VÉRIFIER ET CRÉER LA TABLE transaction_logs SI NÉCESSAIRE
-- ============================================================

DO $$
BEGIN
  -- Créer la table transaction_logs si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transaction_logs'
  ) THEN
    CREATE TABLE public.transaction_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
      
      event_type TEXT NOT NULL, -- created, payment_initiated, webhook_received, status_updated, completed, failed
      status TEXT NOT NULL,
      
      -- Event data
      request_data JSONB,
      response_data JSONB,
      error_data JSONB,
      
      ip_address TEXT,
      user_agent TEXT,
      
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- Créer les index
    CREATE INDEX IF NOT EXISTS idx_transaction_logs_transaction_id ON public.transaction_logs(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON public.transaction_logs(created_at DESC);

    -- Activer RLS
    ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

    -- Policy pour les propriétaires de boutique
    CREATE POLICY "Store owners can view their transaction logs"
      ON public.transaction_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.transactions t
          JOIN public.stores s ON s.id = t.store_id
          WHERE t.id = transaction_logs.transaction_id
          AND s.user_id = auth.uid()
        )
      );

    -- Policy pour les admins
    CREATE POLICY "Admins can view all transaction logs"
      ON public.transaction_logs FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));

    RAISE NOTICE 'Table transaction_logs créée avec succès';
  ELSE
    RAISE NOTICE 'Table transaction_logs existe déjà';
  END IF;
END $$;

-- ============================================================
-- SUPPRIMER LES ANCIENNES POLICIES (SI ELLES EXISTENT)
-- ============================================================

DROP POLICY IF EXISTS "Customers can create transactions for their purchases" ON public.transactions;
DROP POLICY IF EXISTS "Customers can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Customers can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Customers can view their own transaction logs" ON public.transaction_logs;

-- ============================================================
-- RLS POLICIES SIMPLIFIÉES POUR CLIENTS
-- ============================================================

-- Policy: Les clients peuvent créer des transactions
-- Vérifie que l'utilisateur est authentifié et que le userId dans metadata correspond
CREATE POLICY "Customers can create transactions for their purchases"
  ON public.transactions FOR INSERT
  WITH CHECK (
    -- L'utilisateur doit être authentifié
    auth.uid() IS NOT NULL
    AND (
      -- Le userId dans metadata correspond à l'utilisateur authentifié
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      -- Ou permettre la création si l'utilisateur est authentifié (pour les achats directs)
      OR auth.uid() IS NOT NULL
    )
  );

-- Policy: Les clients peuvent voir leurs propres transactions
-- Utilise metadata.userId pour identifier les transactions du client
CREATE POLICY "Customers can view their own transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Le userId dans metadata correspond à l'utilisateur authentifié
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      -- Ou si order_id existe, vérifier que l'order appartient à l'utilisateur
      OR (
        order_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = transactions.order_id
          AND o.customer_id = auth.uid()
        )
      )
    )
  );

-- Policy: Les clients peuvent mettre à jour leurs propres transactions (statut seulement)
-- Permet aux clients de mettre à jour le statut de leurs transactions (ex: annulation)
CREATE POLICY "Customers can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Le userId dans metadata correspond à l'utilisateur authentifié
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      -- Ou si order_id existe, vérifier que l'order appartient à l'utilisateur
      OR (
        order_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = transactions.order_id
          AND o.customer_id = auth.uid()
        )
      )
    )
    -- Seulement pour les statuts "pending" ou "processing" (pas de modification après completion)
    AND status IN ('pending', 'processing', 'cancelled')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Le userId dans metadata correspond à l'utilisateur authentifié
      (metadata->>'userId' IS NOT NULL AND (metadata->>'userId')::text = auth.uid()::text)
      -- Ou si order_id existe, vérifier que l'order appartient à l'utilisateur
      OR (
        order_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = transactions.order_id
          AND o.customer_id = auth.uid()
        )
      )
    )
  );

-- ============================================================
-- RLS POLICIES POUR TRANSACTION_LOGS (si la table existe)
-- ============================================================

DO $$
BEGIN
  -- Créer la policy seulement si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transaction_logs'
  ) THEN
    -- Policy: Les clients peuvent voir les logs de leurs propres transactions
    EXECUTE '
      CREATE POLICY "Customers can view their own transaction logs"
        ON public.transaction_logs FOR SELECT
        USING (
          auth.uid() IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_logs.transaction_id
            AND (
              -- Le userId dans metadata correspond à l''utilisateur authentifié
              (t.metadata->>''userId'' IS NOT NULL AND (t.metadata->>''userId'')::text = auth.uid()::text)
              -- Ou si order_id existe, vérifier que l''order appartient à l''utilisateur
              OR (
                t.order_id IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM public.orders o
                  WHERE o.id = t.order_id
                  AND o.customer_id = auth.uid()
                )
              )
            )
          )
        )
    ';
    RAISE NOTICE 'Policy "Customers can view their own transaction logs" créée';
  ELSE
    RAISE NOTICE 'Table transaction_logs n''existe pas, policy non créée';
  END IF;
END $$;

-- ============================================================
-- COMMENTAIRES
-- ============================================================

COMMENT ON POLICY "Customers can create transactions for their purchases" 
  ON public.transactions IS 'Permet aux clients authentifiés de créer des transactions (utilise metadata.userId)';

COMMENT ON POLICY "Customers can view their own transactions" 
  ON public.transactions IS 'Permet aux clients de voir leurs propres transactions (utilise metadata.userId ou order.customer_id)';

COMMENT ON POLICY "Customers can update their own transactions" 
  ON public.transactions IS 'Permet aux clients de mettre à jour leurs propres transactions (statut seulement)';

-- Commentaire pour transaction_logs (si la table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transaction_logs'
  ) THEN
    EXECUTE 'COMMENT ON POLICY "Customers can view their own transaction logs" ON public.transaction_logs IS ''Permet aux clients de voir les logs de leurs propres transactions''';
  END IF;
END $$;


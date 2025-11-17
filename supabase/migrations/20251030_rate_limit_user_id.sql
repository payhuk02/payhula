-- =========================================================
-- Migration : Ajout support userId dans rate_limit_log
-- Date : 30 Octobre 2025
-- Description : Ajoute la colonne user_id pour un rate limiting plus précis
-- =========================================================

-- Ajouter la colonne user_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rate_limit_log' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.rate_limit_log 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour performances (recherche par userId + endpoint + date)
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_endpoint_date 
ON public.rate_limit_log(user_id, endpoint, created_at DESC)
WHERE user_id IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN public.rate_limit_log.user_id IS 'ID de l''utilisateur authentifié (optionnel, pour rate limiting par utilisateur)';


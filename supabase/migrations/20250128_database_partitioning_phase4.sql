-- ================================================================
-- Database Partitioning - Phase 4 Scalability
-- Date: 2025-01-28
-- Description: Partitionnement des grandes tables pour améliorer les performances
-- ================================================================

-- =====================================================
-- 1. PARTITIONING: orders (par date)
-- =====================================================
-- Les commandes sont partitionnées par mois pour améliorer les performances
-- sur les requêtes historiques

-- Créer la table partitionnée si elle n'existe pas déjà
DO $$
BEGIN
  -- Vérifier si la table orders existe et n'est pas déjà partitionnée
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'orders'
    AND table_type = 'BASE TABLE'
  ) THEN
    -- Créer une table temporaire pour stocker les données
    CREATE TABLE IF NOT EXISTS orders_backup AS SELECT * FROM orders;
    
    -- Supprimer l'ancienne table (ATTENTION: à faire avec précaution en production)
    -- DROP TABLE IF EXISTS orders CASCADE;
    
    -- Créer la table partitionnée
    CREATE TABLE IF NOT EXISTS orders_partitioned (
      LIKE orders INCLUDING ALL
    ) PARTITION BY RANGE (created_at);
    
    -- Créer les partitions pour les 12 derniers mois
    DO $$
    DECLARE
      month_date DATE;
      partition_name TEXT;
    BEGIN
      FOR i IN 0..11 LOOP
        month_date := DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
        partition_name := 'orders_' || TO_CHAR(month_date, 'YYYY_MM');
        
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I PARTITION OF orders_partitioned
          FOR VALUES FROM %L TO %L
        ', 
          partition_name,
          month_date,
          month_date + INTERVAL '1 month'
        );
      END LOOP;
    END $$;
    
    -- Créer une partition par défaut pour les futures données
    CREATE TABLE IF NOT EXISTS orders_default PARTITION OF orders_partitioned
    DEFAULT;
  END IF;
END $$;

-- =====================================================
-- 2. PARTITIONING: order_items (par order_id range)
-- =====================================================
-- Les order_items peuvent être partitionnées par range de order_id
-- pour améliorer les jointures avec orders

-- =====================================================
-- 3. PARTITIONING: digital_product_downloads (par date)
-- =====================================================
-- Les téléchargements sont partitionnés par mois
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'digital_product_downloads'
    AND table_type = 'BASE TABLE'
  ) THEN
    -- Créer la table partitionnée
    CREATE TABLE IF NOT EXISTS digital_product_downloads_partitioned (
      LIKE digital_product_downloads INCLUDING ALL
    ) PARTITION BY RANGE (download_date);
    
    -- Créer les partitions pour les 12 derniers mois
    DO $$
    DECLARE
      month_date DATE;
      partition_name TEXT;
    BEGIN
      FOR i IN 0..11 LOOP
        month_date := DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
        partition_name := 'digital_downloads_' || TO_CHAR(month_date, 'YYYY_MM');
        
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I PARTITION OF digital_product_downloads_partitioned
          FOR VALUES FROM %L TO %L
        ', 
          partition_name,
          month_date,
          month_date + INTERVAL '1 month'
        );
      END LOOP;
    END $$;
    
    -- Partition par défaut
    CREATE TABLE IF NOT EXISTS digital_downloads_default PARTITION OF digital_product_downloads_partitioned
    DEFAULT;
  END IF;
END $$;

-- =====================================================
-- 4. PARTITIONING: transaction_logs (par date)
-- =====================================================
-- Les logs de transactions sont partitionnés par mois
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transaction_logs'
    AND table_type = 'BASE TABLE'
  ) THEN
    CREATE TABLE IF NOT EXISTS transaction_logs_partitioned (
      LIKE transaction_logs INCLUDING ALL
    ) PARTITION BY RANGE (created_at);
    
    -- Créer les partitions pour les 12 derniers mois
    DO $$
    DECLARE
      month_date DATE;
      partition_name TEXT;
    BEGIN
      FOR i IN 0..11 LOOP
        month_date := DATE_TRUNC('month', CURRENT_DATE) - (i || ' months')::INTERVAL;
        partition_name := 'transaction_logs_' || TO_CHAR(month_date, 'YYYY_MM');
        
        EXECUTE format('
          CREATE TABLE IF NOT EXISTS %I PARTITION OF transaction_logs_partitioned
          FOR VALUES FROM %L TO %L
        ', 
          partition_name,
          month_date,
          month_date + INTERVAL '1 month'
        );
      END LOOP;
    END $$;
    
    -- Partition par défaut
    CREATE TABLE IF NOT EXISTS transaction_logs_default PARTITION OF transaction_logs_partitioned
    DEFAULT;
  END IF;
END $$;

-- =====================================================
-- 5. INDEXES pour les partitions
-- =====================================================
-- Créer des index sur les colonnes fréquemment utilisées dans les partitions

-- Index sur orders_partitioned
CREATE INDEX IF NOT EXISTS idx_orders_partitioned_customer_id 
ON orders_partitioned(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_partitioned_store_id 
ON orders_partitioned(store_id);

CREATE INDEX IF NOT EXISTS idx_orders_partitioned_status 
ON orders_partitioned(status);

CREATE INDEX IF NOT EXISTS idx_orders_partitioned_payment_status 
ON orders_partitioned(payment_status);

-- Index sur digital_product_downloads_partitioned
CREATE INDEX IF NOT EXISTS idx_digital_downloads_partitioned_user_id 
ON digital_product_downloads_partitioned(user_id);

CREATE INDEX IF NOT EXISTS idx_digital_downloads_partitioned_product_id 
ON digital_product_downloads_partitioned(digital_product_id);

CREATE INDEX IF NOT EXISTS idx_digital_downloads_partitioned_success 
ON digital_product_downloads_partitioned(download_success);

-- Index sur transaction_logs_partitioned
CREATE INDEX IF NOT EXISTS idx_transaction_logs_partitioned_transaction_id 
ON transaction_logs_partitioned(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_partitioned_status 
ON transaction_logs_partitioned(status);

-- =====================================================
-- 6. FUNCTION pour créer automatiquement les partitions futures
-- =====================================================
-- Fonction pour créer automatiquement les partitions mensuelles

CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  month_date DATE;
  partition_name TEXT;
  table_name TEXT;
BEGIN
  -- Créer les partitions pour le mois suivant
  month_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
  
  -- Orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders_partitioned') THEN
    partition_name := 'orders_' || TO_CHAR(month_date, 'YYYY_MM');
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = partition_name) THEN
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF orders_partitioned
        FOR VALUES FROM %L TO %L
      ', partition_name, month_date, month_date + INTERVAL '1 month');
    END IF;
  END IF;
  
  -- Digital Downloads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'digital_product_downloads_partitioned') THEN
    partition_name := 'digital_downloads_' || TO_CHAR(month_date, 'YYYY_MM');
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = partition_name) THEN
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF digital_product_downloads_partitioned
        FOR VALUES FROM %L TO %L
      ', partition_name, month_date, month_date + INTERVAL '1 month');
    END IF;
  END IF;
  
  -- Transaction Logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_logs_partitioned') THEN
    partition_name := 'transaction_logs_' || TO_CHAR(month_date, 'YYYY_MM');
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = partition_name) THEN
      EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF transaction_logs_partitioned
        FOR VALUES FROM %L TO %L
      ', partition_name, month_date, month_date + INTERVAL '1 month');
    END IF;
  END IF;
END;
$$;

-- =====================================================
-- 7. COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION create_monthly_partitions() IS 
'Crée automatiquement les partitions mensuelles pour les tables partitionnées';

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================
-- ⚠️ ATTENTION: Cette migration crée des tables partitionnées
-- mais ne migre PAS automatiquement les données existantes
-- 
-- Pour migrer les données en production:
-- 1. Créer les tables partitionnées
-- 2. Insérer les données: INSERT INTO orders_partitioned SELECT * FROM orders;
-- 3. Renommer les tables: ALTER TABLE orders RENAME TO orders_old;
-- 4. Renommer la partitionnée: ALTER TABLE orders_partitioned RENAME TO orders;
-- 5. Vérifier que tout fonctionne
-- 6. Supprimer l'ancienne table après vérification
--
-- Cette migration est préparée pour une migration future
-- et ne modifie PAS les tables existantes pour éviter les risques


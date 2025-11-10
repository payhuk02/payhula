# Corrections Critiques des Systèmes de Transactions

**Date**: 31 Janvier 2025  
**Priorité**: 🔴 CRITIQUE

---

## 🔴 Problème 1: Trigger d'Affiliation - Tracking Cookie Non Trouvé

### Problème Identifié

Dans le trigger `create_affiliate_commission_on_payment`, la requête SQL lit `t.metadata->>'tracking_cookie'` mais il n'y a **PAS de JOIN avec la table `transactions`**:

```sql
-- ❌ PROBLÈME: 't' n'est pas défini dans la requête
SELECT 
  o.id,
  o.store_id,
  o.total_amount,
  t.metadata->>'tracking_cookie' as tracking_cookie,  -- ❌ 't' n'existe pas !
  oi.product_id
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = NEW.order_id
```

### Solution

Corriger le trigger pour joindre correctement avec `transactions` et lire le `payment_id`:

```sql
-- Récupérer les infos de la commande ET de la transaction
SELECT 
  o.id,
  o.store_id,
  o.total_amount,
  t.metadata->>'tracking_cookie' as tracking_cookie,
  oi.product_id
INTO 
  v_order_id,
  v_store_id,
  v_order_total,
  v_tracking_cookie,
  v_product_id
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN transactions t ON t.order_id = o.id AND t.payment_id = NEW.id  -- ✅ JOIN avec transactions
WHERE o.id = NEW.order_id
LIMIT 1;
```

---

## 🔴 Problème 2: Déconnexion Transactions/Payments

### Problème Identifié

Les triggers de commissions sont sur la table `payments`, mais:
1. Dans `initiateMonerooPayment` et `initiatePayDunyaPayment`, on crée **seulement une transaction**, pas un payment
2. Donc `transaction.payment_id` est **NULL**
3. Les webhooks mettent à jour `transactions`, mais si `payment_id` est NULL, ils ne mettent pas à jour `payments`
4. Les triggers sur `payments` ne se déclencheront **JAMAIS**

### Solution Recommandée

**Option 1 (Recommandée)**: Déplacer les triggers sur `transactions`

Créer un nouveau trigger sur `transactions` qui se déclenche quand une transaction est complétée:

```sql
CREATE OR REPLACE FUNCTION public.create_affiliate_commission_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_product_id UUID;
  v_store_id UUID;
  v_order_total NUMERIC;
  v_tracking_cookie TEXT;
  v_affiliate_link_id UUID;
  v_affiliate_id UUID;
  v_settings RECORD;
  v_commission_amount NUMERIC;
BEGIN
  -- Vérifier que la transaction est complétée
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Si pas d'order_id, sortir
  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lire le tracking cookie directement depuis NEW.metadata
  v_tracking_cookie := NEW.metadata->>'tracking_cookie';

  -- Si pas de tracking cookie, sortir
  IF v_tracking_cookie IS NULL OR v_tracking_cookie = '' THEN
    RETURN NEW;
  END IF;

  -- Récupérer les infos de la commande
  SELECT 
    o.id,
    o.store_id,
    o.total_amount,
    oi.product_id
  INTO 
    v_order_id,
    v_store_id,
    v_order_total,
    v_product_id
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.id = NEW.order_id
  LIMIT 1;

  -- Si pas de commande ou pas de produit, sortir
  IF v_order_id IS NULL OR v_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ... reste de la logique identique ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur transactions
DROP TRIGGER IF EXISTS trigger_create_affiliate_commission_on_transaction ON public.transactions;
CREATE TRIGGER trigger_create_affiliate_commission_on_transaction
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.create_affiliate_commission_on_transaction();
```

**Option 2**: Créer un payment avant la transaction

Modifier `initiateMonerooPayment` et `initiatePayDunyaPayment` pour créer un payment avant de créer la transaction:

```typescript
// 1. Créer le payment
const { data: payment, error: paymentError } = await supabase
  .from('payments')
  .insert({
    store_id: storeId,
    order_id: orderId,
    customer_id: customerId,
    amount,
    currency,
    status: 'pending',
    payment_method: 'moneroo', // ou 'paydunya'
  })
  .select()
  .single();

if (paymentError) {
  throw new Error('Impossible de créer le payment');
}

// 2. Créer la transaction avec payment_id
const { data: transaction, error: transactionError } = await supabase
  .from('transactions')
  .insert({
    payment_id: payment.id, // ✅ Lier au payment
    store_id: storeId,
    order_id: orderId,
    ...
  });
```

---

## 🔴 Problème 3: Trigger de Referral Commission

### Problème Identifié

Le trigger `calculate_referral_commission` est aussi sur `payments`, donc le même problème existe.

### Solution

Déplacer le trigger sur `transactions` également, ou s'assurer que `payment_id` est toujours créé.

---

## 📋 Plan d'Action

### Étape 1: Corriger le Trigger d'Affiliation (URGENT)

1. Créer une nouvelle migration pour corriger le trigger
2. Déplacer le trigger sur `transactions` au lieu de `payments`
3. Lire le tracking cookie directement depuis `NEW.metadata`
4. Tester avec un paiement réel

### Étape 2: Créer Payments Avant Transactions

1. Modifier `initiateMonerooPayment` pour créer un payment
2. Modifier `initiatePayDunyaPayment` pour créer un payment
3. Lier les transactions aux payments via `payment_id`
4. Tester le flux complet

### Étape 3: Corriger le Trigger de Referral

1. Déplacer le trigger sur `transactions`
2. Adapter la logique pour lire depuis `transactions`
3. Tester avec un referral réel

### Étape 4: Tests Complets

1. Test paiement avec affiliation
2. Test paiement avec referral
3. Test webhook Moneroo
4. Test webhook PayDunya
5. Vérifier que les commissions sont créées

---

## 🚨 Impact des Corrections

### Avant les Corrections

- ❌ Les commissions d'affiliation ne sont **JAMAIS** créées
- ❌ Les commissions de referral ne sont **JAMAIS** créées
- ❌ Les notifications de commission ne sont **JAMAIS** envoyées
- ❌ Le système d'affiliation est **NON FONCTIONNEL**

### Après les Corrections

- ✅ Les commissions d'affiliation seront créées automatiquement
- ✅ Les commissions de referral seront créées automatiquement
- ✅ Les notifications seront envoyées
- ✅ Le système sera **FONCTIONNEL**

---

**Fin du Document de Corrections**






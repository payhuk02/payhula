# Audit Complet des Systèmes de Transactions

**Date**: 31 Janvier 2025  
**Objectif**: Vérifier l'opérationnalité de tous les systèmes de transactions, paiements, affiliation, commissions et intégrations

---

## 🔍 Résumé Exécutif

Cet audit identifie plusieurs problèmes critiques dans l'intégration entre les systèmes de transactions, paiements, affiliation et commissions qui peuvent empêcher le fonctionnement correct de ces systèmes.

### ⚠️ Problèmes Critiques Identifiés

1. **🔴 CRITIQUE**: Déconnexion entre `transactions` et `payments`
2. **🔴 CRITIQUE**: Trigger d'affiliation dépend de `payments` mais les webhooks mettent à jour `transactions`
3. **🟡 MOYEN**: Trigger de referral commission dépend aussi de `payments`
4. **🟡 MOYEN**: Tracking cookie peut ne pas être correctement propagé
5. **🟢 MINEUR**: Manque de validation des données entre systèmes

---

## 📊 Architecture Actuelle

### Flux de Paiement

```
1. Checkout.tsx
   ↓
2. initiatePayment() (payment-service.ts)
   ↓
3. initiateMonerooPayment() ou initiatePayDunyaPayment()
   ↓
4. Création transaction dans table `transactions`
   ↓
5. Redirection vers provider de paiement
   ↓
6. Webhook reçu (Moneroo ou PayDunya)
   ↓
7. Mise à jour table `transactions`
   ↓
8. Mise à jour table `payments` (si payment_id existe)
   ↓
9. Trigger sur `payments` → Création commissions
```

### Problème Identifié

**Les webhooks mettent à jour `transactions`, mais les triggers de commissions sont sur `payments`.**
**Si `payment_id` n'est pas correctement lié, les commissions ne seront jamais créées.**

---

## 🔴 Problème 1: Déconnexion transactions/payments

### Description

Les triggers d'affiliation et de referral commission sont sur la table `payments`:

```sql
-- Trigger affiliation
CREATE TRIGGER trigger_create_affiliate_commission_on_payment
  AFTER UPDATE ON public.payments
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')

-- Trigger referral
CREATE TRIGGER calculate_referral_commission_trigger
AFTER INSERT OR UPDATE ON public.payments
WHEN (NEW.status = 'completed')
```

Mais les webhooks Moneroo et PayDunya mettent à jour la table `transactions`:

```typescript
// moneroo-webhook/index.ts
await supabase
  .from('transactions')
  .update(updates)
  .eq('id', transaction.id);

// Ensuite, si payment_id existe:
if (transaction.payment_id) {
  await supabase
    .from('payments')
    .update({ status: 'completed' })
    .eq('id', transaction.payment_id);
}
```

### Problème

**Si `transaction.payment_id` est NULL ou si le payment n'existe pas, les commissions ne seront jamais créées.**

### Impact

- ❌ Les commissions d'affiliation ne seront pas créées
- ❌ Les commissions de referral ne seront pas créées
- ❌ Les notifications de commission ne seront pas envoyées

### Solution Recommandée

**Option 1 (Recommandée)**: Déplacer les triggers sur la table `transactions`

```sql
-- Créer un trigger sur transactions au lieu de payments
CREATE TRIGGER trigger_create_affiliate_commission_on_transaction
  AFTER UPDATE ON public.transactions
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.create_affiliate_commission_on_transaction();
```

**Option 2**: S'assurer que `payment_id` est toujours créé et lié

Dans `initiateMonerooPayment` et `initiatePayDunyaPayment`, créer un payment avant de créer la transaction:

```typescript
// 1. Créer le payment
const { data: payment } = await supabase
  .from('payments')
  .insert({ ... })
  .select()
  .single();

// 2. Créer la transaction avec payment_id
const { data: transaction } = await supabase
  .from('transactions')
  .insert({
    payment_id: payment.id,
    ...
  });
```

---

## 🔴 Problème 2: Tracking Cookie dans Metadata

### Description

Le trigger d'affiliation lit le tracking cookie depuis `transactions.metadata`:

```sql
t.metadata->>'tracking_cookie' as tracking_cookie
```

Mais dans `Checkout.tsx`, le tracking cookie est ajouté aux métadonnées du paiement:

```typescript
metadata: {
  ...(hasAffiliate && {
    affiliate_link_id: affiliateInfo.affiliate_link_id,
    affiliate_id: affiliateInfo.affiliate_id,
    tracking_cookie: affiliateInfo.tracking_cookie,
  }),
}
```

### Problème

**Le trigger fait une jointure complexe qui peut échouer si la structure n'est pas correcte:**

```sql
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = NEW.order_id
```

**Mais il lit `t.metadata` sans faire de JOIN avec `transactions` !**

```sql
-- Dans le trigger, il manque le JOIN avec transactions
SELECT 
  o.id,
  o.store_id,
  o.total_amount,
  t.metadata->>'tracking_cookie' as tracking_cookie,  -- ❌ 't' n'est pas défini !
  oi.product_id
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = NEW.order_id
```

### Impact

- ❌ Le tracking cookie ne sera jamais trouvé
- ❌ Les commissions d'affiliation ne seront jamais créées

### Solution

Corriger le trigger pour joindre correctement avec `transactions`:

```sql
SELECT 
  o.id,
  o.store_id,
  o.total_amount,
  t.metadata->>'tracking_cookie' as tracking_cookie,
  oi.product_id
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN transactions t ON t.order_id = o.id AND t.payment_id = NEW.id
WHERE o.id = NEW.order_id
```

**OU** lire directement depuis `NEW` si on déplace le trigger sur `transactions`:

```sql
-- Si trigger sur transactions
NEW.metadata->>'tracking_cookie' as tracking_cookie
```

---

## 🟡 Problème 3: Payment ID Manquant

### Description

Dans `initiateMonerooPayment` et `initiatePayDunyaPayment`, on crée seulement une transaction, pas un payment:

```typescript
// moneroo-payment.ts
const { data: transaction } = await supabase
  .from("transactions")
  .insert({
    store_id: storeId,
    product_id: productId,
    order_id: orderId,
    customer_id: customerId,
    amount,
    currency,
    status: "pending",
    payment_provider: "moneroo",
    // ❌ Pas de payment_id !
  })
```

### Impact

- ⚠️ Si `payment_id` est NULL, les webhooks ne pourront pas mettre à jour `payments`
- ⚠️ Les triggers sur `payments` ne se déclencheront jamais
- ⚠️ Les commissions ne seront pas créées

### Solution

Créer un payment avant de créer la transaction, ou créer le payment dans le webhook si absent.

---

## 🟡 Problème 4: Vérification de l'Existence des Tables

### Description

Les triggers de notifications utilisent des blocs conditionnels pour vérifier l'existence des tables, mais les triggers de commissions ne le font pas.

### Impact

- ⚠️ Si les migrations sont exécutées dans le mauvais ordre, les triggers peuvent échouer
- ⚠️ Les erreurs peuvent être silencieuses

### Solution

Ajouter des vérifications d'existence des tables dans les migrations de triggers.

---

## 📋 Checklist de Vérification

### ✅ Systèmes Fonctionnels

- [x] Création de transactions Moneroo
- [x] Création de transactions PayDunya
- [x] Webhooks Moneroo (mise à jour transactions)
- [x] Webhooks PayDunya (mise à jour transactions)
- [x] Tracking d'affiliation (cookies)
- [x] Création de clics d'affiliation
- [x] Système de retry pour transactions échouées
- [x] Système de réconciliation Moneroo
- [x] Statistiques Moneroo
- [x] Notifications de paiement
- [x] Remboursements Moneroo
- [x] Annulations Moneroo

### ❌ Systèmes Non Fonctionnels (Problèmes Identifiés)

- [ ] **Création de commissions d'affiliation** (dépend de `payments`, mais `payments` peut ne pas exister)
- [ ] **Création de commissions de referral** (dépend de `payments`, mais `payments` peut ne pas exister)
- [ ] **Lecture du tracking cookie** (jointure manquante dans le trigger)
- [ ] **Liaison transaction/payment** (payment_id peut être NULL)

---

## 🔧 Corrections Recommandées

### Correction 1: Déplacer les Triggers sur Transactions

**Fichier**: `supabase/migrations/20250131_create_affiliate_commission_trigger.sql`

**Changement**:
1. Modifier le trigger pour qu'il soit sur `transactions` au lieu de `payments`
2. Lire le tracking cookie directement depuis `NEW.metadata`
3. Simplifier la logique de jointure

### Correction 2: Créer Payment avant Transaction

**Fichiers**: 
- `src/lib/moneroo-payment.ts`
- `src/lib/paydunya-payment.ts`

**Changement**:
1. Créer un payment avant de créer la transaction
2. Lier la transaction au payment via `payment_id`
3. S'assurer que le payment existe toujours

### Correction 3: Vérifier la Structure des Métadonnées

**Fichier**: `src/pages/Checkout.tsx`

**Changement**:
1. S'assurer que le tracking cookie est bien dans `metadata`
2. Vérifier que la structure est cohérente
3. Ajouter des logs pour déboguer

### Correction 4: Améliorer les Webhooks

**Fichiers**:
- `supabase/functions/moneroo-webhook/index.ts`
- `supabase/functions/paydunya-webhook/index.ts`

**Changement**:
1. S'assurer que `payment_id` est toujours défini
2. Créer le payment s'il n'existe pas
3. Mettre à jour `payments` de manière fiable

---

## 🧪 Tests Recommandés

### Test 1: Paiement avec Affiliation

1. Créer un lien d'affiliation
2. Cliquer sur le lien (créer un cookie)
3. Effectuer un achat
4. Vérifier que la commission est créée
5. Vérifier que le clic est marqué comme converti

### Test 2: Paiement avec Referral

1. Créer une relation de parrainage
2. Faire un achat depuis un filleul
3. Vérifier que la commission de referral est créée
4. Vérifier que le parrain reçoit la commission

### Test 3: Webhook Moneroo

1. Simuler un webhook Moneroo
2. Vérifier que la transaction est mise à jour
3. Vérifier que le payment est mis à jour
4. Vérifier que les commissions sont créées

### Test 4: Webhook PayDunya

1. Simuler un webhook PayDunya
2. Vérifier que la transaction est mise à jour
3. Vérifier que le payment est mis à jour
4. Vérifier que les commissions sont créées

---

## 📝 Conclusion

### Problèmes Critiques à Corriger en Priorité

1. **🔴 CRITIQUE**: Déplacer les triggers de commissions sur `transactions` au lieu de `payments`
2. **🔴 CRITIQUE**: Corriger la jointure dans le trigger d'affiliation pour lire le tracking cookie
3. **🟡 MOYEN**: S'assurer que `payment_id` est toujours créé et lié
4. **🟡 MOYEN**: Améliorer la gestion des métadonnées dans les transactions

### Impact des Corrections

- ✅ Les commissions d'affiliation seront créées correctement
- ✅ Les commissions de referral seront créées correctement
- ✅ Les notifications seront envoyées
- ✅ Le système sera plus fiable et maintenable

---

## 🚀 Prochaines Étapes

1. **Phase 1**: Corriger les triggers (déplacer sur `transactions`)
2. **Phase 2**: Corriger la création de payments
3. **Phase 3**: Tester tous les flux
4. **Phase 4**: Documenter les corrections

---

**Fin du Document d'Audit**








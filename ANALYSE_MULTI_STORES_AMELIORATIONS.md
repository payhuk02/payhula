# Analyse Multi-Stores - Améliorations et Corrections

Date: 2025-01-31
Status: Analyse complète du système multi-stores

## 🔴 Problèmes critiques identifiés

### 1. Affiliation tracking non intégré dans multi-store checkout

**Problème** :
- Les infos d'affiliation sont récupérées dans `Checkout.tsx` mais ne sont **pas passées** à `processMultiStoreCheckout`
- Le `tracking_cookie` n'est **pas ajouté** aux metadata des transactions
- Les commissions d'affiliation ne seront **pas créées** pour les commandes multi-stores

**Impact** : 🔴 CRITIQUE - Les affiliés ne recevront pas leurs commissions

**Solution** :
- Passer `affiliateInfo` à `processMultiStoreCheckout`
- Ajouter `tracking_cookie`, `affiliate_link_id`, `affiliate_id` dans les metadata des transactions
- S'assurer que chaque transaction contient le `tracking_cookie` pour que les triggers SQL fonctionnent

**Fichiers à modifier** :
- `src/pages/Checkout.tsx` : Passer `affiliateInfo` à `processMultiStoreCheckout`
- `src/lib/multi-store-checkout.ts` : Ajouter `affiliateInfo` dans les options et metadata
- `src/pages/checkout/MultiStoreSummary.tsx` : Ajouter `affiliateInfo` lors de la création de transactions

---

### 2. Sécurité : Pas de vérification d'accès utilisateur

**Problème** :
- `MultiStoreSummary` et `MultiStoreOrdersHistory` ne vérifient pas que l'utilisateur accède uniquement à **ses propres commandes**
- Un utilisateur pourrait accéder aux commandes d'autres utilisateurs en modifiant l'URL

**Impact** : 🔴 CRITIQUE - Fuite de données utilisateur

**Solution** :
- Vérifier que `customer_id` de chaque commande correspond à l'utilisateur connecté
- Ajouter une vérification RLS ou côté application
- Rediriger vers une page d'erreur si accès non autorisé

**Fichiers à modifier** :
- `src/pages/checkout/MultiStoreSummary.tsx` : Vérifier `customer_id` pour chaque commande
- `src/pages/customer/MultiStoreOrdersHistory.tsx` : S'assurer que seules les commandes de l'utilisateur sont récupérées (déjà fait via `.eq('customer_id', user.id)`)

---

### 3. Gestion des produits sans store_id

**Problème** :
- Si un produit n'a pas de `store_id`, il est **ignoré silencieusement** dans `groupItemsByStore`
- L'utilisateur ne sera pas informé que certains produits n'ont pas pu être ajoutés à la commande

**Impact** : 🟠 MOYEN - Expérience utilisateur dégradée

**Solution** :
- Afficher un avertissement à l'utilisateur
- Logger l'erreur
- Optionnellement : Essayer de récupérer le `store_id` depuis d'autres sources

**Fichiers à modifier** :
- `src/lib/multi-store-checkout.ts` : Logger et retourner les produits ignorés
- `src/pages/Checkout.tsx` : Afficher un avertissement si des produits sont ignorés

---

## 🟠 Améliorations importantes

### 4. Notifications groupées pour multi-stores

**Problème** :
- Les webhooks créent des notifications individuelles pour chaque commande
- Pas de notification spéciale quand **toutes les commandes** d'un groupe multi-stores sont payées

**Impact** : 🟠 MOYEN - Expérience utilisateur

**Solution** :
- Dans les webhooks de paiement, vérifier si toutes les commandes du groupe sont payées
- Créer une notification groupée "Toutes vos commandes multi-stores ont été payées"
- Mettre à jour le statut du groupe dans les metadata

**Fichiers à modifier** :
- `supabase/functions/moneroo-webhook/index.ts` : Vérifier et créer notification groupée
- `supabase/functions/paydunya-webhook/index.ts` : Vérifier et créer notification groupée
- Migration SQL : Fonction pour vérifier si toutes les commandes d'un groupe sont payées

---

### 5. Validation des montants côté serveur

**Problème** :
- Pas de validation que les montants dans les transactions correspondent aux montants des commandes
- Risque de manipulation côté client

**Impact** : 🟠 MOYEN - Sécurité

**Solution** :
- Ajouter une validation dans les webhooks
- Vérifier que `transaction.amount === order.total_amount`
- Logger et rejeter les transactions avec montants incohérents

**Fichiers à modifier** :
- `supabase/functions/moneroo-webhook/index.ts` : Validation des montants
- `supabase/functions/paydunya-webhook/index.ts` : Validation des montants
- Migration SQL : Fonction de validation `validate_transaction_amount`

---

### 6. Gestion améliorée des erreurs de rollback

**Problème** :
- Si le rollback échoue (erreur réseau, timeout), les commandes orphelines restent dans la base
- Pas de mécanisme de nettoyage automatique

**Impact** : 🟠 MOYEN - Intégrité des données

**Solution** :
- Ajouter un système de nettoyage périodique pour les commandes orphelines
- Edge Function pour nettoyer les commandes sans items après X heures
- Logger les échecs de rollback pour monitoring

**Fichiers à créer** :
- `supabase/functions/cleanup-orphaned-orders/index.ts` : Nettoyage des commandes orphelines

---

### 7. Webhooks pour groupes multi-stores

**Problème** :
- Pas de webhook spécial pour les groupes de commandes multi-stores
- Les webhooks individuels ne permettent pas de savoir qu'un groupe complet est payé

**Impact** : 🟡 FAIBLE - Fonctionnalité avancée

**Solution** :
- Créer un webhook `multi_store_group.completed` quand toutes les commandes d'un groupe sont payées
- Ajouter un événement dans le système de webhooks
- Déclencher automatiquement depuis les webhooks de paiement

**Fichiers à modifier** :
- `supabase/functions/moneroo-webhook/index.ts` : Déclencher webhook groupe
- `supabase/functions/paydunya-webhook/index.ts` : Déclencher webhook groupe
- Migration SQL : Ajouter `multi_store_group.completed` aux événements webhooks

---

### 8. Optimisation des requêtes

**Problème** :
- Plusieurs requêtes séparées pour récupérer les détails des commandes
- Requêtes N+1 potentielles dans `MultiStoreSummary` et `MultiStoreOrdersHistory`

**Impact** : 🟡 FAIBLE - Performance

**Solution** :
- Combiner les requêtes avec des `JOIN`
- Utiliser `select` avec relations Supabase
- Ajouter des index sur les colonnes fréquemment utilisées

**Fichiers à modifier** :
- `src/pages/checkout/MultiStoreSummary.tsx` : Optimiser les requêtes
- `src/pages/customer/MultiStoreOrdersHistory.tsx` : Optimiser les requêtes
- Migration SQL : Ajouter des index si nécessaire

---

### 9. Gestion des retours après paiement

**Problème** :
- Quand l'utilisateur revient après avoir payé une commande, la page de résumé ne détecte pas toujours le changement
- Pas de mécanisme pour rafraîchir automatiquement après retour de paiement

**Impact** : 🟡 FAIBLE - Expérience utilisateur

**Solution** :
- Détecter le retour depuis une URL de paiement (paramètre `?return_from_payment=true`)
- Rafraîchir automatiquement les commandes
- Afficher un message de confirmation

**Fichiers à modifier** :
- `src/pages/checkout/MultiStoreSummary.tsx` : Détecter le retour et rafraîchir

---

### 10. Validation des coupons/cartes cadeaux multi-stores

**Problème** :
- La répartition proportionnelle des coupons/cartes cadeaux pourrait être améliorée
- Pas de validation que le coupon/carte cadeau est valide pour toutes les boutiques

**Impact** : 🟡 FAIBLE - Logique métier

**Solution** :
- Valider que le coupon/carte cadeau est valide pour chaque boutique
- Gérer le cas où un coupon est spécifique à une boutique mais utilisé sur plusieurs
- Afficher des messages clairs à l'utilisateur

**Fichiers à modifier** :
- `src/lib/multi-store-checkout.ts` : Validation améliorée des coupons/cartes cadeaux

---

## 🟢 Améliorations mineures

### 11. Loading states améliorés

**Problème** :
- Certains états de chargement ne sont pas affichés
- Pas de skeleton loader pour toutes les sections

**Solution** :
- Ajouter des skeleton loaders partout
- Améliorer les messages de chargement

---

### 12. Gestion des erreurs réseau

**Problème** :
- Pas de retry automatique en cas d'erreur réseau
- Les erreurs ne sont pas toujours bien gérées

**Solution** :
- Ajouter un système de retry avec backoff exponentiel
- Améliorer les messages d'erreur

---

### 13. Tests unitaires et E2E

**Problème** :
- Pas de tests pour le système multi-stores

**Solution** :
- Créer des tests unitaires pour `multi-store-checkout.ts`
- Créer des tests E2E pour le flux complet

---

## 📊 Priorités

### Priorité 1 (CRITIQUE) - À faire immédiatement
1. ✅ Intégrer affiliation tracking dans multi-store checkout
2. ✅ Ajouter vérification de sécurité pour l'accès aux commandes

### Priorité 2 (IMPORTANT) - À faire rapidement
3. ✅ Gérer les produits sans store_id avec avertissement
4. ✅ Ajouter notifications groupées pour multi-stores
5. ✅ Valider les montants côté serveur

### Priorité 3 (MOYEN) - À faire prochainement
6. ✅ Améliorer gestion des erreurs de rollback
7. ✅ Ajouter webhooks pour groupes multi-stores
8. ✅ Optimiser les requêtes

### Priorité 4 (FAIBLE) - Améliorations futures
9. ✅ Gestion des retours après paiement
10. ✅ Validation améliorée des coupons/cartes cadeaux
11. ✅ Loading states améliorés
12. ✅ Gestion des erreurs réseau
13. ✅ Tests unitaires et E2E

---

## 📝 Résumé

**Problèmes critiques** : 2
**Améliorations importantes** : 5
**Améliorations mineures** : 6

**Total** : 13 améliorations/corrections identifiées




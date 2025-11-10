# ✅ Correction Complète - Intégration Moneroo selon Documentation Officielle

## 📚 Documentation Moneroo

**Référence :** [https://docs.moneroo.io/](https://docs.moneroo.io/)

### Endpoint Correct

D'après la documentation "Intégration standard" :
- **Endpoint :** `POST https://api.moneroo.io/v1/payments/initialize`
- **Headers :** `Authorization: Bearer YOUR_SECRET_KEY`, `Content-Type: application/json`, `Accept: application/json`

### Format de la Requête

```json
{
  "amount": 1000,
  "currency": "XOF",
  "description": "Description du paiement",
  "customer": {
    "email": "client@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "return_url": "https://votresite.com/checkout/success",
  "metadata": {
    "order_id": "123"
  },
  "methods": ["mtn_ngn", "bank_transfers_ngn"] // optionnel
}
```

### Format de la Réponse

```json
{
  "message": "Transaction initialized successfully.",
  "data": {
    "id": "transaction_id",
    "checkout_url": "https://checkout.moneroo.io/..."
  },
  "errors": null
}
```

---

## ✅ Corrections Appliquées

### 1. Endpoint Corrigé dans Edge Function

**Fichier :** `supabase/functions/moneroo/index.ts`

**Avant :**
```typescript
endpoint = '/checkout';  // ❌ N'existe pas
// ou
endpoint = '/payments';  // ❌ N'existe pas
```

**Après :**
```typescript
endpoint = '/payments/initialize';  // ✅ Correct selon documentation
```

### 2. Format des Données Corrigé

**Avant :**
```typescript
body = {
  amount: data.amount,
  currency: data.currency || 'XOF',
  description: data.description,
  customer_email: data.customer_email,  // ❌ Format incorrect
  customer_name: data.customer_name,    // ❌ Format incorrect
  return_url: data.return_url,
  cancel_url: data.cancel_url,  // ❌ Non mentionné dans la documentation
  metadata: data.metadata || {},
};
```

**Après :**
```typescript
// Diviser customer_name en first_name et last_name
const customerNameParts = (data.customer_name || '').split(' ');
const firstName = customerNameParts[0] || data.customer_name || '';
const lastName = customerNameParts.slice(1).join(' ') || '';

body = {
  amount: data.amount,
  currency: data.currency || 'XOF',
  description: data.description,
  customer: {  // ✅ Objet customer avec first_name et last_name
    email: data.customer_email,
    first_name: firstName,
    last_name: lastName,
  },
  return_url: data.return_url,
  metadata: data.metadata || {},
  // methods est optionnel
  ...(data.methods && { methods: data.methods }),
};
```

### 3. Gestion de la Réponse Corrigée Côté Client

**Fichier :** `src/lib/moneroo-payment.ts`

**Avant :**
```typescript
moneroo_checkout_url: monerooResponse.checkout_url,  // ❌ Accès incorrect
moneroo_transaction_id: monerooResponse.transaction_id || monerooResponse.id,
```

**Après :**
```typescript
// Extraire les données de la réponse Moneroo
// La réponse Moneroo est : { message: "...", data: { id: "...", checkout_url: "..." } }
// L'Edge Function retourne : { success: true, data: { message: "...", data: { id: "...", checkout_url: "..." } } }
// Donc monerooResponse est : { message: "...", data: { id: "...", checkout_url: "..." } }
const monerooData = monerooResponse.data || monerooResponse;
const checkoutUrl = monerooData.checkout_url || monerooResponse.checkout_url;
const transactionId = monerooData.id || monerooResponse.id || monerooResponse.transaction_id;

if (!checkoutUrl) {
  logger.error("Moneroo response missing checkout_url:", monerooResponse);
  throw new Error("La réponse Moneroo ne contient pas d'URL de checkout. Vérifiez les logs Supabase pour plus de détails.");
}
```

---

## 🚀 Action Immédiate

### Redéployer l'Edge Function avec le Code Corrigé

1. **Ouvrir Supabase Dashboard**
   - Allez sur : https://app.supabase.com/project/hbdnzajbyjakdhuavrvb/functions/moneroo/code

2. **Copier le Code Corrigé**
   - Ouvrez `CODE_MONEROO_POUR_SUPABASE.txt`
   - Copiez tout le contenu (Ctrl+A, Ctrl+C)

3. **Coller dans Supabase**
   - Dans l'éditeur Supabase, sélectionnez tout (Ctrl+A)
   - Supprimez l'ancien code
   - Collez le nouveau code (Ctrl+V)

4. **Déployer**
   - Cliquez sur **"Deploy updates"**

5. **Rebuild l'Application Frontend**
   ```bash
   npm run build
   npm run dev
   ```

6. **Tester**
   - Retournez sur `http://localhost:8080/marketplace`
   - Essayez d'acheter un produit
   - Vérifiez les logs Supabase

---

## 📋 Vérifications

### Dans les Logs Supabase

Vous devriez voir :
```
INFO [Moneroo Edge Function] Calling Moneroo API: { url: "https://api.moneroo.io/v1/payments/initialize", method: "POST", ... }
INFO [Moneroo Edge Function] Moneroo API response: { status: 200, statusText: "OK", ok: true }
INFO Moneroo response success: { action: "create_checkout", status: 200 }
```

### Dans la Console du Navigateur

- Plus d'erreur 404
- La réponse contient `checkout_url`
- L'utilisateur est redirigé vers la page de paiement Moneroo

---

## 🔍 Structure de la Réponse

### Réponse Moneroo API
```json
{
  "message": "Transaction initialized successfully.",
  "data": {
    "id": "transaction_id",
    "checkout_url": "https://checkout.moneroo.io/..."
  }
}
```

### Réponse Edge Function
```json
{
  "success": true,
  "data": {
    "message": "Transaction initialized successfully.",
    "data": {
      "id": "transaction_id",
      "checkout_url": "https://checkout.moneroo.io/..."
    }
  }
}
```

### Ce que le Client Reçoit
```json
{
  "message": "Transaction initialized successfully.",
  "data": {
    "id": "transaction_id",
    "checkout_url": "https://checkout.moneroo.io/..."
  }
}
```

### Extraction dans `moneroo-payment.ts`
```typescript
const monerooData = monerooResponse.data || monerooResponse;
const checkoutUrl = monerooData.checkout_url;  // ✅ Correct
const transactionId = monerooData.id;          // ✅ Correct
```

---

## ✅ Résultat Attendu

Après le déploiement :
- ✅ Plus d'erreur 404 sur l'API Moneroo
- ✅ Le paiement est initialisé avec succès
- ✅ La réponse contient `checkout_url`
- ✅ L'utilisateur est redirigé vers la page de paiement Moneroo
- ✅ Les logs Supabase montrent des succès (status 200)

---

## 📚 Références

- **Documentation Moneroo :** [https://docs.moneroo.io/](https://docs.moneroo.io/)
- **Intégration Standard :** [https://docs.moneroo.io/payments/standard-integration](https://docs.moneroo.io/payments/standard-integration)
- **Authentification :** [https://docs.moneroo.io/introduction/authentication](https://docs.moneroo.io/introduction/authentication)

---

## 🎯 Prochaines Étapes

1. **Redéployer l'Edge Function** avec le code corrigé
2. **Rebuild l'application frontend** pour appliquer les corrections côté client
3. **Tester un paiement** depuis l'application
4. **Vérifier les logs Supabase** pour confirmer le succès
5. **Vérifier que l'utilisateur est redirigé** vers la page de paiement Moneroo

Une fois ces étapes terminées, les paiements devraient fonctionner correctement ! 🎉



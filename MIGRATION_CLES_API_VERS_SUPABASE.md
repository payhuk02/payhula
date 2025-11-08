# 🔄 Migration des Clés API vers Supabase Edge Functions

## ⚠️ IMPORTANT : Sécurité des Clés API

**Les clés API PayDunya et Moneroo NE DOIVENT PAS être dans le fichier `.env` du frontend.**

Ces clés sont **sécurisées** dans **Supabase Edge Functions Secrets** et ne sont **jamais** exposées au frontend.

---

## 🔍 Vérification Actuelle

### ❌ Problème Détecté

Dans votre fichier `.env`, vous avez :
```env
VITE_MONEROO_API_KEY="pvk_4sezf1|01K9J4V2N2D2C7JN2YY49CCN0Z"
```

**⚠️ Cette clé n'est PAS utilisée dans le code frontend** et peut être retirée du `.env`.

---

## ✅ Architecture Correcte

### Comment les Clés API sont Utilisées

1. **Frontend (React)** :
   - ❌ Ne contient AUCUNE clé API PayDunya/Moneroo
   - ✅ Appelle les Edge Functions Supabase via `supabase.functions.invoke()`
   - ✅ Les clés API ne sont jamais exposées au navigateur

2. **Edge Functions Supabase** :
   - ✅ Contiennent les clés API dans les Secrets
   - ✅ Appellent les APIs PayDunya/Moneroo directement
   - ✅ Les clés sont sécurisées et non accessibles depuis le frontend

3. **Flux de Paiement** :
   ```
   Frontend (React)
   → supabase.functions.invoke("paydunya", {...})
   → Edge Function (Supabase)
   → API PayDunya (avec clés sécurisées)
   → Réponse → Frontend
   ```

---

## 🔴 ÉTAPE 1 : Retirer les Clés du .env

### Modifier le fichier `.env`

**Retirez** ces lignes (si elles existent) :
```env
# ❌ À RETIRER - Ces clés ne sont pas utilisées dans le frontend
VITE_MONEROO_API_KEY=...
VITE_PAYDUNYA_MASTER_KEY=...
VITE_PAYDUNYA_PRIVATE_KEY=...
VITE_PAYDUNYA_TOKEN=...
```

**Gardez** seulement :
```env
# ✅ Variables Supabase (utilisées dans le frontend)
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# ✅ Autres variables (analytics, etc.)
VITE_SENTRY_DSN=...
VITE_GA_TRACKING_ID=...
```

---

## 🔴 ÉTAPE 2 : Configurer les Clés dans Supabase

### 2.1 Accéder aux Secrets Supabase

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Settings** → **Edge Functions** → **Secrets**

### 2.2 Ajouter les Secrets PayDunya

Pour **chaque clé**, cliquez sur **"Add a new secret"** :

1. **Nom** : `PAYDUNYA_MASTER_KEY`
   - **Valeur** : Votre clé principale PayDunya (copiée depuis le dashboard PayDunya)
   - **Description** : Clé principale PayDunya

2. **Nom** : `PAYDUNYA_PRIVATE_KEY`
   - **Valeur** : Votre clé privée PayDunya
   - **Description** : Clé privée PayDunya

3. **Nom** : `PAYDUNYA_TOKEN`
   - **Valeur** : Votre token PayDunya
   - **Description** : Token PayDunya

### 2.3 Ajouter les Secrets Moneroo

1. **Nom** : `MONEROO_API_KEY`
   - **Valeur** : Votre clé API Moneroo (la même que celle dans votre .env)
   - **Description** : Clé API Moneroo

2. **Nom** : `MONEROO_WEBHOOK_SECRET`
   - **Valeur** : Votre secret webhook Moneroo
   - **Description** : Secret pour valider les webhooks Moneroo

---

## ✅ ÉTAPE 3 : Vérifier la Configuration

### 3.1 Vérifier dans Supabase

Dans **Settings** → **Edge Functions** → **Secrets**, vous devriez voir :

- ✅ `PAYDUNYA_MASTER_KEY` (configuré)
- ✅ `PAYDUNYA_PRIVATE_KEY` (configuré)
- ✅ `PAYDUNYA_TOKEN` (configuré)
- ✅ `MONEROO_API_KEY` (configuré)
- ✅ `MONEROO_WEBHOOK_SECRET` (configuré)

### 3.2 Tester les Edge Functions

#### Test PayDunya

1. Aller dans **Edge Functions** → **paydunya**
2. Cliquer sur **"Invoke"**
3. Tester avec :
```json
{
  "action": "create_checkout",
  "data": {
    "amount": 1000,
    "currency": "XOF",
    "description": "Test payment",
    "return_url": "https://payhula.vercel.app/checkout/success",
    "cancel_url": "https://payhula.vercel.app/checkout/cancel"
  }
}
```

#### Test Moneroo

1. Aller dans **Edge Functions** → **moneroo**
2. Cliquer sur **"Invoke"**
3. Tester avec :
```json
{
  "action": "create_checkout",
  "data": {
    "amount": 1000,
    "currency": "XOF",
    "description": "Test payment",
    "return_url": "https://payhula.vercel.app/checkout/success",
    "cancel_url": "https://payhula.vercel.app/checkout/cancel"
  }
}
```

---

## 📋 Checklist de Migration

- [ ] Clés PayDunya retirées du `.env`
- [ ] Clé Moneroo retirée du `.env`
- [ ] `PAYDUNYA_MASTER_KEY` configuré dans Supabase
- [ ] `PAYDUNYA_PRIVATE_KEY` configuré dans Supabase
- [ ] `PAYDUNYA_TOKEN` configuré dans Supabase
- [ ] `MONEROO_API_KEY` configuré dans Supabase
- [ ] `MONEROO_WEBHOOK_SECRET` configuré dans Supabase
- [ ] Test PayDunya réussi
- [ ] Test Moneroo réussi
- [ ] `.env` nettoyé (seulement variables frontend)

---

## 🔒 Sécurité

### ✅ Pourquoi les Clés ne doivent PAS être dans .env

1. **Exposition au Frontend** :
   - ❌ Les variables `VITE_*` sont compilées dans le bundle JavaScript
   - ❌ Elles sont accessibles dans le code source du navigateur
   - ❌ N'importe qui peut les voir dans les DevTools

2. **Sécurité avec Edge Functions** :
   - ✅ Les clés sont dans Supabase (serveur)
   - ✅ Jamais exposées au navigateur
   - ✅ Accessibles uniquement par les Edge Functions

### ✅ Bonnes Pratiques

1. **Ne jamais commiter les clés** :
   - ✅ Les clés sont dans Supabase (pas dans Git)
   - ✅ Pas de clés dans le code source
   - ✅ Pas de clés dans `.env` (frontend)

2. **Utiliser des clés de test en développement** :
   - ✅ Utiliser les clés de test pour le développement
   - ✅ Utiliser les clés de production uniquement en production

3. **Rotation des clés** :
   - 🔴 Rotation régulière des clés (tous les 3-6 mois)
   - 🔴 Régénération immédiate si clés compromises

---

## 🐛 Dépannage

### Erreur : "Configuration API PayDunya manquante"

**Cause** : Les secrets PayDunya ne sont pas configurés dans Supabase.

**Solution** :
1. Vérifier que `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, et `PAYDUNYA_TOKEN` sont configurés
2. Vérifier l'orthographe des noms des secrets
3. Redéployer l'Edge Function si nécessaire

### Erreur : "Configuration API manquante" (Moneroo)

**Cause** : Le secret `MONEROO_API_KEY` n'est pas configuré dans Supabase.

**Solution** :
1. Vérifier que `MONEROO_API_KEY` est configuré
2. Vérifier l'orthographe du nom du secret
3. Redéployer l'Edge Function si nécessaire

---

## 📞 Support

- **Guide Configuration Supabase** : [GUIDE_CONFIGURATION_SUPABASE_EDGE_FUNCTIONS.md](GUIDE_CONFIGURATION_SUPABASE_EDGE_FUNCTIONS.md)
- **Guide Configuration PayDunya** : [GUIDE_CONFIGURATION_PAYDUNYA_KEYS.md](GUIDE_CONFIGURATION_PAYDUNYA_KEYS.md)
- **Vérification APIs** : [VERIFICATION_API_PAYDUNYA_MONEROO.md](VERIFICATION_API_PAYDUNYA_MONEROO.md)

---

**Date de création** : 31 Janvier 2025  
**Dernière mise à jour** : 31 Janvier 2025


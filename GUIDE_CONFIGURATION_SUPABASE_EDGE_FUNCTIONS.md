# 🔐 Guide de Configuration des Secrets Supabase Edge Functions

## 📋 Vue d'Ensemble

Les APIs **PayDunya** et **Moneroo** sont appelées via des **Edge Functions Supabase**. Les clés API doivent être configurées dans **Supabase Dashboard**, pas dans le fichier `.env` du frontend.

---

## 🔴 ÉTAPE 1 : Accéder aux Secrets Supabase

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Settings** → **Edge Functions** → **Secrets**

---

## 🔴 ÉTAPE 2 : Configurer les Secrets PayDunya

### Variables Requises

1. **PAYDUNYA_MASTER_KEY** (Obligatoire)
   - Clé maître PayDunya
   - Format : `master_key_xxxxxxxxxxxx`
   - Où trouver : Dashboard PayDunya → Settings → API Keys

2. **PAYDUNYA_PRIVATE_KEY** (Obligatoire)
   - Clé privée PayDunya
   - Format : `private_key_xxxxxxxxxxxx`
   - Où trouver : Dashboard PayDunya → Settings → API Keys

3. **PAYDUNYA_TOKEN** (Obligatoire)
   - Token PayDunya
   - Format : `token_xxxxxxxxxxxx`
   - Où trouver : Dashboard PayDunya → Settings → API Keys

4. **PAYDUNYA_API_URL** (Optionnel)
   - URL de l'API PayDunya
   - Valeur par défaut : `https://app.paydunya.com/api/v1`
   - Ne configurer que si vous utilisez une URL personnalisée

### Configuration dans Supabase

1. Cliquer sur **"Add a new secret"**
2. Nom : `PAYDUNYA_MASTER_KEY`
3. Valeur : Votre clé maître PayDunya
4. Répéter pour `PAYDUNYA_PRIVATE_KEY` et `PAYDUNYA_TOKEN`

---

## 🔴 ÉTAPE 3 : Configurer les Secrets Moneroo

### Variables Requises

1. **MONEROO_API_KEY** (Obligatoire)
   - Clé API Moneroo
   - Format : `sk_live_xxxxxxxxxxxx` ou `sk_test_xxxxxxxxxxxx`
   - Où trouver : Dashboard Moneroo → Settings → API Keys

2. **MONEROO_WEBHOOK_SECRET** (Obligatoire pour webhooks)
   - Secret pour valider les webhooks Moneroo
   - Format : `whsec_xxxxxxxxxxxx`
   - Où trouver : Dashboard Moneroo → Settings → Webhooks

3. **MONEROO_API_URL** (Optionnel)
   - URL de l'API Moneroo
   - Valeur par défaut : `https://api.moneroo.io/v1`
   - Ne configurer que si vous utilisez une URL personnalisée

### Configuration dans Supabase

1. Cliquer sur **"Add a new secret"**
2. Nom : `MONEROO_API_KEY`
3. Valeur : Votre clé API Moneroo
4. Répéter pour `MONEROO_WEBHOOK_SECRET`

---

## 🔴 ÉTAPE 4 : Configurer l'URL du Site (Recommandé)

### Variable Requise

1. **SITE_URL** (Recommandé)
   - URL de votre site web
   - Valeur par défaut : `https://payhula.vercel.app`
   - Utilisée pour :
     - Les headers CORS dans les Edge Functions
     - Les URLs de retour dans les emails (paniers abandonnés)
     - L'URL du site dans les configurations PayDunya

### Configuration dans Supabase

1. Cliquer sur **"Add a new secret"**
2. Nom : `SITE_URL`
3. Valeur : `https://payhula.vercel.app` (ou votre domaine personnalisé)
   - ⚠️ **Important** : Ne pas ajouter de slash final (`/`)

**Note** : Si cette variable n'est pas configurée, le système utilisera `https://payhula.vercel.app` par défaut.

---

## 🔴 ÉTAPE 5 : Vérifier les Secrets Supabase (Déjà Configurés)

Ces secrets sont généralement déjà configurés automatiquement :

1. **SUPABASE_URL**
   - URL de votre projet Supabase
   - Format : `https://xxxxx.supabase.co`
   - Déjà configuré automatiquement

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Clé service role Supabase
   - Format : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Déjà configuré automatiquement

**⚠️ Vérifier** : Ces secrets doivent être présents dans la liste.

---

## ✅ ÉTAPE 6 : Vérifier la Configuration

### Test PayDunya

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
    "return_url": "https://yourdomain.com/success",
    "cancel_url": "https://yourdomain.com/cancel"
  }
}
```

### Test Moneroo

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
    "return_url": "https://yourdomain.com/success",
    "cancel_url": "https://yourdomain.com/cancel"
  }
}
```

---

## 🔒 SÉCURITÉ

### ✅ Bonnes Pratiques

1. **Ne jamais commiter les clés** :
   - ✅ Les clés sont dans Supabase (pas dans Git)
   - ✅ Pas de clés dans le code source
   - ✅ Pas de clés dans `.env` (frontend)

2. **Utiliser des clés de test en développement** :
   - ✅ Utiliser `sk_test_xxx` pour Moneroo
   - ✅ Utiliser les clés de test PayDunya

3. **Rotation des clés** :
   - 🔴 Rotation régulière des clés (tous les 3-6 mois)
   - 🔴 Régénération immédiate si clés compromises

4. **Monitoring** :
   - 🔴 Surveiller les logs d'appels API
   - 🔴 Alertes si clés manquantes
   - 🔴 Alertes si erreurs d'authentification

---

## 📋 CHECKLIST DE VÉRIFICATION

### Configuration Supabase

- [ ] **PayDunya Secrets** :
  - [ ] `PAYDUNYA_MASTER_KEY` configuré
  - [ ] `PAYDUNYA_PRIVATE_KEY` configuré
  - [ ] `PAYDUNYA_TOKEN` configuré
  - [ ] `PAYDUNYA_API_URL` configuré (si nécessaire)

- [ ] **Moneroo Secrets** :
  - [ ] `MONEROO_API_KEY` configuré
  - [ ] `MONEROO_WEBHOOK_SECRET` configuré
  - [ ] `MONEROO_API_URL` configuré (si nécessaire)

- [ ] **Supabase Secrets** :
  - [ ] `SUPABASE_URL` présent (automatique)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` présent (automatique)

- [ ] **Site Web Secret** :
  - [ ] `SITE_URL` configuré (recommandé, défaut: `https://payhula.vercel.app`)

### Tests

- [ ] **PayDunya** :
  - [ ] Test création checkout
  - [ ] Test vérification paiement
  - [ ] Test webhook reçu

- [ ] **Moneroo** :
  - [ ] Test création checkout
  - [ ] Test vérification paiement
  - [ ] Test remboursement
  - [ ] Test webhook reçu avec signature

---

## 🐛 DÉPANNAGE

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

### Erreur : "Webhook signature invalid" (Moneroo)

**Cause** : Le secret `MONEROO_WEBHOOK_SECRET` n'est pas configuré ou incorrect.

**Solution** :
1. Vérifier que `MONEROO_WEBHOOK_SECRET` est configuré
2. Vérifier que la valeur correspond au secret dans le Dashboard Moneroo
3. Vérifier l'orthographe du nom du secret

### Erreur : "401 Unauthorized" (PayDunya ou Moneroo)

**Cause** : Les clés API sont incorrectes ou expirées.

**Solution** :
1. Vérifier les clés dans le Dashboard PayDunya/Moneroo
2. Régénérer les clés si nécessaire
3. Mettre à jour les secrets dans Supabase

---

## 📞 SUPPORT

- **Documentation Supabase** : https://supabase.com/docs/guides/functions/secrets
- **Documentation PayDunya** : https://paydunya.com/developers
- **Documentation Moneroo** : https://docs.moneroo.io

---

**Date de création** : 31 Janvier 2025  
**Dernière mise à jour** : 31 Janvier 2025


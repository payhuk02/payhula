# 🔑 Guide de Configuration des Clés API PayDunya

## 📋 Vue d'Ensemble

Ce guide vous explique comment obtenir et configurer les clés API PayDunya pour votre application Payhula.

---

## 🔴 ÉTAPE 1 : Obtenir les Clés API PayDunya

### 1.1 Accéder à votre Compte PayDunya

1. Connectez-vous à votre compte PayDunya : [https://paydunya.com](https://paydunya.com)
2. Allez dans **"Intégrez notre API"** (menu de gauche)
3. Vous verrez deux sections :
   - **Clés API de Test** (pour le développement)
   - **Clés API de Production** (pour la production)

### 1.2 Clés Disponibles

Pour chaque environnement (Test ou Production), vous avez :

1. **Clé Principale (Master Key)** - Clé principale pour l'authentification
2. **Clé Publique (Public Key)** - Clé publique (optionnelle pour certaines opérations)
3. **Clé Privée (Private Key)** - Clé privée pour l'authentification
4. **Token** - Token d'authentification

**⚠️ IMPORTANT** : Pour PayDunya, vous devez configurer **3 clés** dans Supabase :
- `PAYDUNYA_MASTER_KEY` (Clé Principale)
- `PAYDUNYA_PRIVATE_KEY` (Clé Privée)
- `PAYDUNYA_TOKEN` (Token)

---

## 🔴 ÉTAPE 2 : Copier les Clés API

### 2.1 Clés de Test (Développement)

1. Dans la section **"Clés API de Test"**
2. Cliquez sur le bouton **"Copier"** pour chaque clé :
   - Cliquez sur **"Copier"** à côté de **"Clé Principale"** → C'est votre `PAYDUNYA_MASTER_KEY`
   - Cliquez sur **"Copier"** à côté de **"Clé Privée"** → C'est votre `PAYDUNYA_PRIVATE_KEY`
   - Cliquez sur **"Copier"** à côté de **"Token"** → C'est votre `PAYDUNYA_TOKEN`

### 2.2 Clés de Production

⚠️ **ATTENTION** : N'utilisez les clés de production que lorsque vous êtes prêt pour la production.

1. Dans la section **"Clés API de Production"**
2. Cliquez sur le bouton **"Copier"** pour chaque clé :
   - Cliquez sur **"Copier"** à côté de **"Clé Principale"** → C'est votre `PAYDUNYA_MASTER_KEY` (production)
   - Cliquez sur **"Copier"** à côté de **"Clé Privée"** → C'est votre `PAYDUNYA_PRIVATE_KEY` (production)
   - Cliquez sur **"Copier"** à côté de **"Token"** → C'est votre `PAYDUNYA_TOKEN` (production)

---

## 🔴 ÉTAPE 3 : Configurer les Clés dans Supabase

### 3.1 Accéder aux Secrets Supabase

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Settings** → **Edge Functions** → **Secrets**

### 3.2 Ajouter les Secrets PayDunya

Pour chaque clé, cliquez sur **"Add a new secret"** et ajoutez :

#### Pour le Développement (Test)

1. **Nom** : `PAYDUNYA_MASTER_KEY`
   - **Valeur** : La clé principale que vous avez copiée (clés de test)
   - **Description** : Clé principale PayDunya (Test)

2. **Nom** : `PAYDUNYA_PRIVATE_KEY`
   - **Valeur** : La clé privée que vous avez copiée (clés de test)
   - **Description** : Clé privée PayDunya (Test)

3. **Nom** : `PAYDUNYA_TOKEN`
   - **Valeur** : Le token que vous avez copié (clés de test)
   - **Description** : Token PayDunya (Test)

#### Pour la Production

⚠️ **IMPORTANT** : Remplacez les clés de test par les clés de production lorsque vous passez en production.

1. Mettez à jour `PAYDUNYA_MASTER_KEY` avec la clé principale de production
2. Mettez à jour `PAYDUNYA_PRIVATE_KEY` avec la clé privée de production
3. Mettez à jour `PAYDUNYA_TOKEN` avec le token de production

---

## ✅ ÉTAPE 4 : Vérifier la Configuration

### 4.1 Vérifier dans Supabase

Dans **Settings** → **Edge Functions** → **Secrets**, vous devriez voir :

- ✅ `PAYDUNYA_MASTER_KEY` (configuré)
- ✅ `PAYDUNYA_PRIVATE_KEY` (configuré)
- ✅ `PAYDUNYA_TOKEN` (configuré)
- ⚠️ `PAYDUNYA_API_URL` (optionnel, défaut: `https://app.paydunya.com/api/v1`)

### 4.2 Tester les Clés

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

Si la configuration est correcte, vous devriez recevoir une réponse avec un `checkout_url`.

---

## 🔒 SÉCURITÉ

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

4. **Monitoring** :
   - 🔴 Surveiller les logs d'appels API
   - 🔴 Alertes si erreurs d'authentification
   - 🔴 Vérifier les transactions dans le dashboard PayDunya

---

## 🐛 DÉPANNAGE

### Erreur : "Configuration API PayDunya manquante"

**Cause** : Les secrets PayDunya ne sont pas configurés dans Supabase.

**Solution** :
1. Vérifier que `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, et `PAYDUNYA_TOKEN` sont configurés
2. Vérifier l'orthographe des noms des secrets
3. Redéployer l'Edge Function si nécessaire

### Erreur : "401 Unauthorized"

**Cause** : Les clés API sont incorrectes ou expirées.

**Solution** :
1. Vérifier les clés dans le Dashboard PayDunya
2. Vérifier que vous utilisez les bonnes clés (test vs production)
3. Régénérer les clés si nécessaire
4. Mettre à jour les secrets dans Supabase

### Erreur : "Invalid API credentials"

**Cause** : Les clés ne correspondent pas à l'environnement (test vs production).

**Solution** :
1. Vérifier que vous utilisez les clés de test pour le développement
2. Vérifier que vous utilisez les clés de production pour la production
3. Vérifier que les clés n'ont pas été mélangées

---

## 📞 SUPPORT

- **Documentation PayDunya** : [https://paydunya.com/developers](https://paydunya.com/developers)
- **Support PayDunya** : Contactez le support via votre dashboard PayDunya
- **Guide Supabase** : [GUIDE_CONFIGURATION_SUPABASE_EDGE_FUNCTIONS.md](GUIDE_CONFIGURATION_SUPABASE_EDGE_FUNCTIONS.md)

---

## 📋 CHECKLIST

- [ ] Compte PayDunya créé et vérifié
- [ ] Clés API de test obtenues
- [ ] Clés API de production obtenues (pour plus tard)
- [ ] `PAYDUNYA_MASTER_KEY` configuré dans Supabase
- [ ] `PAYDUNYA_PRIVATE_KEY` configuré dans Supabase
- [ ] `PAYDUNYA_TOKEN` configuré dans Supabase
- [ ] Test de création de checkout réussi
- [ ] Clés sécurisées (pas dans Git, pas dans .env)

---

**Date de création** : 31 Janvier 2025  
**Dernière mise à jour** : 31 Janvier 2025




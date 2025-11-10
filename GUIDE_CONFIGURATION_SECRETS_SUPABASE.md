# 🔐 Guide de Configuration des Secrets Supabase Edge Functions

## ❌ IMPORTANT : Ne pas utiliser le préfixe `VITE_` dans Supabase Edge Functions

### Différence entre VITE_ et les secrets Edge Functions

**`VITE_` préfixe :**
- Utilisé pour les variables d'environnement **frontend** (client-side)
- Exposées dans le navigateur (pas sécurisé pour les clés API)
- Utilisées dans `.env` du projet Vite
- Exemple : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

**Secrets Edge Functions (SANS `VITE_`) :**
- Utilisés **uniquement** côté serveur (Deno)
- **Sécurisés** - jamais exposés au client
- Configurés dans Supabase Dashboard → Edge Functions → Secrets
- Exemple : `MONEROO_API_KEY`, `PAYDUNYA_MASTER_KEY`

## ✅ Configuration Correcte des Secrets

### Secrets requis pour les Edge Functions

#### 1. Secrets Moneroo
```
MONEROO_API_KEY
```
- **Description** : Clé API Moneroo pour les paiements
- **Utilisé dans** : `supabase/functions/moneroo/index.ts`
- **Où l'obtenir** : Dashboard Moneroo → API Keys

#### 2. Secrets PayDunya
```
PAYDUNYA_MASTER_KEY
PAYDUNYA_PRIVATE_KEY
PAYDUNYA_TOKEN
```
- **Description** : Clés API PayDunya pour les paiements
- **Utilisé dans** : `supabase/functions/paydunya/index.ts`
- **Où l'obtenir** : Dashboard PayDunya → API Keys

#### 3. Secrets Supabase (automatiques)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```
- **Description** : Clés Supabase (générées automatiquement)
- **Note** : Ces secrets sont généralement déjà configurés par Supabase

#### 4. Secrets optionnels
```
SITE_URL
```
- **Description** : URL du site (par défaut: `https://payhula.vercel.app`)
- **Utilisé dans** : Toutes les Edge Functions pour CORS et URLs de retour

### Secrets pour autres fonctionnalités

#### Push Notifications
```
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

#### Email (Resend)
```
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_FROM_NAME
```

#### SMS (Twilio)
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

#### Moneroo Webhook
```
MONEROO_WEBHOOK_SECRET
```

## 📝 Instructions de Configuration

### Étape 1: Accéder aux Secrets

1. Ouvrez **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionnez votre projet **Payhuk**
3. Allez dans **Edge Functions** → **Secrets**

### Étape 2: Ajouter les Secrets

Pour chaque secret requis :

1. Cliquez sur **"Add a new secret"** ou **"New secret"**
2. Entrez le **nom du secret** (SANS `VITE_`) :
   - ✅ `MONEROO_API_KEY`
   - ❌ `VITE_MONEROO_API_KEY` (INCORRECT)
3. Entrez la **valeur** du secret
4. Cliquez sur **"Save"** ou **"Add secret"**

### Étape 3: Vérifier les Secrets

Vérifiez que tous les secrets suivants existent :

```
✅ MONEROO_API_KEY
✅ PAYDUNYA_MASTER_KEY
✅ PAYDUNYA_PRIVATE_KEY
✅ PAYDUNYA_TOKEN
✅ SITE_URL (optionnel)
✅ SUPABASE_URL (automatique)
✅ SUPABASE_SERVICE_ROLE_KEY (automatique)
```

## 🔍 Vérification dans le Code

### Edge Functions utilisent `Deno.env.get()` SANS `VITE_`

**Exemple dans `supabase/functions/moneroo/index.ts` :**
```typescript
const monerooApiKey = Deno.env.get('MONEROO_API_KEY'); // ✅ CORRECT
// const monerooApiKey = Deno.env.get('VITE_MONEROO_API_KEY'); // ❌ INCORRECT
```

**Exemple dans `supabase/functions/paydunya/index.ts` :**
```typescript
const paydunyaMasterKey = Deno.env.get('PAYDUNYA_MASTER_KEY'); // ✅ CORRECT
const paydunyaPrivateKey = Deno.env.get('PAYDUNYA_PRIVATE_KEY'); // ✅ CORRECT
const paydunyaToken = Deno.env.get('PAYDUNYA_TOKEN'); // ✅ CORRECT
```

## ⚠️ Erreurs Courantes

### Erreur : "Configuration API manquante"

**Cause** : Le secret n'existe pas ou a un mauvais nom

**Solution** :
1. Vérifiez que le secret existe dans Supabase Dashboard → Edge Functions → Secrets
2. Vérifiez que le nom est **exactement** celui utilisé dans le code (sans `VITE_`)
3. Vérifiez que la valeur est correcte

### Erreur : "Edge Function returned a non-2xx status code"

**Cause possible** : Clés API manquantes ou incorrectes

**Solution** :
1. Vérifiez les logs Supabase Edge Functions → Logs
2. Vérifiez que tous les secrets requis sont configurés
3. Vérifiez que les valeurs des secrets sont correctes

## 📚 Références

- [Documentation Supabase - Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Documentation Vite - Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 🔒 Sécurité

**IMPORTANT** :
- ❌ **NE JAMAIS** mettre les clés API dans le fichier `.env` du frontend
- ❌ **NE JAMAIS** utiliser `VITE_` pour les clés API (elles seraient exposées au client)
- ✅ **TOUJOURS** utiliser Supabase Edge Functions Secrets pour les clés API
- ✅ **TOUJOURS** utiliser `Deno.env.get()` dans les Edge Functions (pas `import.meta.env`)

## ✅ Checklist de Configuration

- [ ] `MONEROO_API_KEY` configuré dans Supabase Secrets
- [ ] `PAYDUNYA_MASTER_KEY` configuré dans Supabase Secrets
- [ ] `PAYDUNYA_PRIVATE_KEY` configuré dans Supabase Secrets
- [ ] `PAYDUNYA_TOKEN` configuré dans Supabase Secrets
- [ ] `SITE_URL` configuré (optionnel, par défaut: `https://payhula.vercel.app`)
- [ ] Tous les secrets utilisent des noms SANS `VITE_`
- [ ] Les valeurs des secrets sont correctes
- [ ] Les Edge Functions peuvent accéder aux secrets (testé)

## 🎯 Résumé

**Règle d'or** :
- **Frontend (`.env`)** : Utilisez `VITE_` pour les variables publiques (URLs, clés publiques)
- **Backend (Edge Functions Secrets)** : N'utilisez **PAS** `VITE_` pour les clés API privées

**Les Edge Functions cherchent les secrets SANS `VITE_` :**
- ✅ `MONEROO_API_KEY`
- ✅ `PAYDUNYA_MASTER_KEY`
- ✅ `PAYDUNYA_PRIVATE_KEY`
- ✅ `PAYDUNYA_TOKEN`
- ✅ `SITE_URL`





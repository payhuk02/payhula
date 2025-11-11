# 🚀 Instructions de Redéploiement de l'Edge Function Moneroo

## 📋 Situation Actuelle

D'après le dashboard Supabase :
- ✅ L'Edge Function `moneroo` est déployée
- ⚠️ **Dernière mise à jour** : Il y a un mois
- ⚠️ **Corrections récentes** : Non déployées (endpoint corrigé, logs améliorés)

## 🔧 Pourquoi Redéployer ?

Les corrections suivantes ont été apportées au code mais ne sont pas encore déployées :

1. ✅ **Endpoint corrigé** : `/checkout/initialize` → `/checkout`
2. ✅ **Format des données** ajusté selon Moneroo
3. ✅ **Logs détaillés** ajoutés pour diagnostic
4. ✅ **Support `MONEROO_API_URL`** via variable d'environnement
5. ✅ **Gestion d'erreurs améliorée**

**Ces corrections doivent être déployées pour résoudre l'erreur "The route v1/checkout/initialize could not be found".**

## 🎯 Méthode 1 : Redéploiement via Supabase CLI (Recommandé)

### Prérequis

1. **Installer Supabase CLI** :
   ```bash
   npm install -g supabase
   ```

2. **Vérifier l'installation** :
   ```bash
   supabase --version
   ```

### Étapes de Redéploiement

1. **Se connecter à Supabase** :
   ```bash
   supabase login
   ```
   - Cela ouvrira votre navigateur pour l'authentification
   - Suivez les instructions à l'écran

2. **Lier le projet** :
   ```bash
   supabase link --project-ref hbdnzajbyjakdhuavrvb
   ```
   - Remplacez `hbdnzajbyjakdhuavrvb` par votre project-ref si différent
   - Vous pouvez trouver le project-ref dans l'URL Supabase Dashboard

3. **Déployer l'Edge Function** :
   ```bash
   supabase functions deploy moneroo
   ```

4. **Vérifier le déploiement** :
   - Allez dans Supabase Dashboard → Edge Functions → Functions → moneroo
   - Vérifiez que "LAST UPDATED" est maintenant "just now" ou "a few seconds ago"

## 🎯 Méthode 2 : Redéploiement via Supabase Dashboard

### Option A : Redéploiement Direct

1. **Ouvrir Supabase Dashboard** :
   - Aller sur https://supabase.com/dashboard
   - Sélectionner le projet "Payhuk"

2. **Accéder aux Edge Functions** :
   - Cliquer sur **Edge Functions** dans la sidebar
   - Cliquer sur **Functions**

3. **Ouvrir la fonction `moneroo`** :
   - Cliquer sur le nom `moneroo` dans la liste

4. **Redéployer** :
   - Cliquer sur l'onglet **Code**
   - Copier le code depuis le fichier local `supabase/functions/moneroo/index.ts`
   - Coller le code dans l'éditeur
   - Cliquer sur **Deploy** ou **Save**

### Option B : Via l'Interface de Déploiement

1. **Ouvrir Supabase Dashboard** → **Edge Functions** → **Functions** → **moneroo**
2. **Cliquer sur l'onglet "Code"**
3. **Copier le contenu** de `supabase/functions/moneroo/index.ts` depuis votre projet local
4. **Coller dans l'éditeur** Supabase
5. **Cliquer sur "Deploy"** ou "Save"

## 📝 Vérification Post-Déploiement

### 1. Vérifier le Déploiement

1. **Supabase Dashboard** → **Edge Functions** → **Functions** → **moneroo**
2. **Vérifier "LAST UPDATED"** : Doit être "just now" ou récent
3. **Vérifier "DEPLOYMENTS"** : Le compteur doit avoir augmenté

### 2. Vérifier les Logs

1. **Supabase Dashboard** → **Edge Functions** → **Functions** → **moneroo**
2. **Cliquer sur l'onglet "Logs"**
3. **Tester un paiement** sur le marketplace
4. **Vérifier les nouveaux logs** :
   - ✅ Devrait voir `"Calling Moneroo API: { url: ..., method: ..., endpoint: '/checkout' }"`
   - ✅ Ne devrait plus voir l'erreur `"The route v1/checkout/initialize could not be found"`
   - ⚠️ Si l'erreur persiste, vérifier la documentation Moneroo pour le bon endpoint

### 3. Tester le Paiement

1. **Aller sur** https://payhula.vercel.app/marketplace
2. **Sélectionner un produit**
3. **Cliquer sur "Acheter"**
4. **Vérifier** :
   - ✅ Le paiement devrait s'initialiser sans erreur
   - ✅ L'URL de checkout Moneroo devrait être retournée
   - ✅ La redirection vers Moneroo devrait fonctionner

## 🔍 Diagnostic si l'Erreur Persiste

Si après le redéploiement, l'erreur persiste :

### 1. Vérifier les Logs Supabase

- Consulter les logs pour voir la nouvelle erreur
- Vérifier l'endpoint utilisé dans les logs
- Vérifier le format des données envoyées

### 2. Vérifier la Documentation Moneroo

- Consulter la documentation officielle Moneroo
- Vérifier l'endpoint exact pour créer un checkout
- Vérifier le format des données attendu

### 3. Tester avec Postman/curl

```bash
curl -X POST https://api.moneroo.io/v1/checkout \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "XOF",
    "description": "Test payment"
  }'
```

### 4. Vérifier les Secrets

- Vérifier que `MONEROO_API_KEY` est bien configuré dans Supabase Dashboard → Edge Functions → Secrets
- Vérifier que la valeur est correcte
- Vérifier que le secret est accessible (pas de `VITE_` prefix)

## 📚 Ressources

- **Documentation Supabase Edge Functions** : https://supabase.com/docs/guides/functions
- **Guide Configuration Secrets** : `GUIDE_CONFIGURATION_SECRETS_SUPABASE.md`
- **Résolution Erreur Moneroo** : `RESOLUTION_ERREUR_MONEROO.md`
- **Correction Endpoint** : `CORRECTION_ENDPOINT_MONEROO.md`

## ✅ Checklist de Redéploiement

- [ ] **Préparer l'environnement**
  - [ ] Supabase CLI installé (si méthode CLI)
  - [ ] Connecté à Supabase (si méthode CLI)
  - [ ] Projet lié (si méthode CLI)

- [ ] **Redéployer l'Edge Function**
  - [ ] Code corrigé vérifié localement
  - [ ] Edge Function déployée
  - [ ] Déploiement réussi confirmé

- [ ] **Vérifier le déploiement**
  - [ ] "LAST UPDATED" mis à jour dans le dashboard
  - [ ] Logs montrent le nouveau code
  - [ ] Pas d'erreurs de déploiement

- [ ] **Tester le paiement**
  - [ ] Paiement testé sur le marketplace
  - [ ] Logs vérifiés pour les nouvelles erreurs
  - [ ] Checkout Moneroo fonctionne

## 🎯 Prochaines Étapes

1. **Redéployer l'Edge Function** `moneroo` (priorité 1)
2. **Vérifier les logs** après le redéploiement (priorité 1)
3. **Tester un paiement** sur le marketplace (priorité 2)
4. **Vérifier la documentation Moneroo** si l'erreur persiste (priorité 2)

## ⚠️ Important

**Le redéploiement est nécessaire** pour que les corrections soient prises en compte. Sans redéploiement, l'Edge Function continuera d'utiliser l'ancien code avec l'endpoint `/checkout/initialize` qui n'existe pas.







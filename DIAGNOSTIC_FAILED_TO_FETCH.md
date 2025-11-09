# 🔍 Diagnostic : Erreur "Failed to fetch"

## 📋 Problème

L'erreur **"Failed to fetch"** apparaît lors de la tentative de paiement sur le marketplace.

## 🔍 Causes Possibles

### 1. Edge Function Non Déployée ❌

**Cause** : L'Edge Function `moneroo` n'est pas déployée ou n'est pas accessible.

**Solution** :
1. Vérifier dans Supabase Dashboard → Edge Functions → Functions → moneroo
2. Vérifier que "LAST UPDATED" est récent
3. Redéployer l'Edge Function si nécessaire

### 2. Problème de CORS ❌

**Cause** : Les headers CORS ne sont pas correctement configurés.

**Solution** :
1. Vérifier que `SITE_URL` est configuré dans Supabase Dashboard → Edge Functions → Secrets
2. Vérifier que la valeur est `https://payhula.vercel.app` (sans slash final)
3. Redéployer l'Edge Function après configuration

### 3. Problème de Réseau ❌

**Cause** : Problème de connexion Internet ou de firewall.

**Solution** :
1. Vérifier votre connexion Internet
2. Vérifier que les services Supabase sont accessibles
3. Essayer depuis un autre réseau

### 4. Edge Function en Cours de Déploiement ⚠️

**Cause** : L'Edge Function est en train de se déployer.

**Solution** :
1. Attendre quelques secondes
2. Rafraîchir la page
3. Réessayer le paiement

## ✅ Solutions

### Solution 1: Vérifier que l'Edge Function est Déployée

1. **Ouvrir Supabase Dashboard** :
   - Aller sur https://supabase.com/dashboard
   - Projet "Payhuk" → Edge Functions → Functions → moneroo

2. **Vérifier "LAST UPDATED"** :
   - Doit être récent (pas "a month ago")
   - Si ancien, redéployer l'Edge Function

3. **Tester l'URL directement** :
   - Ouvrir : https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/moneroo
   - Devrait retourner une réponse (même si c'est une erreur 400 pour une requête invalide)

### Solution 2: Redéployer l'Edge Function

**Via Dashboard (recommandé)** :

1. Ouvrir `supabase/functions/moneroo/index.ts`
2. Copier TOUT le contenu (Ctrl+A, Ctrl+C)
3. Ouvrir Supabase Dashboard → Edge Functions → Functions → moneroo
4. Onglet "Code"
5. Coller le nouveau code (Ctrl+V)
6. Cliquer sur "Deploy"

### Solution 3: Vérifier les Logs Supabase

1. **Ouvrir Supabase Dashboard** → Edge Functions → Functions → moneroo
2. **Cliquer sur l'onglet "Logs"**
3. **Vérifier les erreurs récentes** :
   - Si aucune requête n'apparaît → L'Edge Function n'est pas appelée
   - Si des erreurs apparaissent → Noter les détails

### Solution 4: Vérifier la Console du Navigateur

1. **Ouvrir la console du navigateur** (F12 → Console)
2. **Tester un paiement**
3. **Vérifier les erreurs** :
   - Erreurs CORS
   - Erreurs de réseau
   - Erreurs de timeout

## 🔍 Vérifications

### Checklist de Diagnostic

- [ ] **Edge Function déployée** :
  - [ ] "LAST UPDATED" est récent dans Supabase Dashboard
  - [ ] L'URL de l'Edge Function est accessible
  - [ ] Les logs Supabase montrent des requêtes

- [ ] **Configuration CORS** :
  - [ ] `SITE_URL` est configuré dans Supabase Dashboard → Edge Functions → Secrets
  - [ ] La valeur est `https://payhula.vercel.app` (sans slash final)
  - [ ] Les headers CORS sont corrects dans le code

- [ ] **Connexion réseau** :
  - [ ] Connexion Internet fonctionne
  - [ ] Les services Supabase sont accessibles
  - [ ] Pas de firewall bloquant

- [ ] **Logs et erreurs** :
  - [ ] Logs Supabase vérifiés
  - [ ] Console du navigateur vérifiée
  - [ ] Erreurs spécifiques notées

## 📝 Actions Immédiates

1. **Vérifier que l'Edge Function est déployée** dans Supabase Dashboard
2. **Redéployer l'Edge Function** si nécessaire
3. **Vérifier les logs Supabase** pour voir si la requête arrive
4. **Vérifier la console du navigateur** pour les erreurs détaillées

## 🎯 Résultat Attendu

Après résolution, le paiement devrait fonctionner et l'erreur "Failed to fetch" devrait disparaître.

## 📚 Ressources

- **URL Edge Function** : https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/moneroo
- **Dashboard Supabase** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions
- **Guide Redéploiement** : `DEPLOIEMENT_DASHBOARD_ETAPE_PAR_ETAPE.md`



# ✅ Vérification et Correction de l'Erreur "Failed to fetch"

## 🔍 Diagnostic Basé sur les Logs

D'après les logs Supabase que vous avez partagés :

### ✅ Observations Positives
- L'Edge Function **reçoit** les requêtes OPTIONS (CORS preflight)
- Les logs montrent `[Moneroo Edge Function] Request received` pour OPTIONS
- L'Edge Function démarre correctement

### ❌ Problème Identifié
- **Aucune requête POST** n'apparaît dans les logs
- Cela signifie que la requête POST **n'atteint jamais** l'Edge Function
- L'erreur "Failed to fetch" se produit **avant** que la requête n'atteigne Supabase

## 🔴 Causes Probables

### 1. L'Edge Function n'est pas déployée avec le dernier code
**Indice :** Les logs ne montrent pas les nouveaux messages détaillés pour les POST.

**Solution :**
1. Vérifier que le code déployé contient les logs suivants :
   ```typescript
   console.log('[Moneroo Edge Function] Request received:', {
     method: req.method,
     url: req.url,
     ...
   });
   ```
2. Si ces logs n'apparaissent pas pour les POST, **redéployer** l'Edge Function

### 2. Problème d'authentification Supabase
**Indice :** Si l'utilisateur n'est pas authentifié, `supabase.functions.invoke()` peut échouer silencieusement.

**Solution :**
1. Vérifier que l'utilisateur est **connecté** avant d'acheter
2. Vérifier les logs du navigateur pour voir si l'authentification échoue
3. Vérifier que le token Supabase est valide

### 3. Problème de CORS
**Indice :** Les OPTIONS passent mais les POST sont bloquées par le navigateur.

**Solution :**
1. Vérifier que les headers CORS sont corrects dans l'Edge Function
2. Vérifier que `SITE_URL` est configuré dans les Secrets Supabase
3. Vérifier que le domaine `payhula.vercel.app` est autorisé

### 4. Problème de configuration Supabase Client
**Indice :** La requête n'est pas envoyée si `VITE_SUPABASE_URL` est incorrect.

**Solution :**
1. Vérifier que `VITE_SUPABASE_URL` est correct dans `.env`
2. Vérifier que l'URL est accessible
3. Vérifier que le projet Supabase est actif

## 🚀 Actions Immédiates

### Étape 1 : Vérifier le Déploiement de l'Edge Function

1. **Aller dans Supabase Dashboard :**
   - https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/moneroo/code

2. **Vérifier le code déployé :**
   - Le code doit contenir les logs `[Moneroo Edge Function] Request received:`
   - Le code doit être identique à `MONEROO_EDGE_FUNCTION_CODE.txt`

3. **Si le code n'est pas à jour :**
   - Copier le code depuis `MONEROO_EDGE_FUNCTION_CODE.txt`
   - Coller dans le Dashboard
   - Cliquer sur **Deploy**
   - Attendre la confirmation

### Étape 2 : Vérifier les Secrets Supabase

1. **Aller dans Settings → Edge Functions → Secrets**

2. **Vérifier `MONEROO_API_KEY` :**
   - Doit être présent
   - Ne doit PAS avoir le préfixe `VITE_`
   - Doit être la clé API Moneroo complète

3. **Vérifier `SITE_URL` (optionnel) :**
   - Si configuré, doit être `https://payhula.vercel.app`
   - Si non configuré, l'Edge Function utilisera la valeur par défaut

### Étape 3 : Vérifier l'Authentification

1. **Ouvrir la console du navigateur (F12)**

2. **Essayer d'acheter un produit**

3. **Vérifier les logs :**
   - Chercher `[MonerooClient] Calling Edge Function:`
   - Vérifier que `isAuthenticated: true`
   - Vérifier que `userId` est présent

4. **Si l'utilisateur n'est pas authentifié :**
   - Se connecter avant d'acheter
   - Vérifier que la session est valide

### Étape 4 : Vérifier les Logs du Navigateur

1. **Ouvrir la console (F12) → Onglet Console**

2. **Chercher les erreurs :**
   - `Failed to fetch`
   - `NetworkError`
   - `CORS error`

3. **Chercher les logs MonerooClient :**
   - `[MonerooClient] Calling Edge Function:`
   - `[MonerooClient] Supabase URL:`
   - `[MonerooClient] Edge Function URL:`
   - `[MonerooClient] Supabase function error:`

4. **Analyser l'erreur :**
   - Si "Failed to fetch" → Problème de réseau ou Edge Function non accessible
   - Si "CORS error" → Problème de configuration CORS
   - Si "401" ou "unauthorized" → Problème d'authentification

### Étape 5 : Vérifier les Logs Supabase

1. **Aller dans Edge Functions → moneroo → Logs**

2. **Chercher les requêtes POST :**
   - Si vous voyez des POST avec `[Moneroo Edge Function] Request received:`, l'Edge Function reçoit les requêtes
   - Si vous ne voyez que des OPTIONS, la requête POST n'atteint pas l'Edge Function

3. **Vérifier les erreurs :**
   - Chercher les logs `ERROR` ou `WARNING`
   - Chercher les messages d'erreur détaillés

## 🔧 Correction du Problème

### Si l'Edge Function n'est pas déployée :

1. **Copier le code depuis `MONEROO_EDGE_FUNCTION_CODE.txt`**
2. **Coller dans Supabase Dashboard → Edge Functions → moneroo → Code**
3. **Déployer**
4. **Vérifier que "Last updated at" est mis à jour**

### Si l'authentification échoue :

1. **Vérifier que l'utilisateur est connecté**
2. **Vérifier que le token Supabase est valide**
3. **Vérifier que `VITE_SUPABASE_PUBLISHABLE_KEY` est correct**

### Si CORS bloque les requêtes :

1. **Vérifier que `SITE_URL` est configuré dans les Secrets**
2. **Vérifier que le domaine est correct**
3. **Vérifier que les headers CORS sont corrects dans l'Edge Function**

### Si la requête n'atteint pas l'Edge Function :

1. **Vérifier que `VITE_SUPABASE_URL` est correct**
2. **Vérifier que le projet Supabase est actif**
3. **Vérifier que l'Edge Function est déployée**
4. **Vérifier la connexion Internet**

## 📝 Checklist de Vérification

- [ ] L'Edge Function est déployée avec le dernier code
- [ ] `MONEROO_API_KEY` est configuré dans les Secrets
- [ ] `SITE_URL` est configuré (ou utilise la valeur par défaut)
- [ ] L'utilisateur est authentifié
- [ ] `VITE_SUPABASE_URL` est correct dans `.env`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` est correct
- [ ] Les logs du navigateur montrent les détails
- [ ] Les logs Supabase montrent les requêtes POST
- [ ] La connexion Internet est stable

## 🎯 Prochaines Étapes

1. **Redéployer l'Edge Function** si nécessaire
2. **Vérifier les Secrets** dans Supabase
3. **Tester le paiement** avec la console ouverte
4. **Analyser les logs** pour identifier le problème exact
5. **Corriger le problème** identifié

## 🔗 Ressources

- [Guide de Déploiement Rapide](DEPLOIEMENT_RAPIDE_MONEROO.md)
- [Code de l'Edge Function](MONEROO_EDGE_FUNCTION_CODE.txt)
- [Diagnostic Détaillé](DIAGNOSTIC_ERREUR_FAILED_TO_FETCH.md)






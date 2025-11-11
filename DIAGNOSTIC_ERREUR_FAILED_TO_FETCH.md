# 🔍 Diagnostic de l'Erreur "Failed to fetch"

## 📋 Analyse des Logs Supabase

D'après les logs de l'Edge Function `moneroo`, on observe :

### ✅ Ce qui fonctionne :
- Les requêtes **OPTIONS** (CORS preflight) sont reçues et traitées
- L'Edge Function démarre correctement (`booted`)
- Les logs montrent `[Moneroo Edge Function] Request received` pour OPTIONS

### ❌ Ce qui ne fonctionne pas :
- **Aucune requête POST** n'apparaît dans les logs
- L'erreur "Failed to fetch" suggère que la requête POST n'atteint jamais l'Edge Function
- Les nouveaux logs détaillés que nous avons ajoutés ne s'affichent pas pour les POST

## 🔴 Causes Possibles

### 1. L'Edge Function n'est pas déployée avec le dernier code
**Symptôme :** Les logs ne montrent pas les nouveaux messages détaillés que nous avons ajoutés.

**Solution :**
- Vérifier que l'Edge Function a été déployée avec le code du fichier `MONEROO_EDGE_FUNCTION_CODE.txt`
- Redéployer l'Edge Function via le Dashboard Supabase

### 2. Problème de CORS
**Symptôme :** Les requêtes OPTIONS passent mais les POST sont bloquées.

**Vérification :**
- Vérifier que les headers CORS sont corrects
- Vérifier que `SITE_URL` est configuré dans les Secrets Supabase

### 3. Problème d'authentification
**Symptôme :** La requête n'est pas envoyée si l'utilisateur n'est pas authentifié.

**Vérification :**
- Vérifier que l'utilisateur est connecté avant d'acheter
- Vérifier les logs du navigateur pour voir si l'authentification échoue

### 4. Problème de réseau/firewall
**Symptôme :** La requête est bloquée avant d'atteindre Supabase.

**Vérification :**
- Vérifier la console du navigateur pour les erreurs réseau
- Vérifier que l'URL Supabase est accessible

## 🔧 Solutions à Appliquer

### Solution 1 : Vérifier le Déploiement de l'Edge Function

1. **Vérifier le code déployé :**
   - Aller dans Supabase Dashboard → Edge Functions → moneroo → Code
   - Vérifier que le code contient les nouveaux logs :
     - `[Moneroo Edge Function] Request received:`
     - `[Moneroo Edge Function] API Key check:`
     - `[Moneroo Edge Function] Processing request:`

2. **Redéployer si nécessaire :**
   - Copier le code depuis `MONEROO_EDGE_FUNCTION_CODE.txt`
   - Coller dans le Dashboard
   - Cliquer sur **Deploy**

### Solution 2 : Vérifier les Secrets Supabase

1. **Vérifier MONEROO_API_KEY :**
   - Aller dans Settings → Edge Functions → Secrets
   - Vérifier que `MONEROO_API_KEY` est configuré
   - Vérifier que la valeur est correcte (sans le préfixe `VITE_`)

2. **Vérifier SITE_URL (optionnel) :**
   - Ajouter `SITE_URL` dans les Secrets si vous voulez un domaine personnalisé
   - Valeur par défaut : `https://payhula.vercel.app`

### Solution 3 : Vérifier l'Authentification

1. **Vérifier que l'utilisateur est connecté :**
   - Ouvrir la console du navigateur (F12)
   - Vérifier les logs `[MonerooClient]`
   - Vérifier que `isAuthenticated: true` est présent

2. **Vérifier les tokens d'authentification :**
   - Vérifier que le token Supabase est valide
   - Vérifier que le token n'a pas expiré

### Solution 4 : Vérifier les Logs du Navigateur

1. **Ouvrir la console du navigateur (F12)**
2. **Chercher les logs suivants :**
   - `[MonerooClient] Calling Edge Function:`
   - `[MonerooClient] Supabase URL:`
   - `[MonerooClient] Edge Function URL:`
   - `[MonerooClient] Supabase function error:`

3. **Analyser les erreurs :**
   - Si vous voyez "Failed to fetch", vérifier la connexion réseau
   - Si vous voyez "non-2xx", vérifier les logs Supabase pour les détails
   - Si vous voyez "timeout", vérifier que l'Edge Function répond

## 📝 Checklist de Diagnostic

- [ ] L'Edge Function est déployée avec le dernier code
- [ ] `MONEROO_API_KEY` est configuré dans les Secrets Supabase
- [ ] `SITE_URL` est configuré (ou utilise la valeur par défaut)
- [ ] L'utilisateur est authentifié avant d'acheter
- [ ] Les logs du navigateur montrent les détails de l'erreur
- [ ] Les logs Supabase montrent les requêtes reçues
- [ ] La connexion Internet est stable
- [ ] L'URL Supabase est accessible

## 🚀 Actions Immédiates

1. **Redéployer l'Edge Function** avec le code mis à jour
2. **Vérifier les Secrets** dans Supabase Dashboard
3. **Tester le paiement** et vérifier les logs
4. **Analyser les logs** pour identifier le problème exact

## 🔗 Ressources

- [Guide de Déploiement](DEPLOIEMENT_RAPIDE_MONEROO.md)
- [Correction de l'Erreur](CORRECTION_ERREUR_FAILED_TO_FETCH.md)
- [Code de l'Edge Function](MONEROO_EDGE_FUNCTION_CODE.txt)






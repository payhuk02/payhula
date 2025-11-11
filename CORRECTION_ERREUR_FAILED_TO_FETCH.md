# 🔧 Correction de l'Erreur "Failed to fetch"

## 📋 Résumé

L'erreur "Failed to fetch" indique que le frontend n'arrive pas à se connecter à l'Edge Function `moneroo`. Cette erreur peut avoir plusieurs causes :

1. **L'Edge Function n'est pas déployée** avec le dernier code
2. **Problème d'authentification** - L'utilisateur n'est pas authentifié ou le token a expiré
3. **Problème de réseau** - La connexion Internet est instable
4. **Problème CORS** - Les headers CORS ne sont pas correctement configurés
5. **L'Edge Function crash** avant de pouvoir répondre

## ✅ Corrections Apportées

### 1. Amélioration des Logs dans l'Edge Function

**Fichier:** `supabase/functions/moneroo/index.ts`

- ✅ Ajout de logs détaillés au début de chaque requête
- ✅ Logs pour le parsing JSON
- ✅ Logs pour les appels à l'API Moneroo
- ✅ Logs pour les réponses de l'API Moneroo

Ces logs permettront de voir exactement où l'Edge Function échoue dans les logs Supabase.

### 2. Amélioration de la Gestion d'Erreurs Côté Client

**Fichier:** `src/lib/moneroo-client.ts`

- ✅ Vérification de l'authentification avant d'appeler l'Edge Function
- ✅ Vérification de la configuration Supabase (VITE_SUPABASE_URL)
- ✅ Ajout d'un timeout de 30 secondes pour éviter les attentes infinies
- ✅ Gestion spécifique de l'erreur "Failed to fetch"
- ✅ Messages d'erreur plus détaillés avec des étapes de diagnostic
- ✅ Logs détaillés dans la console pour le debugging

### 3. Amélioration des Messages d'Erreur

Les messages d'erreur incluent maintenant :
- Des étapes de diagnostic claires
- L'URL de l'Edge Function pour vérification
- Des liens vers les logs Supabase
- Des instructions pour redéployer l'Edge Function

## 🔍 Diagnostic

### Étape 1 : Vérifier les Logs Supabase

1. Allez dans **Supabase Dashboard** → **Edge Functions** → **moneroo** → **Logs**
2. Cherchez les nouveaux logs avec le préfixe `[Moneroo Edge Function]`
3. Vérifiez si l'Edge Function reçoit les requêtes :
   - Si vous voyez `[Moneroo Edge Function] Request received`, l'Edge Function reçoit les requêtes
   - Si vous ne voyez pas ces logs, l'Edge Function n'est pas accessible

### Étape 2 : Vérifier l'Authentification

1. Ouvrez la console du navigateur (F12)
2. Cherchez les logs `[MonerooClient]`
3. Vérifiez si `isAuthenticated: true` est présent
4. Si `isAuthenticated: false`, l'utilisateur doit se connecter

### Étape 3 : Vérifier la Configuration

1. Vérifiez que `VITE_SUPABASE_URL` est configuré dans `.env.local`
2. Vérifiez que l'URL est correcte : `https://hbdnzajbyjakdhuavrvb.supabase.co`
3. Vérifiez que `MONEROO_API_KEY` est configuré dans Supabase Dashboard → Edge Functions → Secrets

### Étape 4 : Vérifier le Déploiement

1. Allez dans **Supabase Dashboard** → **Edge Functions** → **moneroo** → **Details**
2. Vérifiez la date de "Last updated at"
3. Si la date est ancienne, l'Edge Function doit être redéployée

## 🚀 Redéploiement de l'Edge Function

### Option 1 : Via Supabase Dashboard

1. Allez dans **Supabase Dashboard** → **Edge Functions** → **moneroo** → **Code**
2. Copiez le contenu de `supabase/functions/moneroo/index.ts`
3. Collez-le dans l'éditeur de code du Dashboard
4. Cliquez sur **Deploy**

### Option 2 : Via Supabase CLI

```bash
# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref hbdnzajbyjakdhuavrvb

# Déployer l'Edge Function
supabase functions deploy moneroo
```

## 📝 Prochaines Étapes

1. **Redéployer l'Edge Function** avec le code amélioré
2. **Vérifier les logs** après le redéploiement
3. **Tester le paiement** sur la marketplace
4. **Vérifier les logs** dans la console du navigateur et dans Supabase

## 🔗 URLs Utiles

- **Edge Function URL:** `https://hbdnzajbyjakdhuavrvb.supabase.co/functions/v1/moneroo`
- **Supabase Dashboard:** `https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb`
- **Logs Edge Function:** `https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/moneroo/logs`

## 💡 Notes Importantes

- Les logs dans l'Edge Function sont maintenant préfixés avec `[Moneroo Edge Function]` pour faciliter la recherche
- Les logs côté client sont préfixés avec `[MonerooClient]` pour faciliter le debugging
- L'Edge Function a maintenant un timeout de 30 secondes pour éviter les attentes infinies
- Les messages d'erreur incluent maintenant des étapes de diagnostic claires

## 🐛 Si l'Erreur Persiste

Si l'erreur "Failed to fetch" persiste après le redéploiement :

1. **Vérifiez les logs Supabase** pour voir si l'Edge Function reçoit les requêtes
2. **Vérifiez les logs du navigateur** pour voir les détails de l'erreur
3. **Vérifiez la configuration CORS** dans l'Edge Function
4. **Vérifiez que MONEROO_API_KEY est configuré** dans Supabase Dashboard
5. **Vérifiez que l'utilisateur est authentifié** avant d'appeler l'Edge Function

## 📚 Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Edge Functions Logs](https://supabase.com/docs/guides/functions/debugging)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)






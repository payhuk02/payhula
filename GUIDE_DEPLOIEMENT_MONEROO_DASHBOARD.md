# 🚀 Guide de Déploiement de l'Edge Function Moneroo via Dashboard

## 📋 Prérequis

- Accès au projet Supabase : `https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb`
- Le fichier `supabase/functions/moneroo/index.ts` doit être à jour avec les dernières corrections

## 🔴 ÉTAPE 1 : Accéder à l'Edge Function

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb)
2. Dans le menu de gauche, cliquez sur **Edge Functions** (icône avec des flèches circulaires)
3. Cliquez sur la fonction **moneroo** dans la liste

## 🔴 ÉTAPE 2 : Ouvrir l'Éditeur de Code

1. Une fois dans la fonction **moneroo**, cliquez sur l'onglet **Code** en haut
2. Vous verrez l'éditeur de code avec le code actuel de l'Edge Function

## 🔴 ÉTAPE 3 : Copier le Nouveau Code

1. Ouvrez le fichier `supabase/functions/moneroo/index.ts` dans votre éditeur de code local
2. **Sélectionnez TOUT le contenu** (Ctrl+A)
3. **Copiez** le contenu (Ctrl+C)

## 🔴 ÉTAPE 4 : Coller le Code dans le Dashboard

1. Dans l'éditeur de code du Dashboard Supabase :
   - **Sélectionnez TOUT le contenu** existant (Ctrl+A)
   - **Supprimez-le** (Suppr ou Backspace)
   - **Collez le nouveau code** (Ctrl+V)

## 🔴 ÉTAPE 5 : Vérifier le Code

Vérifiez que le code contient bien :
- ✅ Les logs améliorés avec `[Moneroo Edge Function]`
- ✅ La gestion d'erreurs améliorée
- ✅ Les logs pour le diagnostic

## 🔴 ÉTAPE 6 : Déployer

1. Cliquez sur le bouton **Deploy** (ou **Save & Deploy**) en haut à droite
2. Attendez que le déploiement se termine (quelques secondes)
3. Vous verrez un message de confirmation : **"Function deployed successfully"**

## 🔴 ÉTAPE 7 : Vérifier le Déploiement

1. Cliquez sur l'onglet **Details** en haut
2. Vérifiez que **"Last updated at"** affiche la date et l'heure actuelles
3. Vérifiez que le nombre de **Deployments** a augmenté

## 🔴 ÉTAPE 8 : Vérifier les Secrets

1. Allez dans **Settings** → **Edge Functions** → **Secrets**
2. Vérifiez que **MONEROO_API_KEY** est configuré
3. Si ce n'est pas le cas, ajoutez-le :
   - Cliquez sur **"Add a new secret"**
   - Nom : `MONEROO_API_KEY`
   - Valeur : Votre clé API Moneroo
   - Cliquez sur **Save**

## 🔴 ÉTAPE 9 : Tester l'Edge Function

1. Allez sur la marketplace : `https://payhula.vercel.app/marketplace`
2. Essayez d'acheter un produit
3. Ouvrez la console du navigateur (F12) pour voir les logs
4. Vérifiez les logs dans Supabase Dashboard → Edge Functions → moneroo → Logs

## 📝 Code à Copier

Le code complet se trouve dans : `supabase/functions/moneroo/index.ts`

**Important :** Assurez-vous de copier TOUT le contenu du fichier, y compris :
- La référence aux types Deno : `/// <reference path="../deno.d.ts" />`
- Les imports
- Tout le code de la fonction `serve`

## 🔍 Vérification Post-Déploiement

Après le déploiement, vérifiez :

1. **Logs Supabase** :
   - Allez dans **Edge Functions** → **moneroo** → **Logs**
   - Vous devriez voir les nouveaux logs avec le préfixe `[Moneroo Edge Function]`

2. **Console Navigateur** :
   - Ouvrez la console (F12)
   - Vous devriez voir les logs avec le préfixe `[MonerooClient]`

3. **Test de Paiement** :
   - Essayez d'acheter un produit
   - Vérifiez que l'erreur "Failed to fetch" n'apparaît plus
   - Si l'erreur persiste, vérifiez les logs pour identifier le problème

## 🐛 Résolution de Problèmes

### Problème : Le déploiement échoue

**Solution :**
- Vérifiez que le code est valide (pas d'erreurs de syntaxe)
- Vérifiez que tous les imports sont corrects
- Essayez de déployer à nouveau

### Problème : L'erreur "Failed to fetch" persiste

**Solution :**
1. Vérifiez les logs dans Supabase Dashboard
2. Vérifiez que `MONEROO_API_KEY` est configuré dans les Secrets
3. Vérifiez que l'utilisateur est authentifié
4. Vérifiez la console du navigateur pour les détails de l'erreur

### Problème : Les logs n'apparaissent pas

**Solution :**
- Attendez quelques secondes après le déploiement
- Rafraîchissez la page des logs
- Vérifiez que vous êtes dans le bon environnement (Production)

## 📚 Ressources

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Guide de Configuration des Secrets](GUIDE_CONFIGURATION_SECRETS_SUPABASE.md)
- [Correction de l'Erreur Failed to Fetch](CORRECTION_ERREUR_FAILED_TO_FETCH.md)

## ✅ Checklist de Déploiement

- [ ] Code copié depuis `supabase/functions/moneroo/index.ts`
- [ ] Code collé dans le Dashboard Supabase
- [ ] Code déployé avec succès
- [ ] "Last updated at" mis à jour
- [ ] `MONEROO_API_KEY` configuré dans les Secrets
- [ ] Test de paiement effectué
- [ ] Logs vérifiés dans Supabase Dashboard
- [ ] Logs vérifiés dans la console du navigateur

## 🎯 Prochaines Étapes

Après le déploiement :

1. **Tester le paiement** sur la marketplace
2. **Vérifier les logs** pour s'assurer que tout fonctionne
3. **Résoudre les erreurs** si nécessaire en utilisant les logs améliorés






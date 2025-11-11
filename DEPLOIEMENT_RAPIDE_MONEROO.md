# ⚡ Déploiement Rapide de l'Edge Function Moneroo

## 🎯 Méthode la Plus Simple : Via Dashboard Supabase

### 📋 Étapes Rapides

1. **Ouvrir le Dashboard Supabase**
   - Allez sur : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb
   - Connectez-vous si nécessaire

2. **Accéder à l'Edge Function**
   - Menu de gauche → **Edge Functions**
   - Cliquez sur **moneroo**

3. **Ouvrir l'Éditeur de Code**
   - Cliquez sur l'onglet **Code** en haut

4. **Copier le Code**
   - Ouvrez le fichier : `MONEROO_EDGE_FUNCTION_CODE.txt` dans votre projet
   - Ou ouvrez : `supabase/functions/moneroo/index.ts`
   - **Sélectionnez tout** (Ctrl+A) et **Copiez** (Ctrl+C)
   - ⚠️ **Important** : Si vous copiez depuis `index.ts`, supprimez la première ligne `/// <reference path="../deno.d.ts" />` car elle n'est pas nécessaire dans le Dashboard

5. **Coller dans le Dashboard**
   - Dans l'éditeur du Dashboard, **Sélectionnez tout** (Ctrl+A)
   - **Supprimez** le contenu existant
   - **Collez** le nouveau code (Ctrl+V)

6. **Déployer**
   - Cliquez sur **Deploy** (bouton en haut à droite)
   - Attendez la confirmation : "Function deployed successfully"

7. **Vérifier**
   - Cliquez sur l'onglet **Details**
   - Vérifiez que "Last updated at" est mis à jour

## ✅ Code Prêt à Copier

Le code complet se trouve dans :
- **`MONEROO_EDGE_FUNCTION_CODE.txt`** ← **RECOMMANDÉ** (sans référence aux types)
- **`supabase/functions/moneroo/index.ts`** (supprimez la première ligne)

## 🔍 Vérification Post-Déploiement

### 1. Vérifier les Secrets
- **Settings** → **Edge Functions** → **Secrets**
- Vérifiez que `MONEROO_API_KEY` est configuré
- Si non, ajoutez-le :
  - Nom : `MONEROO_API_KEY`
  - Valeur : Votre clé API Moneroo

### 2. Tester le Paiement
- Allez sur : https://payhula.vercel.app/marketplace
- Essayez d'acheter un produit
- Ouvrez la console (F12) pour voir les logs

### 3. Vérifier les Logs
- **Edge Functions** → **moneroo** → **Logs**
- Vous devriez voir les logs avec le préfixe `[Moneroo Edge Function]`

## 🐛 Si le Déploiement Échoue

1. **Vérifiez la syntaxe du code**
   - Assurez-vous qu'il n'y a pas d'erreurs
   - Vérifiez que tous les imports sont corrects

2. **Vérifiez les Secrets**
   - `MONEROO_API_KEY` doit être configuré
   - `SITE_URL` est optionnel (défaut : `https://payhula.vercel.app`)

3. **Réessayez**
   - Déployez à nouveau
   - Vérifiez les logs pour les erreurs

## 📝 Checklist

- [ ] Code copié depuis `MONEROO_EDGE_FUNCTION_CODE.txt`
- [ ] Code collé dans le Dashboard Supabase
- [ ] Code déployé avec succès
- [ ] "Last updated at" mis à jour
- [ ] `MONEROO_API_KEY` configuré dans les Secrets
- [ ] Test de paiement effectué
- [ ] Logs vérifiés

## 🚀 C'est Tout !

Une fois déployé, l'Edge Function devrait fonctionner avec les logs améliorés pour faciliter le diagnostic des erreurs.

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **GUIDE_DEPLOIEMENT_MONEROO_DASHBOARD.md** (guide détaillé)
- **CORRECTION_ERREUR_FAILED_TO_FETCH.md** (diagnostic des erreurs)






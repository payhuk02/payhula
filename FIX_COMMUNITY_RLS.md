# 🔧 CORRECTION DES ERREURS 403 - COMMUNITY RLS

## Problème
Les erreurs 403 (Forbidden) se produisent car les politiques RLS bloquent l'accès aux tables `community_members` et `community_posts` pour les utilisateurs non authentifiés et même pour certains utilisateurs authentifiés.

## Solution
Une migration SQL a été créée pour corriger les politiques RLS. Vous devez l'appliquer dans votre dashboard Supabase.

## Étapes pour corriger

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu du fichier `supabase/migrations/20250131_fix_community_rls.sql`
5. Cliquez sur **Run** pour exécuter le script

### Option 2 : Via Supabase CLI

Si vous avez Supabase CLI installé localement :

```bash
cd supabase
npx supabase db push
```

## Ce que fait la migration

1. **Supprime les anciennes politiques RLS** qui bloquaient l'accès
2. **Crée de nouvelles politiques** qui permettent :
   - ✅ Accès public (sans authentification) aux membres approuvés
   - ✅ Accès public aux posts publiés
   - ✅ Utilisateurs authentifiés peuvent voir leur propre profil même s'il n'est pas approuvé
   - ✅ Utilisateurs authentifiés peuvent créer leur profil de membre
   - ✅ Membres approuvés peuvent créer des posts
   - ✅ Admins peuvent tout gérer

## Vérification

Après avoir appliqué la migration, testez :

1. Accédez à `/community` sans être connecté → Les posts publiés doivent s'afficher
2. Connectez-vous et créez un profil de membre → Doit fonctionner
3. Une fois approuvé, créez un post → Doit fonctionner

## Notes importantes

- Les politiques utilisent `profiles.role = 'admin'` au lieu de `raw_user_meta_data->>'role'` pour une meilleure compatibilité
- Les utilisateurs non authentifiés peuvent voir les posts publiés et les membres approuvés
- Seuls les membres approuvés peuvent créer des posts
- Les admins ont accès complet à toutes les données


# 📋 Instructions de Vérification des Images Artiste

## 🎯 Objectif

Vérifier que les images (photo artiste et images œuvre) sont correctement sauvegardées dans la base de données après la création d'un produit artistique.

## ⚠️ Diagnostic Actuel

D'après les résultats SQL que vous avez partagés, **tous les compteurs sont à 0**, ce qui signifie :

1. **Soit** : Aucun produit artistique n'a été créé dans la base de données
2. **Soit** : Les produits ont été créés mais sans images (images non uploadées avant la sauvegarde)

## 📝 Étapes à Suivre

### Étape 1 : Créer un Produit Artiste Complet

**IMPORTANT** : Pour que les images soient sauvegardées, vous devez :

1. ✅ **Ouvrir le wizard de création** d'un produit artiste
2. ✅ **Étape 2 (Informations de base)** :
   - Uploader **une photo artiste** (bouton "Uploader photo artiste")
   - Uploader **au moins 1 image œuvre** (bouton "Ajouter des images")
   - Attendre que les uploads se terminent (barre de progression à 100%)
   - Vérifier que les images s'affichent dans le formulaire
3. ✅ **Compléter toutes les étapes** du wizard
4. ✅ **Cliquer sur "Publier"** (pas "Enregistrer comme brouillon")

> ⚠️ **CRITIQUE** : Les images doivent être uploadées **AVANT** de cliquer sur "Publier". Si vous cliquez sur "Publier" sans avoir uploadé d'images, le produit sera créé mais sans images.

### Étape 2 : Exécuter le Diagnostic SQL

1. **Ouvrir Supabase SQL Editor**
2. **Ouvrir le fichier** `DIAGNOSTIC_COMPLET_IMAGES_ARTISTE.sql`
3. **Exécuter les requêtes UNE PAR UNE** dans l'ordre :

#### Requête 1 : Vérifier l'existence de produits
```sql
SELECT 
  'ÉTAPE 1: Produits artistiques' as diagnostic,
  COUNT(*) as total_produits,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ AUCUN PRODUIT CRÉÉ - Créez d''abord un produit'
    ELSE '✅ Produits trouvés'
  END as statut
FROM products
WHERE product_type = 'artist';
```

**Résultat attendu** :
- Si `total_produits = 0` : Aucun produit n'a été créé → **Créez d'abord un produit**
- Si `total_produits > 0` : Des produits existent → **Passez à la requête 2**

#### Requête 2 : Voir tous les produits
Cette requête montre tous les produits avec leur statut d'images.

**Résultat attendu** :
- `image_principale` : Doit afficher "✅" avec une URL
- `statut_images` : Doit afficher "✅ X image(s)" où X > 0
- `statut_photo_artiste` : Doit afficher "✅ Photo présente"

#### Requête 3 : Détails des images
Cette requête montre le contenu exact des champs `images` et `artist_photo_url`.

**Résultat attendu** :
- `image_url` : URL de la première image (non NULL)
- `images` : Tableau JSON avec toutes les URLs (non NULL, non vide)
- `artist_photo_url` : URL de la photo artiste (non NULL)

#### Requête 4 : Statistiques
Cette requête donne des statistiques globales.

**Résultat attendu** :
- `avec_images_tableau` > 0
- `avec_photo_artiste` > 0
- `avec_toutes_images` > 0

### Étape 3 : Vérifier dans Supabase Storage

1. **Aller dans Supabase Dashboard** > **Storage** > **product-images**
2. **Chercher le dossier** `artist/`
3. **Vérifier la présence de** :
   - Fichiers `artist-photo_*.jpeg` (photo artiste)
   - Fichiers `artwork_*.jpeg` (images œuvre)

## 🔍 Diagnostic des Problèmes

### Problème 1 : `total_produits = 0`

**Cause** : Aucun produit n'a été créé avec succès.

**Solution** :
1. Vérifier les logs de la console du navigateur lors de la création
2. Vérifier qu'il n'y a pas d'erreur lors de la sauvegarde
3. Vérifier que vous êtes connecté avec le bon compte
4. Vérifier le `store_id` dans la table `products`

### Problème 2 : Produits existent mais `images` est NULL ou vide

**Cause** : Les images n'ont pas été uploadées avant la sauvegarde.

**Solution** :
1. **Créer un nouveau produit** en suivant l'Étape 1 ci-dessus
2. **S'assurer que les images sont uploadées** avant de cliquer sur "Publier"
3. Vérifier les logs de la console lors de l'upload :
   - Chercher les messages "✅ Images uploadées"
   - Chercher les messages "✅ Photo artiste uploadée avec succès"
4. Vérifier que les images s'affichent dans le formulaire avant de continuer

### Problème 3 : `artist_photo_url` est NULL

**Cause** : La photo artiste n'a pas été uploadée.

**Solution** :
1. Vérifier que vous avez bien cliqué sur "Uploader photo artiste"
2. Vérifier que l'upload s'est terminé avec succès (barre de progression)
3. Vérifier que la photo s'affiche dans le formulaire
4. Vérifier les logs de la console pour des erreurs d'upload

### Problème 4 : Images uploadées mais non sauvegardées

**Cause** : Les images sont dans `formData` mais ne sont pas passées à la base de données.

**Solution** :
1. Vérifier le code de sauvegarde dans `CreateArtistProductWizard.tsx` (lignes 262-263 et 299)
2. Vérifier qu'il n'y a pas d'erreur lors de l'insertion dans la base de données
3. Vérifier les logs de la console pour des erreurs SQL

## ✅ Checklist de Vérification

Avant de créer un produit, vérifiez :

- [ ] Vous êtes connecté avec le bon compte
- [ ] Vous avez sélectionné la bonne boutique
- [ ] Le wizard de création s'ouvre correctement
- [ ] Vous pouvez uploader des images (pas d'erreur)

Pendant la création :

- [ ] Photo artiste uploadée avec succès (barre de progression à 100%)
- [ ] Photo artiste visible dans le formulaire
- [ ] Au moins 1 image œuvre uploadée avec succès
- [ ] Images œuvre visibles dans le formulaire
- [ ] Toutes les étapes complétées
- [ ] Cliqué sur "Publier" (pas "Brouillon")

Après la création :

- [ ] Message de succès affiché
- [ ] Produit visible dans la liste des produits
- [ ] Requête SQL Étape 1 retourne `total_produits > 0`
- [ ] Requête SQL Étape 2 montre des images
- [ ] Fichiers présents dans Supabase Storage

## 📞 Support

Si après avoir suivi ces étapes les images ne sont toujours pas sauvegardées :

1. **Partager les logs de la console** lors de la création du produit
2. **Partager les résultats** des requêtes SQL
3. **Partager une capture d'écran** du formulaire avec les images uploadées


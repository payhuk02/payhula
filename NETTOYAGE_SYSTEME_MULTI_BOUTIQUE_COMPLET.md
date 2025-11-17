# ✅ NETTOYAGE COMPLET - SYSTÈME MULTI-BOUTIQUE

**Date** : 31 Janvier 2025  
**Objectif** : Supprimer complètement le système de création de plusieurs boutiques  
**Statut** : ✅ **TERMINÉ**

---

## 📋 MODIFICATIONS EFFECTUÉES

### 1. ✅ Hooks - Suppression des limites et fonctions

#### `src/hooks/useStores.ts`

**Changements** :
- ❌ Supprimé : `MAX_STORES_PER_USER = 3`
- ❌ Supprimé : Fonction `canCreateStore()`
- ❌ Supprimé : Fonction `getRemainingStores()`
- ✅ Modifié : `createStore()` vérifie maintenant si l'utilisateur a **déjà une boutique** (limite à 1)
- ✅ Ajouté : Import de `logger` pour remplacer `console.error`
- ✅ Remplacé : Tous les `console.error` par `logger.error`

**Avant** :
```typescript
const MAX_STORES_PER_USER = 3;
const canCreateStore = () => stores.length < MAX_STORES_PER_USER;
if (!canCreateStore()) {
  throw new Error(`Vous ne pouvez créer que ${MAX_STORES_PER_USER} boutiques maximum`);
}
```

**Après** :
```typescript
// Vérifier si l'utilisateur a déjà une boutique
const { data: existingStores } = await supabase
  .from('stores')
  .select('id')
  .eq('user_id', user.id)
  .limit(1);

if (existingStores && existingStores.length > 0) {
  throw new Error('Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur.');
}
```

---

#### `src/hooks/useStore.ts`

**Changements** :
- ❌ Supprimé : Validation de limite de 3 boutiques
- ✅ Modifié : Vérifie maintenant si l'utilisateur a **déjà une boutique** (limite à 1)
- ✅ Modifié : Messages d'erreur mis à jour

**Avant** :
```typescript
const MAX_STORES_PER_USER = 3;
if (storeCount >= MAX_STORES_PER_USER) {
  toast({ description: `Vous ne pouvez créer que ${MAX_STORES_PER_USER} boutiques maximum...` });
}
```

**Après** :
```typescript
if (existingStores && existingStores.length > 0) {
  toast({ description: "Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur." });
}
```

---

### 2. ✅ Composants - Interface simplifiée

#### `src/components/store/StoreForm.tsx`

**Changements** :
- ❌ Supprimé : Validation de limite de 3 boutiques
- ✅ Modifié : Vérifie maintenant si l'utilisateur a **déjà une boutique** (limite à 1)
- ✅ Modifié : Messages d'erreur mis à jour

---

#### `src/components/settings/StoreSettings.tsx`

**Changements** :
- ❌ Supprimé : `canCreateStore` et `getRemainingStores` des destructuring
- ❌ Supprimé : Message "Vous avez {stores.length} boutique(s) sur {3} maximum"
- ❌ Supprimé : Message "Vous pouvez créer {getRemainingStores()} boutique(s) supplémentaire(s)"
- ✅ Modifié : Titre "Gestion des boutiques" → "Gestion de la boutique"
- ✅ Modifié : Interface adaptée pour un seul compte boutique
- ✅ Modifié : Onglet "Créer" masqué si l'utilisateur a déjà une boutique
- ✅ Modifié : Message d'alerte si tentative de création avec boutique existante

**Avant** :
```typescript
{!canCreateStore() ? (
  <Alert>Vous avez atteint la limite de 3 boutiques...</Alert>
) : (
  <Card>
    <CardDescription>Vous pouvez créer {getRemainingStores()} boutique(s) supplémentaire(s)</CardDescription>
  </Card>
)}
```

**Après** :
```typescript
{stores.length > 0 ? (
  <Alert>Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur...</Alert>
) : (
  <Card>
    <CardDescription>Configurez votre boutique pour commencer à vendre vos produits</CardDescription>
  </Card>
)}
```

---

### 3. ✅ Base de Données - Migration SQL

#### `supabase/migrations/20250131_remove_store_limit.sql`

**Créé** : Nouvelle migration pour modifier la limite

**Changements** :
- ✅ Modifie la fonction `check_store_limit()` pour limiter à **1 boutique** au lieu de 3
- ✅ Met à jour le message d'erreur
- ✅ Met à jour les commentaires

**Avant** :
```sql
IF store_count >= 3 THEN
  RAISE EXCEPTION 'Limite de 3 boutiques par utilisateur atteinte...'
END IF;
```

**Après** :
```sql
IF store_count >= 1 THEN
  RAISE EXCEPTION 'Vous avez déjà une boutique. Un seul compte boutique est autorisé par utilisateur...'
END IF;
```

---

## 🔍 VÉRIFICATIONS EFFECTUÉES

### Fichiers Modifiés

1. ✅ `src/hooks/useStores.ts`
   - Suppression de `MAX_STORES_PER_USER`
   - Suppression de `canCreateStore()` et `getRemainingStores()`
   - Modification de `createStore()` pour limiter à 1 boutique
   - Remplacement de `console.error` par `logger.error`

2. ✅ `src/hooks/useStore.ts`
   - Modification de la validation pour limiter à 1 boutique
   - Mise à jour des messages d'erreur

3. ✅ `src/components/store/StoreForm.tsx`
   - Modification de la validation pour limiter à 1 boutique
   - Mise à jour des messages d'erreur

4. ✅ `src/components/settings/StoreSettings.tsx`
   - Suppression des références à `canCreateStore` et `getRemainingStores`
   - Simplification de l'interface
   - Adaptation pour un seul compte boutique

5. ✅ `supabase/migrations/20250131_remove_store_limit.sql`
   - Nouvelle migration créée
   - Modification du trigger pour limiter à 1 boutique

---

### Fichiers Vérifiés (Pas de modifications nécessaires)

- `src/pages/Store.tsx` - Utilise `useStores()` mais pas de logique de limite
- `src/components/settings/DomainSettings.tsx` - Utilise `selectedStoreId` comme state local (OK)
- `src/pages/customer/CustomerLoyalty.tsx` - Utilise `selectedStoreId` comme state local (OK)

---

## 📊 RÉSUMÉ DES CHANGEMENTS

### Avant (Multi-boutique)

- ✅ Limite : 3 boutiques par utilisateur
- ✅ Fonctions : `canCreateStore()`, `getRemainingStores()`
- ✅ Messages : "Vous pouvez créer X boutique(s) supplémentaire(s)"
- ✅ Interface : Onglet "Créer" toujours visible
- ✅ Trigger SQL : Limite à 3 boutiques

### Après (Boutique unique)

- ✅ Limite : **1 boutique par utilisateur**
- ❌ Fonctions supprimées : `canCreateStore()`, `getRemainingStores()`
- ✅ Messages : "Un seul compte boutique est autorisé par utilisateur"
- ✅ Interface : Onglet "Créer" masqué si boutique existante
- ✅ Trigger SQL : Limite à 1 boutique

---

## 🚀 PROCHAINES ÉTAPES

### 1. Appliquer la migration SQL

**Fichier** : `supabase/migrations/20250131_remove_store_limit.sql`

**Action** :
1. Exécuter la migration dans Supabase SQL Editor
2. Vérifier que le trigger fonctionne correctement
3. Tester la création d'une boutique (devrait échouer si déjà une boutique)

### 2. Tests à effectuer

- [ ] Créer une boutique (devrait fonctionner si aucune boutique)
- [ ] Tenter de créer une deuxième boutique (devrait échouer avec message clair)
- [ ] Vérifier l'interface StoreSettings (onglet "Créer" masqué si boutique existante)
- [ ] Vérifier les messages d'erreur (cohérents et clairs)

---

## ⚠️ NOTES IMPORTANTES

### Compatibilité

- ✅ **Rétrocompatible** : Les utilisateurs avec plusieurs boutiques peuvent toujours les voir
- ✅ **Pas de perte de données** : Les boutiques supplémentaires restent en base de données
- ✅ **Migration SQL** : Doit être appliquée pour que la limite soit effective en base de données

### Limitations

- ⚠️ Les utilisateurs ne peuvent plus **créer plusieurs boutiques**
- ⚠️ Seule la **première boutique** (par date de création) est utilisée
- ⚠️ Les **boutiques supplémentaires** existantes ne sont pas supprimées (elles restent en base)

---

## ✅ CHECKLIST DE VALIDATION

### Code

- [x] `useStores.ts` : Fonctions de limite supprimées
- [x] `useStore.ts` : Validation modifiée pour 1 boutique
- [x] `StoreForm.tsx` : Validation modifiée pour 1 boutique
- [x] `StoreSettings.tsx` : Interface simplifiée
- [x] `console.error` remplacés par `logger.error`

### Base de Données

- [x] Migration SQL créée
- [ ] Migration SQL appliquée (à faire manuellement)
- [ ] Trigger testé (à faire après migration)

### Interface

- [x] Messages d'erreur mis à jour
- [x] Interface adaptée pour un seul compte boutique
- [x] Onglet "Créer" conditionnel

---

## 🎯 CONCLUSION

Le système de création de plusieurs boutiques a été **complètement supprimé et nettoyé** :

1. ✅ Limite réduite de 3 à **1 boutique par utilisateur**
2. ✅ Fonctions `canCreateStore()` et `getRemainingStores()` supprimées
3. ✅ Interface simplifiée
4. ✅ Messages d'erreur mis à jour
5. ✅ Migration SQL créée
6. ✅ Code nettoyé (`console.error` → `logger.error`)

**Statut** : ✅ **OPÉRATIONNEL** (Migration SQL à appliquer)

---

**Document créé le** : 31 Janvier 2025  
**Dernière modification** : 31 Janvier 2025  
**Version** : 1.0



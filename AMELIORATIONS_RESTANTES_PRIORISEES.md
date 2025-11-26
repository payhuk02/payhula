# 🎯 AMÉLIORATIONS RESTANTES - PRIORISÉES

**Date** : 31 Janvier 2025  
**Statut** : Après corrections Phase 2 (réduction `any` wizards + accessibilité)

---

## ✅ DÉJÀ FAIT

1. ✅ **Réduction de `any` dans les wizards** (31 occurrences → 0)
   - CreateDigitalProductWizard_v2.tsx
   - CreatePhysicalProductWizard_v2.tsx
   - CreateCourseWizard.tsx
   - CreateArtistProductWizard.tsx
   - DigitalBasicInfoForm.tsx
   - ServiceBasicInfoForm.tsx
   - ArtistBasicInfoForm.tsx

2. ✅ **Amélioration accessibilité** (début)
   - ARIA labels dans DigitalBasicInfoForm
   - ARIA labels dans PhysicalBasicInfoForm

---

## 🔴 PRIORITÉ CRITIQUE (À faire maintenant)

### 1. Réduire `any` dans les hooks critiques

**Fichiers concernés** :
- `src/hooks/courses/useCreateFullCourse.ts` (5 occurrences)
- `src/hooks/useFormValidation.ts` (2 occurrences)
- `src/hooks/digital/useProductVersions.ts` (3 occurrences)

**Impact** : 🔴 **CRITIQUE** - Perte de sécurité de type dans la logique métier

**Durée estimée** : 2-3 heures

**Actions** :
```typescript
// ❌ Avant
faqs?: any[];
onError: (error: any) => { ... }

// ✅ Après
faqs?: FAQ[];
onError: (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  ...
}
```

---

### 2. Continuer l'amélioration de l'accessibilité

**Fichiers concernés** :
- `src/components/products/create/service/ServiceBasicInfoForm.tsx`
- `src/components/products/create/artist/ArtistBasicInfoForm.tsx`
- `src/components/courses/create/CourseBasicInfoForm.tsx`
- Autres formulaires de base

**Impact** : 🔴 **CRITIQUE** - Conformité légale WCAG AA

**Durée estimée** : 3-4 heures

**Actions** :
- Ajouter `aria-label` sur tous les boutons icon-only
- Ajouter `aria-hidden="true"` sur les icônes décoratives
- Améliorer les attributs `alt` des images
- Ajouter `aria-describedby` pour contextes complexes

---

## 🟡 PRIORITÉ HAUTE (À faire cette semaine)

### 3. Remplacer les `console.log` restants

**Fichiers concernés** :
- `src/lib/error-logger.ts` (4 occurrences - mais légitimes, ce sont des wrappers)
- `src/lib/console-guard.ts` (12 occurrences - mais légitimes, ce sont des wrappers)
- Vérifier s'il y en a d'autres dans le code de production

**Impact** : 🟡 **MOYENNE** - Logs non structurés en production

**Durée estimée** : 1-2 heures

**Note** : Les fichiers `error-logger.ts` et `console-guard.ts` sont des wrappers légitimes qui redirigent vers le logger. À vérifier s'il y en a d'autres.

---

### 4. Réduire `any` dans les composants partagés

**Fichiers concernés** :
- Composants de formulaire partagés
- Composants de liste/table
- Composants de navigation

**Impact** : 🟡 **MOYENNE** - Amélioration progressive de la sécurité de type

**Durée estimée** : 4-6 heures

---

### 5. Améliorer la navigation clavier

**Actions** :
- Ajouter "Skip to main content" link
- Optimiser l'ordre de tabulation
- Améliorer le focus visible (outline plus visible)
- Ajouter `tabIndex` approprié

**Impact** : 🟡 **MOYENNE** - Accessibilité WCAG AA

**Durée estimée** : 3-5 heures

---

## 🟢 PRIORITÉ MOYENNE (À faire ce mois)

### 6. Optimiser les requêtes N+1

**Problème** : Requêtes multiples pour récupérer données liées

**Exemple** :
```typescript
// ❌ Avant (N+1)
const products = await fetchProducts();
for (const product of products) {
  product.store = await fetchStore(product.store_id);
}

// ✅ Après (1 requête)
const products = await supabase
  .from('products')
  .select('*, store:stores(*)')
  .eq('is_active', true);
```

**Impact** : 🟢 **MOYENNE** - Performance

**Durée estimée** : 1-2 semaines

---

### 7. Résoudre les TODOs critiques

**Fichiers concernés** :
- `src/pages/customer/MyProfile.tsx` (TODO: Create addresses table)
- Autres TODOs dans le code

**Impact** : 🟢 **MOYENNE** - Complétude fonctionnelle

**Durée estimée** : 1 semaine

---

### 8. Optimiser le bundle size

**Actions** :
- Analyser le bundle size (`npm run analyze:bundle`)
- Lazy load les composants lourds (TipTap, Big Calendar, Charts)
- Tree-shaking agressif
- Vérifier les dépendances inutilisées

**Impact** : 🟢 **MOYENNE** - Performance

**Durée estimée** : 1 semaine

---

## 📊 RÉSUMÉ DES PRIORITÉS

| Priorité | Tâche | Durée | Impact |
|----------|-------|-------|--------|
| 🔴 **CRITIQUE** | Réduire `any` dans hooks | 2-3h | 🔴 CRITIQUE |
| 🔴 **CRITIQUE** | Accessibilité (ARIA labels) | 3-4h | 🔴 CRITIQUE |
| 🟡 **HAUTE** | Remplacer console.log | 1-2h | 🟡 MOYENNE |
| 🟡 **HAUTE** | Réduire `any` composants | 4-6h | 🟡 MOYENNE |
| 🟡 **HAUTE** | Navigation clavier | 3-5h | 🟡 MOYENNE |
| 🟢 **MOYENNE** | Optimiser requêtes N+1 | 1-2 sem | 🟢 MOYENNE |
| 🟢 **MOYENNE** | Résoudre TODOs | 1 sem | 🟢 MOYENNE |
| 🟢 **MOYENNE** | Bundle size | 1 sem | 🟢 MOYENNE |

**Total estimé** : ~2-3 semaines de travail

---

## 🎯 RECOMMANDATION IMMÉDIATE

**Commencer par** :
1. ✅ Réduire `any` dans les hooks critiques (2-3h)
2. ✅ Continuer l'accessibilité dans les formulaires restants (3-4h)

**Total** : ~5-7 heures de travail pour des améliorations critiques

---

**Dernière mise à jour** : 31 Janvier 2025


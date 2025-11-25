# Prompt pour continuer les corrections d'espacement dans les formulaires

## Contexte

Il y a un problème d'espacement dans les champs Input/Textarea de la plateforme Payhuk : les espaces ne sont pas enregistrés lors de la saisie. Une solution a été implémentée avec le hook `useSpaceInputFix` qui force l'insertion manuelle des espaces.

## Solution implémentée

Le hook `useSpaceInputFix` (`src/hooks/useSpaceInputFix.ts`) fournit un gestionnaire `handleKeyDown` qui doit être appliqué aux composants `Input` et `Textarea` qui acceptent du texte libre (noms, descriptions, titres, commentaires, etc.).

### Utilisation

```typescript
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

// Dans le composant
const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

// Sur les Input/Textarea
<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onKeyDown={handleSpaceKeyDown}  // ← Ajouter cette ligne
/>
<Textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onKeyDown={handleSpaceKeyDown}  // ← Ajouter cette ligne
/>
```

## Fichiers déjà corrigés

Les fichiers suivants ont déjà été corrigés et ne doivent PAS être modifiés :

1. `src/components/products/EditProductDialog.tsx`
2. `src/components/products/CreateProductDialog.tsx`
3. `src/components/products/tabs/ProductCustomFieldsTab.tsx`
4. `src/components/courses/assignments/AssignmentSubmissionForm.tsx`
5. `src/components/digital/DigitalBundleManager.tsx`
6. `src/components/physical/warranties/WarrantiesManagement.tsx`
7. `src/components/affiliate/RegistrationDialog.tsx`
8. `src/components/affiliate/CreateAffiliateLinkDialog.tsx`
9. `src/components/physical/promotions/PromotionsManager.tsx`
10. `src/components/promotions/CreatePromotionDialog.tsx`
11. `src/components/customers/CreateCustomerDialog.tsx`
12. `src/components/physical/warehouses/WarehousesManagement.tsx`
13. `src/components/products/tabs/ProductFAQTab.tsx`
14. `src/components/reviews/ReviewForm.tsx`
15. `src/components/storefront/ContactForm.tsx`
16. `src/components/products/create/digital/DigitalBasicInfoForm.tsx`
17. `src/components/products/create/physical/PhysicalBasicInfoForm.tsx`
18. `src/components/products/create/service/ServiceBasicInfoForm.tsx`
19. `src/components/courses/create/CourseBasicInfoForm.tsx`
20. `src/components/settings/ProfileSettings.tsx`
21. `src/components/settings/StoreSettings.tsx`
22. `src/components/store/StoreDetails.tsx`
23. `src/components/store/StoreForm.tsx`
24. `src/pages/customer/MyProfile.tsx`

## Instructions pour continuer

1. **Rechercher tous les fichiers** contenant des composants `Input` ou `Textarea` avec `onChange` qui ne sont PAS dans la liste ci-dessus.

2. **Identifier les champs concernés** :
   - Champs de texte libre : noms, descriptions, titres, commentaires, messages, notes, adresses, villes, pays, etc.
   - **EXCLURE** : champs numériques (`type="number"`), emails (`type="email"`), URLs (`type="url"`), téléphones (`type="tel"`), mots de passe, dates, etc.
   - **INCLURE** : tous les `Textarea` qui acceptent du texte libre

3. **Pour chaque fichier identifié** :
   - Ajouter l'import : `import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';`
   - Ajouter le hook dans le composant : `const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();`
   - Ajouter `onKeyDown={handleSpaceKeyDown}` à tous les `Input` et `Textarea` concernés

4. **Vérifier** :
   - Aucune erreur de linting
   - Les champs numériques, emails, URLs ne doivent PAS avoir le hook (sauf si c'est un champ texte libre qui peut contenir des espaces)

5. **Fichiers à examiner en priorité** :
   - Tous les fichiers `*Dialog*.tsx` (dialogs de création/édition)
   - Tous les fichiers `*Form*.tsx` (formulaires)
   - Les composants de gestion (managers, settings, etc.)
   - Les pages avec formulaires (`src/pages/**/*.tsx`)

## Exemple de correction

**Avant :**
```typescript
<Input
  id="name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Nom du produit"
/>
```

**Après :**
```typescript
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

// Dans le composant
const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

<Input
  id="name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onKeyDown={handleSpaceKeyDown}
  placeholder="Nom du produit"
/>
```

## Critères d'identification

Un champ doit être corrigé si :
- ✅ C'est un `Input` avec `type="text"` (ou sans type) qui accepte du texte libre
- ✅ C'est un `Textarea` qui accepte du texte libre
- ✅ Le champ peut contenir des espaces (noms, descriptions, adresses, etc.)
- ❌ Ce n'est PAS un champ numérique, email, URL, téléphone, mot de passe, date

## Commandes utiles

```bash
# Rechercher tous les fichiers avec Input/Textarea
grep -r "from.*@/components/ui/input\|from.*@/components/ui/textarea" src --include="*.tsx" | cut -d: -f1 | sort -u

# Vérifier les erreurs de linting
npm run lint
```

---

**Note** : Ce prompt peut être réutilisé à chaque fois qu'on veut continuer les corrections. Il suffit de mettre à jour la liste des fichiers déjà corrigés avant de continuer.


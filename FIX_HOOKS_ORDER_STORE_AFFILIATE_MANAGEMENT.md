# 🔧 Correction : Violation des Règles des Hooks React

**Date** : 31 Janvier 2025  
**Fichier** : `src/pages/dashboard/StoreAffiliateManagement.tsx`  
**Erreur** : `Rendered more hooks than during the previous render`

---

## ❌ Problème

Le composant `StoreAffiliateManagement` violait les **Règles des Hooks React** en appelant le hook `useStoreAffiliates` **après** des retours conditionnels (`if (storeLoading)` et `if (!store)`).

### Erreur React
```
Error: Rendered more hooks than during the previous render.
  at useToast (use-toast.ts:167:35)
  at useStoreAffiliates (useStoreAffiliates.ts:101:21)
  at StoreAffiliateManagement (StoreAffiliateManagement.tsx:93:7)
```

### Code Problématique (AVANT)
```typescript
export default function StoreAffiliateManagement() {
  const { store, loading: storeLoading } = useStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<string>('all');

  // ❌ Retours conditionnels AVANT l'appel du hook
  if (storeLoading) {
    return <LoadingState />;
  }

  if (!store) {
    return <NoStoreState />;
  }

  // ❌ Hook appelé APRÈS les retours conditionnels
  const {
    links,
    commissions,
    approveCommission,
    rejectCommission,
    isLoading,
  } = useStoreAffiliates(store.id);
  // ...
}
```

---

## ✅ Solution

**Tous les hooks doivent être appelés AVANT les retours conditionnels**, dans le même ordre à chaque rendu.

### Code Corrigé (APRÈS)
```typescript
export default function StoreAffiliateManagement() {
  const { store, loading: storeLoading } = useStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<string>('all');

  // ✅ Tous les hooks appelés AVANT les retours conditionnels
  const {
    links,
    commissions,
    approveCommission,
    rejectCommission,
    isLoading,
  } = useStoreAffiliates(store?.id || ''); // Utiliser store?.id avec fallback

  // ✅ Retours conditionnels APRÈS tous les hooks
  if (storeLoading) {
    return <LoadingState />;
  }

  if (!store) {
    return <NoStoreState />;
  }
  // ...
}
```

---

## 🔍 Pourquoi ça fonctionne maintenant ?

1. **Ordre constant des hooks** : Tous les hooks sont appelés dans le même ordre à chaque rendu, même si `store` est `null` ou `undefined`.

2. **Hook protégé** : Le hook `useStoreAffiliates` utilise `enabled: !!storeId` pour désactiver les requêtes quand `storeId` est vide :
   ```typescript
   const { data: commissions = [] } = useQuery({
     queryKey: ['store-affiliate-commissions', storeId],
     queryFn: async () => { /* ... */ },
     enabled: !!storeId, // ✅ Ne fait pas de requête si storeId est vide
   });
   ```

3. **Valeurs par défaut** : Le hook retourne des tableaux vides par défaut (`links = []`, `commissions = []`), donc le composant peut utiliser ces valeurs même si `store` n'est pas encore chargé.

---

## 📋 Règles des Hooks React

Les hooks doivent être :
1. ✅ Appelés **toujours dans le même ordre**
2. ✅ Appelés **au niveau racine** du composant (pas dans des conditions, boucles, ou fonctions imbriquées)
3. ✅ Appelés **avant tous les retours conditionnels**

---

## ✅ Résultat

- ✅ Plus d'erreur "Rendered more hooks than during the previous render"
- ✅ Le composant fonctionne correctement même pendant le chargement
- ✅ Le composant fonctionne correctement même si `store` est `null`
- ✅ Les requêtes ne sont pas déclenchées inutilement quand `storeId` est vide

---

**Correction réalisée par** : Auto (Cursor AI)  
**Date** : 31 Janvier 2025


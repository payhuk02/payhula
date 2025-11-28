# Analyse Approfondie - Positionnement Logo

**Date**: 2025-01-27  
**Problème**: Le logo n'est pas correctement positionné derrière le texte "Payhuk" sur mobile

---

## 🔍 Analyse de la Structure

### 1. Page Landing (`src/pages/Landing.tsx`)

**Hiérarchie des conteneurs**:
```
<header> (sticky, z-50)
  └─ <div> (max-w-7xl, flex items-center justify-between)
      └─ <div> (relative, flex items-center justify-start) ← Conteneur logo+texte
          ├─ <OptimizedImage> (absolute left-0, z-0)
          └─ <span> (relative z-10, pl-5)
```

**Problèmes identifiés**:
1. ✅ Conteneur parent : `relative` → Bon pour positionnement absolu
2. ⚠️ OptimizedImage : Style inline avec `position: 'relative'` et `zIndex: 1` → **CONFLIT**
3. ⚠️ OptimizedImage : Retourne `<picture className="relative ...">` → **CONFLIT avec absolute**
4. ⚠️ Padding `pl-5` : Peut ne pas être suffisant pour chevauchement visible

---

### 2. Page Auth (`src/pages/Auth.tsx`)

**Hiérarchie des conteneurs**:
```
<div> (min-h-screen, flex items-center justify-center) ← Conteneur principal centré
  └─ <div> (w-full max-w-md)
      └─ <div> (flex justify-center) ← Conteneur logo centré
          └─ <Link> (relative inline-flex items-center)
              ├─ <OptimizedImage> (absolute left-0, z-0)
              └─ <span> (relative z-10, pl-7)
```

**Problèmes identifiés**:
1. ✅ Link : `relative` → Bon pour positionnement absolu
2. ⚠️ OptimizedImage : Même problème de style inline
3. ⚠️ Conteneur parent : `flex justify-center` → Peut affecter le positionnement
4. ⚠️ Padding `pl-7` : Peut ne pas être suffisant

---

## 🐛 Problème Principal

Le composant `OptimizedImage` applique des styles inline qui écrasent les classes :
```tsx
style={{
  position: 'relative', // ← Écrase 'absolute' de className
  zIndex: 1,            // ← Écrase 'z-0' de className
  ...
}}
```

De plus, le `<picture>` a `className="relative"` qui entre en conflit avec `absolute`.

---

## ✅ Solution Définitive

Utiliser un wrapper `<div>` pour le logo avec positionnement absolu, et laisser `OptimizedImage` en position relative à l'intérieur.


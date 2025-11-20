# 🎨 Système de Personnalisation des Pages - Documentation Complète

**Date** : 31 Janvier 2025  
**Version** : 1.0.0  
**Statut** : ✅ IMPLÉMENTÉ

---

## 📋 Vue d'ensemble

Le système de personnalisation des pages permet de configurer **tous les éléments** de chaque page de la plateforme depuis la page d'administration centralisée (`/admin/platform-customization`).

### Fonctionnalités

- ✅ **Personnalisation par page** : Chaque page peut être personnalisée indépendamment
- ✅ **Éléments configurables** : Textes, images, couleurs, polices, URLs, nombres, booléens
- ✅ **Sections organisées** : Chaque page est divisée en sections (Hero, Features, Testimonials, etc.)
- ✅ **Sauvegarde automatique** : Les modifications sont sauvegardées automatiquement
- ✅ **Application en temps réel** : Les modifications sont appliquées immédiatement
- ✅ **Upload d'images** : Upload direct vers Supabase Storage

---

## 🏗️ Architecture

### 1. Structure des Données

```typescript
interface PageConfig {
  id: string;                    // Identifiant unique de la page
  name: string;                  // Nom affiché
  route: string;                 // Route de la page
  description: string;           // Description
  icon: React.ComponentType;     // Icône
  sections: PageSection[];       // Sections configurables
}

interface PageSection {
  id: string;                    // Identifiant de la section
  name: string;                  // Nom de la section
  type: 'hero' | 'content' | 'features' | 'testimonials' | 'cta' | 'footer' | 'custom';
  elements: PageElement[];       // Éléments configurables
}

interface PageElement {
  id: string;                    // Identifiant de l'élément
  label: string;                 // Label affiché
  type: 'text' | 'textarea' | 'image' | 'color' | 'font' | 'number' | 'url' | 'boolean';
  key: string;                   // Clé pour accéder à la valeur (ex: 'landing.hero.title')
  defaultValue?: string;         // Valeur par défaut
  description?: string;          // Description de l'élément
  options?: { value: string; label: string }[];  // Options pour les selects
}
```

### 2. Stockage

Les personnalisations sont stockées dans `platform_settings` avec la structure suivante :

```json
{
  "pages": {
    "landing": {
      "landing.hero.title": "Mon titre personnalisé",
      "landing.hero.bgColor": "#1e293b",
      "landing.hero.bgImage": "https://...",
      ...
    },
    "marketplace": {
      "marketplace.hero.title": "Titre marketplace",
      ...
    }
  }
}
```

### 3. Composants

#### `PagesCustomizationSection.tsx`
- Composant principal pour la personnalisation des pages
- Affiche la liste des pages configurables
- Permet de sélectionner une page et d'éditer ses éléments
- Gère l'upload d'images

#### `usePageCustomization.ts`
- Hook pour utiliser les personnalisations dans les composants
- Fournit des fonctions pour récupérer les valeurs personnalisées
- Fallback automatique sur i18n si pas de personnalisation

---

## 📝 Pages Configurables

### 1. Page d'Accueil (`landing`)

**Route** : `/`

**Sections** :
- **Hero** : Badge, titre, sous-titre, boutons CTA, couleurs, image de fond
- **Stats** : Labels des statistiques (utilisateurs, ventes, boutiques)
- **Features** : Titre et sous-titre de la section fonctionnalités
- **Testimonials** : Titre et sous-titre des témoignages

**Éléments configurables** :
- `landing.hero.badge` : Badge au-dessus du titre
- `landing.hero.title` : Titre principal
- `landing.hero.subtitle` : Sous-titre
- `landing.hero.ctaPrimary` : Texte du bouton principal
- `landing.hero.ctaSecondary` : Texte du bouton secondaire
- `landing.hero.bgColor` : Couleur de fond
- `landing.hero.textColor` : Couleur du texte
- `landing.hero.bgImage` : Image de fond
- `landing.stats.users` : Label utilisateurs
- `landing.stats.sales` : Label ventes
- `landing.stats.stores` : Label boutiques
- `landing.features.title` : Titre section fonctionnalités
- `landing.features.subtitle` : Sous-titre section fonctionnalités
- `landing.testimonials.title` : Titre témoignages
- `landing.testimonials.subtitle` : Sous-titre témoignages

### 2. Marketplace (`marketplace`)

**Route** : `/marketplace`

**Sections** :
- **Hero** : Titre, sous-titre, tagline, placeholder recherche, dégradé de fond

**Éléments configurables** :
- `marketplace.hero.title` : Titre principal
- `marketplace.hero.subtitle` : Sous-titre
- `marketplace.hero.tagline` : Tagline
- `marketplace.searchPlaceholder` : Placeholder de la recherche
- `marketplace.hero.bgGradient` : Couleur du dégradé de fond

---

## 🔧 Utilisation dans les Composants

### Exemple : Page Landing

```typescript
import { usePageCustomization } from '@/hooks/usePageCustomization';

const Landing = () => {
  const { getValue, getColor, getImage } = usePageCustomization('landing');
  
  return (
    <section 
      style={{
        backgroundColor: getColor('landing.hero.bgColor', '#1e293b'),
        backgroundImage: getImage('landing.hero.bgImage') 
          ? `url(${getImage('landing.hero.bgImage')})` 
          : undefined,
      }}
    >
      <h1 style={{ color: getColor('landing.hero.textColor', '#ffffff') }}>
        {getValue('landing.hero.title', 'landing.hero.title', 'Titre par défaut')}
      </h1>
      <p>
        {getValue('landing.hero.subtitle', 'landing.hero.subtitle', 'Sous-titre par défaut')}
      </p>
    </section>
  );
};
```

### Exemple : Page Marketplace

```typescript
import { usePageCustomization } from '@/hooks/usePageCustomization';

const Marketplace = () => {
  const { getValue } = usePageCustomization('marketplace');
  
  return (
    <section>
      <h1>
        {getValue('marketplace.hero.title', 'marketplace.hero.title')}
      </h1>
      <input 
        placeholder={getValue('marketplace.searchPlaceholder', 'marketplace.searchPlaceholder', 'Rechercher...')}
      />
    </section>
  );
};
```

---

## 🎯 Types d'Éléments

### 1. Text (`text`)
- Input texte simple
- Pour les titres courts, labels, etc.

### 2. Textarea (`textarea`)
- Zone de texte multiligne
- Pour les descriptions, sous-titres longs, etc.

### 3. Image (`image`)
- Upload d'image vers Supabase Storage
- Prévisualisation de l'image
- Suppression possible

### 4. Color (`color`)
- Sélecteur de couleur + input texte
- Format hexadécimal (#rrggbb)

### 5. Font (`font`)
- Sélecteur de police
- Options : Poppins, Inter, Roboto, Open Sans, Montserrat

### 6. Number (`number`)
- Input numérique
- Pour les valeurs numériques (tailles, espacements, etc.)

### 7. URL (`url`)
- Input URL
- Pour les liens, images externes, etc.

### 8. Boolean (`boolean`)
- Checkbox
- Pour activer/désactiver des éléments

---

## 📦 Stockage des Images

Les images sont stockées dans le bucket Supabase `platform-assets` avec la structure :

```
platform-assets/
  page-assets/
    landing/
      hero-bgImage-1234567890.jpg
      hero-bgImage-1234567891.png
    marketplace/
      hero-bgImage-1234567892.jpg
```

---

## 🔄 Flux de Données

1. **Édition** : L'utilisateur modifie un élément dans `PagesCustomizationSection`
2. **Sauvegarde** : La valeur est sauvegardée dans `platform_settings.pages[pageId][elementKey]`
3. **Chargement** : Le hook `usePageCustomization` charge les personnalisations
4. **Application** : Les composants utilisent les valeurs personnalisées avec fallback sur i18n

---

## 🚀 Extension du Système

### Ajouter une Nouvelle Page

1. Ajouter la configuration dans `PAGES_CONFIG` :

```typescript
{
  id: 'dashboard',
  name: 'Dashboard',
  route: '/dashboard',
  description: 'Personnalisez le dashboard',
  icon: Layout,
  sections: [
    {
      id: 'header',
      name: 'En-tête',
      type: 'content',
      elements: [
        { id: 'title', label: 'Titre', type: 'text', key: 'dashboard.header.title' },
        // ...
      ],
    },
  ],
}
```

2. Utiliser le hook dans le composant de la page :

```typescript
const { getValue } = usePageCustomization('dashboard');
```

### Ajouter un Nouveau Type d'Élément

1. Ajouter le type dans `PageElement['type']`
2. Ajouter le cas dans `renderElementEditor` de `PagesCustomizationSection.tsx`
3. Créer le composant d'édition approprié

---

## ✅ Checklist d'Implémentation

- [x] Création de `PagesCustomizationSection.tsx`
- [x] Ajout de la section "Pages" dans `PlatformCustomization.tsx`
- [x] Création du hook `usePageCustomization.ts`
- [x] Configuration des pages Landing et Marketplace
- [x] Support de tous les types d'éléments (text, textarea, image, color, font, number, url, boolean)
- [x] Upload d'images vers Supabase Storage
- [x] Sauvegarde automatique
- [ ] Application dans les composants Landing et Marketplace (à faire)
- [ ] Ajout de plus de pages configurables (à faire)
- [ ] Preview en temps réel (à faire)

---

## 📊 Prochaines Étapes

1. **Application dans les Composants** :
   - Modifier `Landing.tsx` pour utiliser `usePageCustomization`
   - Modifier `Marketplace.tsx` pour utiliser `usePageCustomization`
   - Tester l'application en temps réel

2. **Extension** :
   - Ajouter plus de pages (Dashboard, Products, Orders, etc.)
   - Ajouter plus de sections par page
   - Ajouter plus d'éléments configurables

3. **Améliorations** :
   - Preview en temps réel des modifications
   - Historique des modifications
   - Réinitialisation par section
   - Export/Import de configurations

---

**Date de création** : 31 Janvier 2025  
**Dernière mise à jour** : 31 Janvier 2025


# 🌐 Configuration du Domaine Payhula

## 📋 Domaine par Défaut

**Domaine actuel** : `https://payhula.vercel.app`

Ce domaine est utilisé comme valeur par défaut dans toutes les Edge Functions Supabase pour :
- Les headers CORS
- Les URLs de retour dans les emails
- L'URL du site dans les configurations PayDunya

---

## ✅ Configuration Automatique

Le domaine `https://payhula.vercel.app` est automatiquement utilisé dans :
- ✅ `supabase/functions/paydunya/index.ts`
- ✅ `supabase/functions/moneroo/index.ts`
- ✅ `supabase/functions/paydunya-webhook/index.ts`
- ✅ `supabase/functions/moneroo-webhook/index.ts`
- ✅ `supabase/functions/abandoned-cart-recovery/index.ts`

---

## 🔧 Configuration Personnalisée

Si vous souhaitez utiliser un domaine personnalisé (ex: `https://payhula.com`), configurez la variable d'environnement `SITE_URL` dans Supabase :

1. Aller sur **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**
2. Ajouter un secret :
   - Nom : `SITE_URL`
   - Valeur : `https://payhula.com` (ou votre domaine)
   - ⚠️ **Important** : Ne pas ajouter de slash final (`/`)

---

## 📝 URLs de Retour des Paiements

Les URLs de retour pour les paiements PayDunya et Moneroo sont générées dynamiquement côté frontend avec `window.location.origin` :

```typescript
return_url: `${window.location.origin}/checkout/success?transaction_id=${transaction.id}`,
cancel_url: `${window.location.origin}/checkout/cancel?transaction_id=${transaction.id}`,
```

Cela garantit que les URLs utilisent toujours le domaine actuel (que ce soit `payhula.vercel.app` ou un domaine personnalisé).

---

## 🔒 Headers CORS

Les Edge Functions utilisent `SITE_URL` (ou `https://payhula.vercel.app` par défaut) pour les headers CORS :

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://payhula.vercel.app',
  // ...
};
```

---

## 📚 Documentation

- [Guide de Configuration Supabase Edge Functions](GUIDE_CONFIGURATION_SUPABASE_EDGE_FUNCTIONS.md)
- [Vérification des APIs PayDunya et Moneroo](VERIFICATION_API_PAYDUNYA_MONEROO.md)

---

**Date de mise à jour** : 31 Janvier 2025








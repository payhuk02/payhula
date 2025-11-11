# ✅ Vérification du Domaine par Défaut : https://payhula.vercel.app/

## 📋 Configuration Actuelle

Le domaine par défaut **`https://payhula.vercel.app/`** est configuré dans les fichiers suivants :

### ✅ Edge Functions Supabase

#### 1. Moneroo Edge Function
**Fichier** : `supabase/functions/moneroo/index.ts`
- ✅ CORS Header : `Deno.env.get('SITE_URL') || 'https://payhula.vercel.app'`
- ✅ Utilisé pour les headers CORS

#### 2. PayDunya Edge Function
**Fichier** : `supabase/functions/paydunya/index.ts`
- ✅ CORS Header : `Deno.env.get('SITE_URL') || 'https://payhula.vercel.app'`
- ✅ `website_url` : Utilisé dans les données PayDunya
- ✅ Utilisé pour les headers CORS

#### 3. Moneroo Webhook
**Fichier** : `supabase/functions/moneroo-webhook/index.ts`
- ✅ CORS Header : `Deno.env.get('SITE_URL') || 'https://payhula.vercel.app'`

#### 4. PayDunya Webhook
**Fichier** : `supabase/functions/paydunya-webhook/index.ts`
- ✅ CORS Header : `Deno.env.get('SITE_URL') || 'https://payhula.vercel.app'`

#### 5. Abandoned Cart Recovery
**Fichier** : `supabase/functions/abandoned-cart-recovery/index.ts`
- ✅ `returnUrl` : `${siteUrl}/cart` ou `${siteUrl}/cart?session=${cart.session_id}`
- ✅ `siteUrl` : `Deno.env.get('SITE_URL') || 'https://payhula.vercel.app'`

#### 6. Send Push Notification
**Fichier** : `supabase/functions/send-push-notification/index.ts`
- ✅ CORS Header : `Deno.env.get('SITE_URL') || 'https://payhula.vercel.app'`

### ✅ Frontend (Client-Side)

Les URLs de retour sont construites dynamiquement à partir de `window.location.origin` :

#### 1. Moneroo Payment
**Fichier** : `src/lib/moneroo-payment.ts`
```typescript
return_url: `${window.location.origin}/checkout/success?transaction_id=${transaction.id}`,
cancel_url: `${window.location.origin}/checkout/cancel?transaction_id=${transaction.id}`,
```

#### 2. PayDunya Payment
**Fichier** : `src/lib/paydunya-payment.ts`
```typescript
return_url: `${window.location.origin}/checkout/success?transaction_id=${transaction.id}`,
cancel_url: `${window.location.origin}/checkout/cancel?transaction_id=${transaction.id}`,
```

## 🔧 Configuration dans Supabase

### Secret `SITE_URL` (Recommandé)

**Pourquoi configurer `SITE_URL` dans Supabase :**
- ✅ Permet de changer le domaine facilement sans modifier le code
- ✅ Utilisé par les Edge Functions pour les CORS headers
- ✅ Utilisé pour construire les URLs de retour dans les webhooks

**Comment configurer :**

1. **Ouvrir Supabase Dashboard** → **Edge Functions** → **Secrets**
2. **Ajouter le secret** :
   - Nom : `SITE_URL`
   - Valeur : `https://payhula.vercel.app` (sans slash final)
3. **Sauvegarder**

**Note :** Si `SITE_URL` n'est pas configuré, le domaine par défaut `https://payhula.vercel.app` sera utilisé automatiquement.

## ✅ Checklist de Vérification

### Configuration Supabase
- [ ] Secret `SITE_URL` configuré dans Supabase Dashboard → Edge Functions → Secrets
- [ ] Valeur : `https://payhula.vercel.app` (sans slash final)
- [ ] Edge Functions redéployées après ajout du secret (si nécessaire)

### Edge Functions
- [x] Moneroo Edge Function utilise `SITE_URL` ou domaine par défaut
- [x] PayDunya Edge Function utilise `SITE_URL` ou domaine par défaut
- [x] Moneroo Webhook utilise `SITE_URL` ou domaine par défaut
- [x] PayDunya Webhook utilise `SITE_URL` ou domaine par défaut
- [x] Abandoned Cart Recovery utilise `SITE_URL` ou domaine par défaut
- [x] Send Push Notification utilise `SITE_URL` ou domaine par défaut

### Frontend
- [x] URLs de retour construites dynamiquement avec `window.location.origin`
- [x] URLs de retour pointent vers `/checkout/success` et `/checkout/cancel`

## 🎯 URLs Utilisées

### URLs de Retour (Frontend)
- **Succès** : `https://payhula.vercel.app/checkout/success?transaction_id={id}`
- **Annulation** : `https://payhula.vercel.app/checkout/cancel?transaction_id={id}`
- **Panier** : `https://payhula.vercel.app/cart`

### URLs Webhooks (Supabase)
- **Moneroo Webhook** : `https://{project-ref}.supabase.co/functions/v1/moneroo-webhook`
- **PayDunya Webhook** : `https://{project-ref}.supabase.co/functions/v1/paydunya-webhook`

### URLs Edge Functions (Supabase)
- **Moneroo** : `https://{project-ref}.supabase.co/functions/v1/moneroo`
- **PayDunya** : `https://{project-ref}.supabase.co/functions/v1/paydunya`

## 📝 Notes Importantes

### 1. Domaine par Défaut
- Le domaine `https://payhula.vercel.app/` est utilisé par défaut si `SITE_URL` n'est pas configuré
- ✅ **Recommandé** : Configurer `SITE_URL` dans Supabase pour plus de flexibilité

### 2. URLs Dynamiques (Frontend)
- Les URLs de retour sont construites avec `window.location.origin`
- ✅ **Avantage** : Fonctionne automatiquement en développement (`http://localhost:5173`) et en production (`https://payhula.vercel.app`)

### 3. CORS Headers
- Les Edge Functions utilisent `SITE_URL` pour les headers CORS
- ✅ **Important** : S'assurer que le domaine est correct pour éviter les erreurs CORS

### 4. Webhooks
- Les webhooks Moneroo/PayDunya doivent pointer vers les Edge Functions Supabase
- ✅ **Vérifier** : Configurer les webhooks dans les dashboards Moneroo/PayDunya

## 🔄 Changement de Domaine

Si vous devez changer le domaine par défaut :

1. **Mettre à jour le secret `SITE_URL` dans Supabase**
2. **Mettre à jour les fichiers Edge Functions** (si nécessaire)
3. **Redéployer les Edge Functions**
4. **Vérifier les webhooks** dans Moneroo/PayDunya
5. **Tester les paiements**

## ✅ Statut

- ✅ **Domaine par défaut configuré** : `https://payhula.vercel.app/`
- ✅ **Edge Functions utilisent le domaine** : Oui (avec fallback)
- ✅ **Frontend utilise `window.location.origin`** : Oui (dynamique)
- ⚠️ **Secret `SITE_URL` dans Supabase** : À configurer (recommandé)

## 🎯 Action Recommandée

**Configurer le secret `SITE_URL` dans Supabase Dashboard :**
1. Ouvrir **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Ajouter le secret :
   - Nom : `SITE_URL`
   - Valeur : `https://payhula.vercel.app` (sans slash final)
3. Sauvegarder

Cela permettra de changer le domaine facilement sans modifier le code.







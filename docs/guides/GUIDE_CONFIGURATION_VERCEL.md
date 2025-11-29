# 🚀 GUIDE DE CONFIGURATION VERCEL - PAYHUK

> **Date** : Janvier 2025  
> **Projet** : Payhuk Platform  
> **Repository** : https://github.com/payhuk02/payhula.git

---

## 📋 VARIABLES D'ENVIRONNEMENT À CONFIGURER

### ✅ Variables Supabase (Déjà Configurées)

Ces variables sont **déjà définies et protégées** :

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key_here"
```

---

## 🔧 CONFIGURATION DANS VERCEL

### Étape 1 : Accéder aux Variables d'Environnement

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet **payhula**
3. Aller dans **Settings** → **Environment Variables**

### Étape 2 : Ajouter les Variables Supabase

Cliquer sur **Add New** et ajouter :

#### Variables Obligatoires

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Important** :
- ✅ Sélectionner **Production**, **Preview**, et **Development**
- ✅ Cocher **Encrypt** pour toutes les variables sensibles

### Étape 3 : Variables Optionnelles (Phase 1 Optimisations)

#### CDN Configuration

```env
VITE_CDN_ENABLED=true
VITE_CDN_BASE_URL=https://cdn.payhuk.com
VITE_CDN_PROVIDER=cloudflare
VITE_CDN_IMAGE_OPTIMIZATION=true
VITE_CDN_VIDEO_OPTIMIZATION=true
VITE_CDN_FONT_OPTIMIZATION=true
```

#### APM Monitoring

```env
VITE_APM_ENABLED=true
VITE_APM_WEB_VITALS=true
VITE_APM_PERFORMANCE=true
```

#### Sentry (Recommandé)

```env
VITE_SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
VITE_SENTRY_ORG=your_organization_name
VITE_SENTRY_PROJECT=payhula
```

### Étape 4 : Variables de Paiements (Si Utilisées)

```env
# PayDunya
VITE_PAYDUNYA_MASTER_KEY=your_paydunya_master_key

# Moneroo
VITE_MONEROO_API_KEY=your_moneroo_api_key
VITE_MONEROO_SITE_ID=your_moneroo_site_id
```

### Étape 5 : Variables Analytics (Optionnel)

```env
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_FB_PIXEL_ID=your_facebook_pixel_id
VITE_TIKTOK_PIXEL_ID=your_tiktok_pixel_id
```

---

## 🔒 SÉCURITÉ

### ✅ Bonnes Pratiques

1. **Ne jamais exposer les clés publiquement**
   - Les clés Supabase sont sensibles
   - Utiliser les variables d'environnement Vercel
   - Ne pas les inclure dans le code source

2. **Rotation des clés si exposées**
   - Si les clés ont été exposées, les régénérer dans Supabase
   - Mettre à jour dans Vercel immédiatement

3. **Utilisation de secrets managers**
   - Vercel : Variables d'environnement sécurisées
   - GitHub Actions : Secrets GitHub
   - Autres : AWS Secrets Manager, etc.

### ⚠️ Vérification de Sécurité

- [x] Variables Supabase configurées
- [x] Variables sensibles encryptées
- [x] `.env` dans `.gitignore`
- [x] Pas de clés dans le code source
- [x] Documentation mise à jour

---

## 🚀 DÉPLOIEMENT

### Déploiement Automatique

Vercel déploie automatiquement à chaque push sur `main` :

```bash
# Push vers GitHub
git push origin main

# Vercel déploie automatiquement
```

### Déploiement Manuel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Production
vercel --prod
```

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### Checklist

- [ ] Variables d'environnement configurées dans Vercel
- [ ] Build réussi
- [ ] Application accessible
- [ ] Supabase connecté
- [ ] Pas d'erreurs dans les logs

### Tests

1. **Vérifier la connexion Supabase** :
   - Aller sur l'application déployée
   - Vérifier qu'il n'y a pas d'erreurs de connexion

2. **Vérifier les logs** :
   - Vercel Dashboard → **Deployments** → **Logs**
   - Vérifier qu'il n'y a pas d'erreurs

3. **Vérifier les Core Web Vitals** :
   - Utiliser Lighthouse
   - Vérifier les métriques de performance

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :

1. **Vérifier les variables d'environnement** dans Vercel
2. **Vérifier les logs** de déploiement
3. **Vérifier la documentation** Supabase
4. **Consulter** la documentation Vercel

---

## 🔗 LIENS UTILES

- **Vercel Dashboard** : https://vercel.com/dashboard
- **Supabase Dashboard** : https://app.supabase.com/project/your-project-id
- **GitHub Repository** : https://github.com/payhuk02/payhula.git
- **Documentation Vercel** : https://vercel.com/docs
- **Documentation Supabase** : https://supabase.com/docs

---

**Document généré le** : Janvier 2025  
**Version** : 1.0  
**Statut** : ✅ Configuration validée




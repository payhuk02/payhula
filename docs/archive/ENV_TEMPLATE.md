# 🔐 TEMPLATE VARIABLES D'ENVIRONNEMENT

**Fichier à créer** : `.env.example`

**Important** : Copiez le contenu ci-dessous dans un fichier nommé `.env.example` à la racine du projet.

---

## 📄 CONTENU DE .env.example

```env
# ==============================================
# PAYHULA - VARIABLES D'ENVIRONNEMENT
# ==============================================
# Copiez ce fichier en .env et remplissez les valeurs
# NE JAMAIS COMMIT LE FICHIER .env !

# ==============================================
# SUPABASE (OBLIGATOIRE)
# ==============================================
# Récupérez ces valeurs depuis : https://app.supabase.com/project/YOUR_PROJECT/settings/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
# Optionnel : Project ID (peut être extrait de l'URL)
VITE_SUPABASE_PROJECT_ID=your-project-id

# ==============================================
# PAIEMENTS (OBLIGATOIRE POUR PRODUCTION)
# ==============================================
# PayDunya
VITE_PAYDUNYA_MASTER_KEY=your_paydunya_master_key

# Moneroo
VITE_MONEROO_API_KEY=your_moneroo_api_key

# ==============================================
# SHIPPING (OPTIONNEL)
# ==============================================
VITE_FEDEX_API_KEY=your_fedex_api_key
VITE_FEDEX_ACCOUNT_NUMBER=your_fedex_account_number

# ==============================================
# ANALYTICS (OPTIONNEL)
# ==============================================
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_FB_PIXEL_ID=your_facebook_pixel_id
VITE_TIKTOK_PIXEL_ID=your_tiktok_pixel_id

# ==============================================
# MONITORING (RECOMMANDÉ POUR PRODUCTION)
# ==============================================
VITE_SENTRY_DSN=https://your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
VITE_SENTRY_ORG=your_organization_name
VITE_SENTRY_PROJECT=payhula

# ==============================================
# EMAIL (OPTIONNEL)
# ==============================================
VITE_SENDGRID_API_KEY=your_sendgrid_api_key

# ==============================================
# CDN (OPTIONNEL - Phase 1 Optimisations)
# ==============================================
VITE_CDN_ENABLED=false
VITE_CDN_BASE_URL=https://cdn.payhuk.com
VITE_CDN_PROVIDER=cloudflare
VITE_CDN_IMAGE_OPTIMIZATION=true
VITE_CDN_VIDEO_OPTIMIZATION=true
VITE_CDN_FONT_OPTIMIZATION=true

# ==============================================
# APM MONITORING (OPTIONNEL - Phase 1 Optimisations)
# ==============================================
VITE_APM_ENABLED=true
VITE_APM_WEB_VITALS=true
VITE_APM_PERFORMANCE=true

# ==============================================
# DÉVELOPPEMENT
# ==============================================
NODE_ENV=development
VITE_APP_URL=http://localhost:8080
VITE_APP_VERSION=1.0.0

# ==============================================
# PRODUCTION
# ==============================================
# NODE_ENV=production
# VITE_APP_URL=https://payhula.vercel.app
```

---

## 🚀 COMMANDE POUR CRÉER LE FICHIER

Exécutez dans PowerShell :

```powershell
@"
# PAYHULA - VARIABLES D'ENVIRONNEMENT
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
VITE_PAYDUNYA_MASTER_KEY=your_paydunya_master_key
VITE_MONEROO_API_KEY=your_moneroo_api_key
VITE_FEDEX_API_KEY=your_fedex_api_key
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your_sentry_dsn
NODE_ENV=development
"@ | Out-File -FilePath .env.example -Encoding UTF8
```


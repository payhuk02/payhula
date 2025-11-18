import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { Plugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const hasSentryToken = !!env.SENTRY_AUTH_TOKEN;

  // Plugin personnalisé pour garantir l'ordre de chargement des chunks
  // CRITIQUE: Le chunk principal (index) doit être chargé et exécuté AVANT tous les autres chunks
  // Cela évite l'erreur "Cannot read properties of undefined (reading 'forwardRef')"
  const ensureChunkOrderPlugin = (): Plugin => {
    return {
      name: 'ensure-chunk-order',
      transformIndexHtml: {
        order: 'post',
        handler(html, ctx) {
          if (!isProduction) return html;
          
          // Extraire tous les scripts modules
          const scriptRegex = /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
          const scripts: Array<{ src: string; fullTag: string }> = [];
          let match;
          
          while ((match = scriptRegex.exec(html)) !== null) {
            scripts.push({
              src: match[1],
              fullTag: match[0]
            });
          }
          
          if (scripts.length === 0) return html;
          
          // Trouver le script index (chunk principal contenant React)
          const indexScript = scripts.find(s => 
            s.src.includes('index-') || s.src.includes('/js/index-')
          );
          
          if (!indexScript) return html;
          
          // Retirer tous les scripts de l'HTML
          let newHtml = html;
          scripts.forEach(script => {
            newHtml = newHtml.replace(script.fullTag, '');
          });
          
          // Ajouter modulepreload pour le chunk principal au début du <head>
          // Cela garantit que React est préchargé avant tous les autres chunks
          const modulePreloadTag = `    <link rel="modulepreload" href="${indexScript.src}">\n`;
          const headStart = newHtml.indexOf('<head>');
          if (headStart !== -1) {
            const headAfterTag = newHtml.indexOf('>', headStart) + 1;
            newHtml = newHtml.slice(0, headAfterTag) + modulePreloadTag + newHtml.slice(headAfterTag);
          }
          
          // Réinsérer le script index en premier (dans le <head> ou <body>)
          const indexScriptTag = indexScript.fullTag;
          const headEnd = newHtml.indexOf('</head>');
          if (headEnd !== -1) {
            newHtml = newHtml.slice(0, headEnd) + `\n    ${indexScriptTag}` + newHtml.slice(headEnd);
          }
          
          // Réinsérer les autres scripts après le script index
          scripts.forEach(script => {
            if (script !== indexScript) {
              const headEnd = newHtml.indexOf('</head>');
              if (headEnd !== -1) {
                newHtml = newHtml.slice(0, headEnd) + `\n    ${script.fullTag}` + newHtml.slice(headEnd);
              }
            }
          });
          
          return newHtml;
        },
      },
    };
  };

  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // Configuration React - jsxRuntime: 'automatic' est la valeur par défaut
    }),
    // Plugin pour garantir l'ordre de chargement des chunks (production uniquement)
    isProduction && ensureChunkOrderPlugin(),
    // Visualizer seulement en dev
    !isProduction && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: false,
      brotliSize: false,
    }),
    
    // Sentry plugin pour source maps (seulement en production avec token)
    isProduction && hasSentryToken && sentryVitePlugin({
      org: env.VITE_SENTRY_ORG,
      project: env.VITE_SENTRY_PROJECT,
      authToken: env.SENTRY_AUTH_TOKEN,
      
      // Upload source maps
      sourcemaps: {
        assets: './dist/**',
        ignore: ['node_modules/**'],
        filesToDeleteAfterUpload: './dist/**/*.map', // Supprimer les .map après upload
      },
      
      // Configuration release
      release: {
        name: env.VERCEL_GIT_COMMIT_SHA || `payhuk-${Date.now()}`,
        deploy: {
          env: env.VERCEL_ENV || 'production',
        },
      },
      
      // Options
      telemetry: false,
      silent: false,
      debug: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Préserver les extensions pour éviter les conflits
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    // Dédupliquer React et Scheduler pour éviter les problèmes d'initialisation
    dedupe: ['react', 'react-dom', 'scheduler'],
  },
  build: {
    rollupOptions: {
      // CRITIQUE: 'strict' garantit l'ordre de chargement des chunks
      // React sera chargé avant tous les chunks qui en dépendent (Radix UI, etc.)
      preserveEntrySignatures: 'strict',
      output: {
        // Code splitting réactivé avec stratégie optimisée
        // IMPORTANT: React doit rester dans le chunk principal pour éviter l'erreur forwardRef sur Vercel
        // Séparation intelligente des chunks pour améliorer les performances
        // Amélioration: Réduction du bundle initial de ~40-60%
        manualChunks: (id) => {
          // CRITIQUE: React, React DOM et Scheduler dans le chunk principal (undefined)
          // Ne pas séparer React pour garantir qu'il est chargé avant tous les composants
          if (
            id.includes('node_modules/react/') || 
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return undefined; // Garder dans le chunk principal
          }
          
          // React Router - Garder dans le chunk principal avec React
          if (id.includes('node_modules/react-router')) {
            return undefined;
          }
          
          // TanStack Query - Garder dans le chunk principal avec React
          if (id.includes('node_modules/@tanstack/react-query')) {
            return undefined;
          }
          
          // Radix UI - Séparer en chunk dédié pour réduire bundle initial
          // Note: Radix UI est chargé à la demande via lazy loading des composants
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          
          // Composants lourds - Charts - Garder dans le chunk principal (utilise React.createContext)
          // Note: recharts sera géré dans la liste des dépendances React plus bas
          
          // Composants lourds - Calendrier - Garder dans le chunk principal (utilise React)
          // Note: react-big-calendar sera géré dans la liste des dépendances React plus bas
          
          // Éditeurs de texte riches - Séparer en chunk dédié
          if (id.includes('node_modules/@tiptap')) {
            return 'editor';
          }
          
          // Framer Motion - Garder dans le chunk principal (utilise React.createContext)
          // Note: Déjà géré plus bas, mais gardé ici pour clarté
          
          // react-hook-form - Garder dans le chunk principal (utilisé partout)
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return undefined;
          }
          
          // CRITIQUE: Toutes les dépendances qui utilisent React doivent rester dans le chunk principal
          // pour éviter l'erreur "Cannot read properties of undefined (reading 'createContext')"
          
          // next-themes utilise React Context - Garder dans le chunk principal
          if (id.includes('node_modules/next-themes')) {
            return undefined;
          }
          
          // framer-motion utilise React - Garder dans le chunk principal
          if (id.includes('node_modules/framer-motion')) {
            return undefined;
          }
          
          // Supabase client - Séparer en chunk dédié (ne dépend pas de React)
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          
          // Date utilities - Séparer en chunk dédié (ne dépend pas de React)
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          
          // Sentry (monitoring) - Garder dans le chunk principal (utilise React)
          if (id.includes('node_modules/@sentry/react')) {
            return undefined;
          }
          
          // Sentry autres packages - Séparer
          if (id.includes('node_modules/@sentry')) {
            return 'monitoring';
          }
          
          // Moneroo payment modules - Code splitting pour optimiser le bundle
          if (id.includes('src/lib/moneroo')) {
            return 'moneroo';
          }
          
          // Pages Admin - Séparer en chunk dédié (chargées rarement)
          if (id.includes('src/pages/admin')) {
            return 'admin-pages';
          }
          
          // Composants Courses - Séparer en chunk dédié
          if (id.includes('src/components/courses') || id.includes('src/pages/courses')) {
            return 'courses';
          }
          
          // Composants Digital - Séparer en chunk dédié
          if (id.includes('src/components/digital') || id.includes('src/pages/digital')) {
            return 'digital';
          }
          
          // Composants Physical - Séparer en chunk dédié
          if (id.includes('src/components/physical') || id.includes('src/pages/physical')) {
            return 'physical';
          }
          
          // Composants Service - Séparer en chunk dédié
          if (id.includes('src/components/service') || id.includes('src/pages/service')) {
            return 'service';
          }
          
          // Autres dépendances node_modules - Grouper par taille
          if (id.includes('node_modules/')) {
            // CRITIQUE: lucide-react doit rester dans le chunk principal avec React
            // pour éviter l'erreur "Cannot read properties of undefined (reading 'forwardRef')"
            // lucide-react utilise forwardRef de React et doit être chargé après React
            if (id.includes('node_modules/lucide-react')) {
              return undefined; // Garder dans le chunk principal avec React
            }
            
            // CRITIQUE: Toutes les dépendances qui utilisent React doivent rester dans le chunk principal
            // Vérifier les dépendances React communes
            const reactDependencies = [
              'react-helmet',
              'react-i18next',
              'react-day-picker',
              'react-resizable-panels',
              'react-big-calendar',
              'recharts', // Utilise React Context
              'embla-carousel-react', // Utilise React
              'cmdk', // Utilise React
              'vaul', // Utilise React
              'sonner', // Utilise React
            ];
            
            for (const dep of reactDependencies) {
              if (id.includes(`node_modules/${dep}`)) {
                return undefined; // Garder dans le chunk principal
              }
            }
            
            // Zod - Séparer (ne dépend pas de React)
            if (id.includes('node_modules/zod')) {
              return 'validation';
            }
            
            // Autres vendors - Séparer seulement si elles ne dépendent pas de React
            return 'vendor';
          }
        },
        // Optimisation des noms de chunks
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/index-[hash].js',
        // Format ES modules
        format: 'es',
        // Ne pas inliner les imports dynamiques (code splitting activé)
        inlineDynamicImports: false,
        // IMPORTANT: Ne pas utiliser generatedCode.constBindings: false
        // Cela peut causer des problèmes d'initialisation
        // Laisser les const bindings par défaut pour garantir l'ordre d'initialisation
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Optimisations pour vitesse de build
    target: 'es2015',
    minify: 'esbuild', // Plus rapide que terser
    // Chunk size warnings - optimisé pour code splitting
    chunkSizeWarningLimit: 500, // Avertir si un chunk dépasse 500KB (code splitting activé)
    reportCompressedSize: true, // Activé pour voir la taille compressée
    sourcemap: isProduction && hasSentryToken, // Seulement si Sentry configuré
    // Optimisations supplémentaires
    cssCodeSplit: true, // Split CSS par chunk
    cssMinify: true, // Minifier le CSS
    // Tree shaking - moins agressif pour éviter les problèmes de référence circulaire
    treeshake: {
      moduleSideEffects: 'no-external', // Préserver les side effects internes
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
      // Préserver l'ordre d'initialisation pour éviter "Cannot access before initialization"
      preserveComments: false,
    },
    // CommonJS options pour éviter les problèmes de référence circulaire
    commonjsOptions: {
      transformMixedEsModules: true,
      strictRequires: false, // Désactiver pour éviter les problèmes d'ordre
    },
  },
  // Optimisation des dépendances (amélioré)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'scheduler', // CRITIQUE: Inclure scheduler pour Radix UI
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react', // CRITIQUE: Inclure lucide-react pour éviter l'erreur forwardRef
      'date-fns',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      // Forcer l'inclusion des dépendances CommonJS problématiques
      'hoist-non-react-statics',
      // Forcer l'inclusion des dépendances de carousel
      'embla-carousel-autoplay',
      'embla-carousel-react',
      // Forcer l'inclusion de toutes les dépendances Radix UI
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
    // Exclure les dépendances qui causent des problèmes
    exclude: ['@sentry/react'],
    // Forcer la transformation ESM pour les modules CommonJS
    esbuildOptions: {
      target: 'es2015',
      format: 'esm',
      supported: {
        'top-level-await': true,
      },
      // Forcer la transformation CommonJS vers ESM
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
    // Forcer la transformation CommonJS
    force: true, // Forcer la re-optimisation des dépendances
  },
};
});

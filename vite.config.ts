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
  // TEMPORAIREMENT DÉSACTIVÉ pour éviter l'erreur forwardRef
  // Le chunk principal (index) doit être chargé et exécuté AVANT tous les autres chunks
  const ensureChunkOrderPlugin = (): Plugin => {
    return {
      name: 'ensure-chunk-order',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          // TEMPORAIREMENT DÉSACTIVÉ - Retourner le HTML tel quel
          // Le code splitting est désactivé, donc il n'y a qu'un seul chunk
          // Pas besoin de réorganiser l'ordre de chargement
          return html;
          
          // CODE DÉSACTIVÉ (sera réactivé quand le code splitting sera réactivé) :
          // if (!isProduction) return html;
          // ... reste du code commenté
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
    // Dédupliquer React pour éviter les problèmes d'initialisation
    dedupe: ['react', 'react-dom'],
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
          // CRITIQUE: React et React DOM dans le chunk principal (undefined)
          // Ne pas séparer React pour garantir qu'il est chargé avant tous les composants
          // Cela évite l'erreur "Cannot read properties of undefined (reading 'forwardRef')"
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return undefined; // Garder dans le chunk principal
          }
          
          // React Router dans un chunk séparé
          if (id.includes('node_modules/react-router')) {
            return 'router';
          }
          
          // TanStack Query (React Query)
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          
          // Supabase client
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
          
          // Radix UI components (groupe tous les composants UI)
          // IMPORTANT: Chargé après React grâce à preserveEntrySignatures
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          
          // Composants lourds - Charts
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          
          // Composants lourds - Calendrier
          if (id.includes('node_modules/react-big-calendar')) {
            return 'calendar';
          }
          
          // Éditeurs de texte riches
          if (id.includes('node_modules/@tiptap')) {
            return 'editor';
          }
          
          // Framer Motion (animations)
          if (id.includes('node_modules/framer-motion')) {
            return 'animations';
          }
          
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          
          // Sentry (monitoring)
          if (id.includes('node_modules/@sentry')) {
            return 'monitoring';
          }
          
          // Autres dépendances node_modules
          if (id.includes('node_modules/')) {
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
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
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

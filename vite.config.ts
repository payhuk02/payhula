import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const hasSentryToken = !!env.SENTRY_AUTH_TOKEN;

  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // Configuration React - jsxRuntime: 'automatic' est la valeur par défaut
    }),
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
    // Code splitting avancé pour optimiser le bundle size
    rollupOptions: {
      // Préserver les signatures d'entrée pour garantir l'ordre de chargement
      preserveEntrySignatures: 'strict',
      output: {
        manualChunks: (id) => {
          // Éviter les références circulaires en groupant plus intelligemment
          // Vendors React core - CRITIQUE: React doit être dans le chunk principal (index)
          // pour être chargé en premier et éviter les erreurs createContext/forwardRef
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            // Ne pas créer de chunk séparé - laisser dans le chunk principal
            // Cela garantit que React est chargé AVANT tous les autres chunks
            return undefined;
          }
          
          if (id.includes('node_modules/react-router')) {
            return 'vendor-react-router';
          }
          
          // State management
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          
          // Supabase
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          
          // UI Libraries - regrouper Radix UI pour éviter les problèmes
          // Radix UI dépend de React, donc doit être chargé après React
          if (id.includes('@radix-ui')) {
            return 'vendor-radix-ui';
          }
          
          if (id.includes('lucide-react')) {
            return 'vendor-lucide';
          }
          
          // Forms
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'vendor-forms';
          }
          
          // Rich text editor
          if (id.includes('@tiptap')) {
            return 'vendor-editor';
          }
          
          // Charts
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          
          // Animations
          if (id.includes('framer-motion')) {
            return 'vendor-animations';
          }
          
          // i18n
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'vendor-i18n';
          }
          
          // PDF generation
          if (id.includes('jspdf')) {
            return 'vendor-pdf';
          }
          
          // Calendar
          if (id.includes('react-big-calendar') || id.includes('react-day-picker')) {
            return 'vendor-calendar';
          }
          
          // Digital products components
          if (id.includes('/digital/')) {
            return 'chunk-digital';
          }
          
          // Physical products components
          if (id.includes('/physical/')) {
            return 'chunk-physical';
          }
          
          // Services components
          if (id.includes('/service/')) {
            return 'chunk-services';
          }
          
          // Courses components
          if (id.includes('/courses/')) {
            return 'chunk-courses';
          }
          
          // Admin components
          if (id.includes('/admin/')) {
            return 'chunk-admin';
          }
          
          // Marketplace components
          if (id.includes('/marketplace/')) {
            return 'chunk-marketplace';
          }
          
          // Autres vendors
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        // Optimisation des noms de chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
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
    // Chunk size warnings - plus strict pour optimiser
    chunkSizeWarningLimit: 500, // Réduit pour forcer l'optimisation
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

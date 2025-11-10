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
    // Code splitting avancé pour optimiser le bundle size
    rollupOptions: {
      // Préserver les signatures d'entrée pour garantir l'ordre de chargement
      preserveEntrySignatures: 'strict',
      output: {
        // Code splitting optimisé pour réduire les bundle sizes
        manualChunks: (id) => {
          // React et React DOM dans le chunk principal (chargé en premier)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return undefined; // Garder dans le chunk principal
          }
          
          // Vendor chunks pour les grandes bibliothèques
          if (id.includes('node_modules')) {
            // Supabase
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'vendor-supabase';
            }
            
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query';
            }
            
            // Sentry
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            
            // UI Libraries (Radix UI, etc.)
            if (id.includes('@radix-ui') || id.includes('radix-ui')) {
              return 'vendor-ui';
            }
            
            // Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'vendor-forms';
            }
            
            // Icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            // Date libraries
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            
            // Autres vendor
            return 'vendor';
          }
          
          // Chunks par feature pour le code applicatif
          if (id.includes('src/pages/admin')) {
            return 'pages-admin';
          }
          
          if (id.includes('src/pages/customer')) {
            return 'pages-customer';
          }
          
          if (id.includes('src/pages/dashboard')) {
            return 'pages-dashboard';
          }
          
          if (id.includes('src/components/marketplace')) {
            return 'components-marketplace';
          }
          
          if (id.includes('src/components/products')) {
            return 'components-products';
          }
          
          if (id.includes('src/components/physical')) {
            return 'components-physical';
          }
          
          if (id.includes('src/components/digital')) {
            return 'components-digital';
          }
          
          if (id.includes('src/components/service')) {
            return 'components-service';
          }
          
          // Par défaut, garder dans le chunk principal
          return undefined;
        },
        // Optimisation des noms de chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        // CRITIQUE: Le chunk principal (main.tsx) doit être nommé "index" pour être identifiable
        // Cela garantit que le plugin ensureChunkOrderPlugin peut le trouver
        entryFileNames: (chunkInfo) => {
          // CRITIQUE: Le chunk principal (main.tsx) doit être nommé "index" pour être identifiable
          // Vérifier plusieurs conditions pour identifier le chunk principal
          // Le chunk principal est celui qui :
          // 1. Est un entry point (isEntry === true)
          // 2. N'est pas dans node_modules
          // 3. Contient "main" dans son nom ou facadeModuleId
          const isMainEntry = 
            chunkInfo.isEntry && (
              chunkInfo.facadeModuleId?.includes('main.tsx') ||
              chunkInfo.facadeModuleId?.includes('main.ts') ||
              chunkInfo.facadeModuleId?.includes('src/main') ||
              chunkInfo.facadeModuleId?.includes('/main') ||
              chunkInfo.name === 'main' ||
              chunkInfo.name === 'index' ||
              // Fallback: Si c'est un entry point et pas dans node_modules, c'est probablement le principal
              (!chunkInfo.facadeModuleId?.includes('node_modules') && 
               !chunkInfo.facadeModuleId?.includes('chunk'))
            );
          
          if (isMainEntry) {
            return 'js/index-[hash].js';
          }
          // Les autres entry points gardent leur nom
          return 'js/[name]-[hash].js';
        },
        // CRITIQUE: Format ES modules pour garantir l'ordre de chargement
        format: 'es',
        // Ne pas inliner les imports dynamiques pour préserver l'ordre
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

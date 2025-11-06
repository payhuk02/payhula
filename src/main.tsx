import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/product-banners.css";
import "./styles/reviews-dark-mode.css";
import "./styles/reviews-mobile.css";
import { setupGlobalErrorHandlers } from "./lib/error-logger";
import { installConsoleGuard } from "./lib/console-guard";
import { initAPMMonitoring } from "./lib/apm-monitoring";
import { initCDNConnections } from "./lib/cdn-config";
import { initAccessibility } from "./lib/accessibility";
import "./i18n/config"; // Initialiser i18n

// Install console guard first to neutralize console.* in production
installConsoleGuard();

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialiser le monitoring APM
initAPMMonitoring();

// Initialiser les connexions CDN
initCDNConnections();

// Initialiser l'accessibilité
initAccessibility();

// Register Service Worker for PWA (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Toujours récupérer la dernière version du SW
    }).catch((error) => {
      console.warn('Service Worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

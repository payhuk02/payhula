import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrait le texte brut d'une chaîne HTML en supprimant toutes les balises HTML
 * Fonctionne côté client et serveur
 * @param html - La chaîne HTML à nettoyer
 * @returns Le texte brut sans balises HTML
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Vérifier si on est côté client (navigateur)
  if (typeof document !== 'undefined') {
    // Créer un élément DOM temporaire pour parser le HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // Extraire le texte brut
    return tmp.textContent || tmp.innerText || '';
  }
  
  // Côté serveur : utiliser une regex pour supprimer les balises HTML
  return html
    .replace(/<[^>]*>/g, '') // Supprimer toutes les balises HTML
    .replace(/&nbsp;/g, ' ') // Remplacer &nbsp; par un espace
    .replace(/&amp;/g, '&') // Remplacer &amp; par &
    .replace(/&lt;/g, '<') // Remplacer &lt; par <
    .replace(/&gt;/g, '>') // Remplacer &gt; par >
    .replace(/&quot;/g, '"') // Remplacer &quot; par "
    .replace(/&#39;/g, "'") // Remplacer &#39; par '
    .replace(/&apos;/g, "'") // Remplacer &apos; par '
    .trim();
}

export { formatCurrency, getCurrencySymbol, getCurrencyByCode, CURRENCIES } from './currencies';

/**
 * Service de conversion de devises
 * Supporte la conversion entre différentes devises pour Moneroo
 */

export type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';

export interface CurrencyRate {
  from: Currency;
  to: Currency;
  rate: number;
  updatedAt: string;
}

/**
 * Taux de change de base (peuvent être récupérés depuis une API)
 * Note: En production, utiliser une API de taux de change en temps réel
 */
const BASE_RATES: Record<string, number> = {
  // XOF (Franc CFA) comme devise de base
  'XOF_EUR': 0.00152, // 1 XOF = 0.00152 EUR
  'XOF_USD': 0.00167, // 1 XOF = 0.00167 USD
  'XOF_GBP': 0.00132, // 1 XOF = 0.00132 GBP
  'XOF_NGN': 2.50,    // 1 XOF = 2.50 NGN
  'XOF_GHS': 0.025,   // 1 XOF = 0.025 GHS
  'XOF_KES': 0.23,    // 1 XOF = 0.23 KES
  'XOF_ZAR': 0.031,   // 1 XOF = 0.031 ZAR

  // Taux inverses
  'EUR_XOF': 655.957, // 1 EUR = 655.957 XOF
  'USD_XOF': 599.04,  // 1 USD = 599.04 XOF
  'GBP_XOF': 757.576, // 1 GBP = 757.576 XOF
  'NGN_XOF': 0.40,    // 1 NGN = 0.40 XOF
  'GHS_XOF': 40.00,   // 1 GHS = 40.00 XOF
  'KES_XOF': 4.35,    // 1 KES = 4.35 XOF
  'ZAR_XOF': 32.26,   // 1 ZAR = 32.26 XOF

  // Autres conversions
  'EUR_USD': 1.10,
  'USD_EUR': 0.91,
  'EUR_GBP': 0.86,
  'GBP_EUR': 1.16,
  'USD_GBP': 0.79,
  'GBP_USD': 1.27,
};

/**
 * Convertit un montant d'une devise à une autre
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) {
    return amount;
  }

  const rateKey = `${from}_${to}`;
  const rate = BASE_RATES[rateKey];

  if (!rate) {
    console.warn(`Exchange rate not found for ${from} to ${to}, returning original amount`);
    return amount;
  }

  return amount * rate;
}

/**
 * Formate un montant selon la devise
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'XOF' ? 0 : 2,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  });

  return formatter.format(amount);
}

/**
 * Récupère le symbole de devise
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    XOF: 'CFA',
    EUR: '€',
    USD: '$',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
  };

  return symbols[currency] || currency;
}

/**
 * Vérifie si une devise est supportée
 */
export function isSupportedCurrency(currency: string): currency is Currency {
  return ['XOF', 'EUR', 'USD', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'].includes(currency);
}

/**
 * Récupère toutes les devises supportées
 */
export function getSupportedCurrencies(): Currency[] {
  return ['XOF', 'EUR', 'USD', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'];
}

/**
 * Récupère le taux de change entre deux devises
 */
export function getExchangeRate(from: Currency, to: Currency): number {
  if (from === to) {
    return 1;
  }

  const rateKey = `${from}_${to}`;
  const rate = BASE_RATES[rateKey];

  if (!rate) {
    console.warn(`Exchange rate not found for ${from} to ${to}`);
    return 1;
  }

  return rate;
}

/**
 * Met à jour les taux de change depuis une API externe
 * TODO: Implémenter l'intégration avec une API de taux de change (ex: ExchangeRate-API, Fixer.io)
 */
export async function updateExchangeRates(): Promise<void> {
  // TODO: Implémenter la récupération des taux depuis une API
  // Exemple:
  // const response = await fetch('https://api.exchangerate-api.com/v4/latest/XOF');
  // const data = await response.json();
  // Mettre à jour BASE_RATES avec les nouveaux taux
  console.log('Exchange rates update not implemented yet');
}


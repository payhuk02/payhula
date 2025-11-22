/**
 * Lazy loader pour jspdf et ses plugins
 * Charge seulement quand nécessaire pour réduire le bundle initial
 */

let jsPDFModule: typeof import('jspdf') | null = null;
let autoTableModule: typeof import('jspdf-autotable') | null = null;

/**
 * Charge jspdf de manière asynchrone
 */
export const loadJsPDF = async () => {
  if (!jsPDFModule) {
    jsPDFModule = await import('jspdf');
  }
  return jsPDFModule;
};

/**
 * Charge jspdf-autotable de manière asynchrone
 */
export const loadAutoTable = async () => {
  if (!autoTableModule) {
    autoTableModule = await import('jspdf-autotable');
  }
  return autoTableModule;
};

/**
 * Charge jspdf et autotable ensemble
 * Retourne les modules avec gestion des exports par défaut
 */
export const loadPDFModules = async () => {
  const [jsPDF, autoTable] = await Promise.all([
    loadJsPDF(),
    loadAutoTable(),
  ]);
  
  // Gérer les exports par défaut (ES modules vs CommonJS)
  const jsPDFClass = (jsPDF as any).default || jsPDF;
  const autoTablePlugin = (autoTable as any).default || autoTable;
  
  return { 
    jsPDF: jsPDFClass, 
    autoTable: autoTablePlugin,
    // Exporter aussi les modules bruts si nécessaire
    jsPDFModule: jsPDF,
    autoTableModule: autoTable,
  };
};


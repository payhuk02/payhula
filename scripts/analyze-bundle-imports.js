/**
 * Script pour analyser les imports et identifier les optimisations possibles
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const srcDir = join(process.cwd(), 'src');

// Statistiques
const stats = {
  totalFiles: 0,
  totalImports: 0,
  duplicateImports: new Map(),
  largeImports: [],
  lucideImports: new Map(),
  unusedImports: [],
};

// Analyser un fichier
function analyzeFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Détecter les imports
      const importMatch = line.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"]/);
      if (importMatch) {
        stats.totalImports++;
        const [, imports, source] = importMatch;
        
        // Analyser les imports lucide-react
        if (source.includes('lucide-react')) {
          const iconMatches = imports.match(/\{([^}]+)\}/);
          if (iconMatches) {
            const icons = iconMatches[1].split(',').map(i => i.trim());
            icons.forEach(icon => {
              const count = stats.lucideImports.get(icon) || 0;
              stats.lucideImports.set(icon, count + 1);
            });
          }
        }
        
        // Détecter les imports volumineux
        if (source.includes('node_modules') && !source.includes('@/')) {
          const size = line.length;
          if (size > 200) {
            stats.largeImports.push({
              file: filePath.replace(process.cwd(), ''),
              line: index + 1,
              import: line.trim(),
              size,
            });
          }
        }
      }
    });
    
    stats.totalFiles++;
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${filePath}:`, error.message);
  }
}

// Parcourir récursivement les fichiers
function walkDir(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (!['node_modules', 'dist', '.git', '.vite'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Analyser tous les fichiers
console.log('🔍 Analyse des imports...\n');
const files = walkDir(srcDir);

files.forEach(analyzeFile);

// Générer le rapport
console.log('📊 RAPPORT D\'ANALYSE DES IMPORTS\n');
console.log(`Total fichiers analysés: ${stats.totalFiles}`);
console.log(`Total imports: ${stats.totalImports}\n`);

// Top 10 icônes lucide-react les plus utilisées
console.log('🎨 TOP 10 ICÔNES LUCIDE-REACT LES PLUS UTILISÉES:');
const sortedLucide = Array.from(stats.lucideImports.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedLucide.forEach(([icon, count]) => {
  console.log(`  ${icon}: ${count} fois`);
});

// Imports volumineux
if (stats.largeImports.length > 0) {
  console.log('\n⚠️  IMPORTS VOLUMINEUX (>200 caractères):');
  stats.largeImports.slice(0, 10).forEach(imp => {
    console.log(`  ${imp.file}:${imp.line}`);
    console.log(`    ${imp.import.substring(0, 100)}...`);
  });
}

// Recommandations
console.log('\n💡 RECOMMANDATIONS:');
console.log('  1. Considérer le lazy loading pour les icônes lucide-react');
console.log('  2. Créer un fichier d\'index pour les icônes les plus utilisées');
console.log('  3. Vérifier les imports inutiles avec ESLint');
console.log('  4. Utiliser tree-shaking pour réduire la taille du bundle');


/**
 * Script d'analyse du bundle size
 * Analyse les chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Analyser le bundle size depuis les stats de Vite
 */
function analyzeBundleSize() {
  console.log('📦 Analyse du bundle size...\n');

  try {
    // Lire les stats de build (générées par rollup-plugin-visualizer)
    const statsPath = join(process.cwd(), 'dist', 'stats.html');
    
    // Si les stats n'existent pas, suggérer de les générer
    try {
      const stats = readFileSync(statsPath, 'utf-8');
      console.log('✅ Stats trouvées dans dist/stats.html');
      console.log('   Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation\n');
    } catch (error) {
      console.log('⚠️  Stats non trouvées. Génération recommandée :');
      console.log('   npm run build -- --mode analyze\n');
    }

    // Analyser les chunks depuis dist
    const distPath = join(process.cwd(), 'dist');
    const jsPath = join(distPath, 'js');
    
    try {
      const fs = require('fs');
      const files = fs.readdirSync(jsPath);
      
      const chunks = files
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const filePath = join(jsPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            sizeKB: (stats.size / 1024).toFixed(2),
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          };
        })
        .sort((a, b) => b.size - a.size);

      console.log('📊 Taille des chunks :\n');
      console.log('┌─────────────────────────────────────┬──────────────┬──────────────┐');
      console.log('│ Chunk                                │ Taille (KB)  │ Taille (MB)  │');
      console.log('├─────────────────────────────────────┼──────────────┼──────────────┤');

      let totalSize = 0;
      chunks.forEach(chunk => {
        totalSize += chunk.size;
        const name = chunk.name.padEnd(35);
        const kb = chunk.sizeKB.padStart(12);
        const mb = chunk.sizeMB.padStart(12);
        console.log(`│ ${name} │ ${kb} │ ${mb} │`);
      });

      console.log('└─────────────────────────────────────┴──────────────┴──────────────┘');
      console.log(`\n📈 Taille totale : ${(totalSize / (1024 * 1024)).toFixed(2)} MB\n`);

      // Recommandations
      console.log('💡 Recommandations :\n');
      
      const largeChunks = chunks.filter(c => c.size > 500 * 1024); // > 500KB
      if (largeChunks.length > 0) {
        console.log('⚠️  Chunks volumineux (> 500KB) :');
        largeChunks.forEach(chunk => {
          console.log(`   - ${chunk.name}: ${chunk.sizeMB} MB`);
        });
        console.log('   → Considérer le lazy loading ou le code splitting\n');
      }

      const mainChunk = chunks.find(c => c.name.includes('index-'));
      if (mainChunk && mainChunk.size > 300 * 1024) {
        console.log('⚠️  Chunk principal volumineux :');
        console.log(`   - ${mainChunk.name}: ${mainChunk.sizeMB} MB`);
        console.log('   → Considérer déplacer des dépendances vers des chunks séparés\n');
      }

      // Vérifier les chunks dupliqués
      const chunkNames = chunks.map(c => c.name.split('-')[0]);
      const duplicates = chunkNames.filter((name, index) => chunkNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        console.log('⚠️  Chunks potentiellement dupliqués détectés');
        console.log('   → Vérifier la configuration de code splitting\n');
      }

      // Générer un rapport JSON
      const report = {
        timestamp: new Date().toISOString(),
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        chunks: chunks,
        recommendations: {
          largeChunks: largeChunks.map(c => c.name),
          mainChunkSize: mainChunk ? mainChunk.sizeMB : null,
        },
      };

      const reportPath = join(process.cwd(), 'bundle-analysis.json');
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`✅ Rapport sauvegardé dans bundle-analysis.json\n`);

    } catch (error) {
      console.log('⚠️  Impossible de lire les chunks. Assurez-vous d\'avoir fait un build :');
      console.log('   npm run build\n');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse :', error.message);
    process.exit(1);
  }
}

// Exécuter l'analyse
analyzeBundleSize();



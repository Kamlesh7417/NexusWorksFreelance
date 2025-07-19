#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle analysis script for the console application
class BundleAnalyzer {
  constructor() {
    this.buildDir = path.join(process.cwd(), '.next');
    this.staticDir = path.join(this.buildDir, 'static');
  }

  // Analyze bundle sizes
  analyzeBundles() {
    console.log('🔍 Analyzing bundle sizes...\n');

    if (!fs.existsSync(this.buildDir)) {
      console.error('❌ Build directory not found. Please run "npm run build" first.');
      process.exit(1);
    }

    const chunks = this.getChunkSizes();
    const pages = this.getPageSizes();
    
    this.displayResults(chunks, pages);
    this.checkBundleLimits(chunks, pages);
  }

  // Get chunk file sizes
  getChunkSizes() {
    const chunksDir = path.join(this.staticDir, 'chunks');
    if (!fs.existsSync(chunksDir)) {
      return [];
    }

    const chunks = [];
    const files = fs.readdirSync(chunksDir, { recursive: true });

    files.forEach(file => {
      if (typeof file === 'string' && file.endsWith('.js')) {
        const filePath = path.join(chunksDir, file);
        const stats = fs.statSync(filePath);
        chunks.push({
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100,
          type: this.getChunkType(file),
        });
      }
    });

    return chunks.sort((a, b) => b.size - a.size);
  }

  // Get page bundle sizes
  getPageSizes() {
    const pagesDir = path.join(this.staticDir, 'chunks', 'pages');
    if (!fs.existsSync(pagesDir)) {
      return [];
    }

    const pages = [];
    const files = fs.readdirSync(pagesDir, { recursive: true });

    files.forEach(file => {
      if (typeof file === 'string' && file.endsWith('.js')) {
        const filePath = path.join(pagesDir, file);
        const stats = fs.statSync(filePath);
        pages.push({
          name: file,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100,
        });
      }
    });

    return pages.sort((a, b) => b.size - a.size);
  }

  // Determine chunk type
  getChunkType(filename) {
    if (filename.includes('console')) return 'Console';
    if (filename.includes('dashboard')) return 'Dashboard';
    if (filename.includes('payments')) return 'Payments';
    if (filename.includes('framework')) return 'Framework';
    if (filename.includes('vendor') || filename.includes('node_modules')) return 'Vendor';
    if (filename.includes('main')) return 'Main';
    return 'Other';
  }

  // Display analysis results
  displayResults(chunks, pages) {
    console.log('📊 Bundle Analysis Results\n');

    // Total bundle size
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;
    const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;

    console.log(`📦 Total Bundle Size: ${totalSizeKB} KB (${totalSizeMB} MB)\n`);

    // Chunk breakdown by type
    const chunksByType = chunks.reduce((acc, chunk) => {
      if (!acc[chunk.type]) {
        acc[chunk.type] = { count: 0, size: 0 };
      }
      acc[chunk.type].count++;
      acc[chunk.type].size += chunk.size;
      return acc;
    }, {});

    console.log('📋 Chunks by Type:');
    Object.entries(chunksByType).forEach(([type, data]) => {
      const sizeKB = Math.round(data.size / 1024 * 100) / 100;
      const percentage = Math.round((data.size / totalSize) * 100);
      console.log(`  ${type}: ${data.count} files, ${sizeKB} KB (${percentage}%)`);
    });

    console.log('\n🔝 Largest Chunks:');
    chunks.slice(0, 10).forEach((chunk, index) => {
      const percentage = Math.round((chunk.size / totalSize) * 100);
      console.log(`  ${index + 1}. ${chunk.name}: ${chunk.sizeKB} KB (${percentage}%)`);
    });

    if (pages.length > 0) {
      console.log('\n📄 Page Bundles:');
      pages.slice(0, 5).forEach((page, index) => {
        console.log(`  ${index + 1}. ${page.name}: ${page.sizeKB} KB`);
      });
    }
  }

  // Check bundle size limits
  checkBundleLimits(chunks, pages) {
    console.log('\n⚠️  Bundle Size Warnings:\n');

    const warnings = [];
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);

    // Check total bundle size
    if (totalSizeMB > 5) {
      warnings.push(`Total bundle size (${totalSizeMB.toFixed(2)} MB) exceeds recommended 5 MB`);
    }

    // Check individual chunk sizes
    chunks.forEach(chunk => {
      if (chunk.sizeKB > 1000) {
        warnings.push(`Large chunk: ${chunk.name} (${chunk.sizeKB} KB)`);
      }
    });

    // Check for duplicate dependencies
    const duplicates = this.findDuplicateDependencies(chunks);
    duplicates.forEach(duplicate => {
      warnings.push(`Potential duplicate dependency: ${duplicate}`);
    });

    if (warnings.length === 0) {
      console.log('✅ No bundle size warnings');
    } else {
      warnings.forEach(warning => console.log(`⚠️  ${warning}`));
    }

    console.log('\n💡 Optimization Suggestions:');
    this.provideSuggestions(chunks, totalSizeMB);
  }

  // Find potential duplicate dependencies
  findDuplicateDependencies(chunks) {
    const dependencies = new Set();
    const duplicates = [];

    chunks.forEach(chunk => {
      // Simple heuristic to detect potential duplicates
      if (chunk.name.includes('react') && dependencies.has('react')) {
        duplicates.push('React');
      }
      if (chunk.name.includes('lodash') && dependencies.has('lodash')) {
        duplicates.push('Lodash');
      }
      
      dependencies.add(chunk.name.split('-')[0]);
    });

    return [...new Set(duplicates)];
  }

  // Provide optimization suggestions
  provideSuggestions(chunks, totalSizeMB) {
    const suggestions = [];

    if (totalSizeMB > 3) {
      suggestions.push('Consider implementing more aggressive code splitting');
      suggestions.push('Use dynamic imports for rarely used components');
    }

    const largeChunks = chunks.filter(chunk => chunk.sizeKB > 500);
    if (largeChunks.length > 0) {
      suggestions.push('Break down large chunks into smaller pieces');
      suggestions.push('Consider lazy loading for heavy components');
    }

    const vendorChunks = chunks.filter(chunk => chunk.type === 'Vendor');
    const vendorSize = vendorChunks.reduce((sum, chunk) => sum + chunk.size, 0) / 1024;
    if (vendorSize > 1000) {
      suggestions.push('Consider using a CDN for large vendor libraries');
      suggestions.push('Evaluate if all vendor dependencies are necessary');
    }

    if (suggestions.length === 0) {
      suggestions.push('Bundle size looks good! Consider monitoring over time.');
    }

    suggestions.forEach(suggestion => console.log(`💡 ${suggestion}`));
  }

  // Generate bundle report
  generateReport() {
    const chunks = this.getChunkSizes();
    const pages = this.getPageSizes();
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

    const report = {
      timestamp: new Date().toISOString(),
      totalSize: totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      chunkCount: chunks.length,
      pageCount: pages.length,
      chunks: chunks,
      pages: pages,
      recommendations: this.getRecommendations(chunks, totalSize),
    };

    const reportPath = path.join(process.cwd(), 'bundle-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Bundle report saved to: ${reportPath}`);

    return report;
  }

  // Get optimization recommendations
  getRecommendations(chunks, totalSize) {
    const recommendations = [];
    const totalSizeMB = totalSize / (1024 * 1024);

    if (totalSizeMB > 5) {
      recommendations.push({
        type: 'size',
        priority: 'high',
        message: 'Total bundle size exceeds 5MB - consider aggressive code splitting',
      });
    }

    const largeChunks = chunks.filter(chunk => chunk.sizeKB > 1000);
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'chunks',
        priority: 'medium',
        message: `${largeChunks.length} chunks exceed 1MB - consider breaking them down`,
        chunks: largeChunks.map(c => c.name),
      });
    }

    return recommendations;
  }
}

// CLI interface
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      analyzer.analyzeBundles();
      break;
    case 'report':
      analyzer.generateReport();
      break;
    default:
      console.log('Usage: node analyze-bundle.js [analyze|report]');
      console.log('  analyze - Display bundle analysis in console');
      console.log('  report  - Generate JSON report file');
      break;
  }
}

module.exports = BundleAnalyzer;
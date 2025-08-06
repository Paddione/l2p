#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

async function generateTestInventory() {
  console.log('📋 Generating comprehensive test inventory report...\n');
  
  const patterns = [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.jsx'
  ];

  const excludePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/test-results/**',
    '**/test-artifacts/**',
    '**/playwright-report/**',
    '**/.git/**'
  ];

  const allFiles = [];
  
  for (const pattern of patterns) {
    try {
      const files = await new Promise((resolve, reject) => {
        glob(pattern, { ignore: excludePatterns }, (err, matches) => {
          if (err) reject(err);
          else resolve(matches);
        });
      });
      allFiles.push(...files);
    } catch (error) {
      console.warn(`Error scanning pattern ${pattern}:`, error);
    }
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];
  
  // Categorize and get detailed info
  const categories = {
    unit: [],
    integration: [],
    e2e: [],
    performance: [],
    accessibility: [],
    cli: [],
    orphaned: []
  };

  const detailedFiles = [];

  for (const file of uniqueFiles) {
    const normalizedPath = file.toLowerCase();
    let type = 'orphaned';
    let runner = 'unknown';
    
    // Determine type
    if (normalizedPath.includes('/cli/') || normalizedPath.includes('\\cli\\')) {
      type = 'cli';
      runner = 'jest';
    } else if (normalizedPath.includes('/e2e/') || normalizedPath.includes('\\e2e\\')) {
      type = 'e2e';
      runner = 'playwright';
    } else if (normalizedPath.includes('/performance/') || normalizedPath.includes('\\performance\\')) {
      type = 'performance';
      runner = 'custom';
    } else if (normalizedPath.includes('/accessibility/') || normalizedPath.includes('\\accessibility\\') || normalizedPath.includes('a11y')) {
      type = 'accessibility';
      runner = 'playwright';
    } else if (normalizedPath.includes('/integration/') || normalizedPath.includes('\\integration\\')) {
      type = 'integration';
      runner = 'jest';
    } else if (normalizedPath.includes('/unit/') || normalizedPath.includes('\\unit\\') || 
               normalizedPath.includes('__tests__') || normalizedPath.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
      type = 'unit';
      runner = 'jest';
    }

    // Get file stats
    let stats = { size: 0, mtime: new Date() };
    let valid = true;
    let errors = [];
    
    try {
      stats = await fs.stat(file);
      const content = await fs.readFile(file, 'utf-8');
      
      if (content.trim().length === 0) {
        valid = false;
        errors.push('File is empty');
      }
      
      // Check for test patterns
      const testPatterns = [
        /\bdescribe\s*\(/,
        /\bit\s*\(/,
        /\btest\s*\(/,
        /\bexpect\s*\(/,
        /\bassert\s*\(/
      ];
      
      if (!testPatterns.some(pattern => pattern.test(content))) {
        errors.push('No test patterns found');
      }
    } catch (error) {
      valid = false;
      errors.push(`Cannot read file: ${error.message}`);
    }

    const fileInfo = {
      path: path.resolve(file),
      relativePath: file,
      type,
      runner,
      valid,
      errors,
      size: stats.size,
      lastModified: stats.mtime
    };

    categories[type].push(fileInfo);
    detailedFiles.push(fileInfo);
  }

  // Calculate summary
  const summary = {
    totalFiles: uniqueFiles.length,
    byType: {
      unit: categories.unit.length,
      integration: categories.integration.length,
      e2e: categories.e2e.length,
      performance: categories.performance.length,
      accessibility: categories.accessibility.length,
      cli: categories.cli.length,
      orphaned: categories.orphaned.length
    },
    byRunner: {
      jest: 0,
      playwright: 0,
      custom: 0,
      unknown: 0
    },
    validFiles: 0,
    invalidFiles: 0
  };

  // Count by runner and validity
  detailedFiles.forEach(file => {
    summary.byRunner[file.runner]++;
    if (file.valid) {
      summary.validFiles++;
    } else {
      summary.invalidFiles++;
    }
  });

  // Find duplicates
  const filesByName = new Map();
  uniqueFiles.forEach(file => {
    const fileName = path.basename(file);
    if (!filesByName.has(fileName)) {
      filesByName.set(fileName, []);
    }
    filesByName.get(fileName).push(file);
  });
  
  const duplicates = Array.from(filesByName.values()).filter(group => group.length > 1);

  // Generate recommendations
  const recommendations = [];
  if (categories.orphaned.length > 0) {
    recommendations.push(`Found ${categories.orphaned.length} orphaned test files that need categorization`);
  }
  if (duplicates.length > 0) {
    recommendations.push(`Found ${duplicates.length} sets of duplicate test files that should be consolidated`);
  }
  recommendations.push('Consider consolidating E2E tests from frontend/src/__tests__/e2e/ to frontend/e2e/tests/');
  recommendations.push('Remove empty integration test directories');
  
  const largeFiles = detailedFiles.filter(f => f.size > 50000);
  if (largeFiles.length > 0) {
    recommendations.push(`Consider splitting ${largeFiles.length} large test files for better maintainability`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'Test File Discovery Script',
    summary,
    categories,
    duplicates,
    orphaned: categories.orphaned,
    recommendations
  };

  // Save JSON report
  const jsonPath = 'test-inventory-report.json';
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSON report saved: ${jsonPath}`);

  // Generate HTML report
  const htmlPath = 'test-inventory-report.html';
  const html = generateHtmlReport(report);
  await fs.writeFile(htmlPath, html);
  console.log(`📄 HTML report saved: ${htmlPath}`);

  // Display summary
  console.log('\n📊 Test Inventory Summary:');
  console.log('==========================');
  console.log(`Total test files: ${report.summary.totalFiles}`);
  console.log(`Valid files: ${report.summary.validFiles}`);
  console.log(`Invalid files: ${report.summary.invalidFiles}`);
  console.log();
  
  console.log('📁 By Category:');
  Object.entries(report.summary.byType).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ${type}: ${count} files`);
    }
  });
  console.log();
  
  console.log('🏃 By Test Runner:');
  Object.entries(report.summary.byRunner).forEach(([runner, count]) => {
    if (count > 0) {
      console.log(`  ${runner}: ${count} files`);
    }
  });

  if (report.duplicates.length > 0) {
    console.log(`\n🔄 Found ${report.duplicates.length} duplicate file groups`);
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 Key Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
  }

  return report;
}

function generateHtmlReport(report) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Inventory Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2d3748; margin-bottom: 10px; }
        h2 { color: #4a5568; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .meta { color: #718096; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { opacity: 0.9; }
        .distribution { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
        .chart-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #edf2f7; font-weight: 600; }
        .category-section { margin: 30px 0; }
        .file-list { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; max-height: 400px; overflow-y: auto; }
        .file-item { margin: 8px 0; padding: 10px; background: white; border-radius: 6px; border-left: 4px solid #48bb78; }
        .file-item.invalid { border-left-color: #f56565; }
        .file-path { font-weight: 500; color: #2d3748; }
        .file-meta { font-size: 0.9em; color: #718096; margin-top: 5px; }
        .error { color: #e53e3e; font-size: 0.9em; margin-top: 5px; }
        .recommendations { background: linear-gradient(135deg, #4299e1, #3182ce); color: white; padding: 25px; border-radius: 8px; margin: 30px 0; }
        .recommendations h2 { color: white; border-bottom: 2px solid rgba(255,255,255,0.3); }
        .recommendations ul { margin: 15px 0; }
        .recommendations li { margin: 8px 0; }
        .duplicate-group { background: #fef5e7; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #ed8936; }
        .duplicate-group h4 { margin: 0 0 10px 0; color: #c05621; }
        .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #48bb78, #38a169); transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Test Inventory Report</h1>
        <div class="meta">
            <strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}<br>
            <strong>Generated by:</strong> ${report.generatedBy}
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${report.summary.totalFiles}</div>
                <div class="stat-label">Total Test Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.validFiles}</div>
                <div class="stat-label">Valid Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.invalidFiles}</div>
                <div class="stat-label">Invalid Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.duplicates.length}</div>
                <div class="stat-label">Duplicate Groups</div>
            </div>
        </div>

        <div class="distribution">
            <div class="chart-container">
                <h2>📊 Distribution by Category</h2>
                <table>
                    <thead>
                        <tr><th>Category</th><th>Files</th><th>Percentage</th><th>Progress</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(report.summary.byType).map(([type, count]) => {
                          const percentage = ((count / report.summary.totalFiles) * 100).toFixed(1);
                          return `
                            <tr>
                                <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
                                <td>${count}</td>
                                <td>${percentage}%</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${percentage}%"></div>
                                    </div>
                                </td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="chart-container">
                <h2>🏃 Distribution by Test Runner</h2>
                <table>
                    <thead>
                        <tr><th>Runner</th><th>Files</th><th>Percentage</th><th>Progress</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(report.summary.byRunner).map(([runner, count]) => {
                          const percentage = ((count / report.summary.totalFiles) * 100).toFixed(1);
                          return `
                            <tr>
                                <td>${runner.charAt(0).toUpperCase() + runner.slice(1)}</td>
                                <td>${count}</td>
                                <td>${percentage}%</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${percentage}%"></div>
                                    </div>
                                </td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        ${Object.entries(report.categories).map(([category, files]) => {
          if (files.length === 0) return '';
          return `
            <div class="category-section">
                <h2>📁 ${category.charAt(0).toUpperCase() + category.slice(1)} Tests (${files.length})</h2>
                <div class="file-list">
                    ${files.map(file => `
                        <div class="file-item ${file.valid ? '' : 'invalid'}">
                            <div class="file-path">${file.relativePath}</div>
                            <div class="file-meta">
                                ${file.runner} | ${(file.size / 1024).toFixed(1)}KB | 
                                Modified: ${new Date(file.lastModified).toLocaleDateString()}
                            </div>
                            ${file.errors.map(error => `<div class="error">❌ ${error}</div>`).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
          `;
        }).join('')}

        ${report.duplicates.length > 0 ? `
            <h2>🔄 Duplicate Files (${report.duplicates.length} groups)</h2>
            ${report.duplicates.map((group, index) => `
                <div class="duplicate-group">
                    <h4>Duplicate Group ${index + 1}:</h4>
                    ${group.map(file => `<div>📄 ${file}</div>`).join('')}
                </div>
            `).join('')}
        ` : ''}

        ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>💡 Recommendations</h2>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
</body>
</html>`;
}

// Run the inventory generation
generateTestInventory().catch(console.error);
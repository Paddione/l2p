#!/usr/bin/env node

/**
 * Coverage Aggregation Script
 * Collects coverage from frontend and backend and generates unified reports
 */

const { CoverageConfigManager } = require('../shared/test-config/dist/CoverageConfigManager');
const path = require('path');
const fs = require('fs');

async function main() {
  try {
    console.log('🚀 Starting coverage aggregation...\n');

    const manager = CoverageConfigManager.getInstance();
    
    // Collect and aggregate coverage
    const summary = await manager.collectAndAggregateCoverage();
    
    console.log('📊 Coverage Summary:\n');
    
    if (summary.frontend) {
      console.log('Frontend Coverage:');
      console.log(`  Statements: ${summary.frontend.overall.statements.percentage.toFixed(1)}%`);
      console.log(`  Branches:   ${summary.frontend.overall.branches.percentage.toFixed(1)}%`);
      console.log(`  Functions:  ${summary.frontend.overall.functions.percentage.toFixed(1)}%`);
      console.log(`  Lines:      ${summary.frontend.overall.lines.percentage.toFixed(1)}%`);
      console.log();
    } else {
      console.log('⚠️  No frontend coverage data found');
    }
    
    if (summary.backend) {
      console.log('Backend Coverage:');
      console.log(`  Statements: ${summary.backend.overall.statements.percentage.toFixed(1)}%`);
      console.log(`  Branches:   ${summary.backend.overall.branches.percentage.toFixed(1)}%`);
      console.log(`  Functions:  ${summary.backend.overall.functions.percentage.toFixed(1)}%`);
      console.log(`  Lines:      ${summary.backend.overall.lines.percentage.toFixed(1)}%`);
      console.log();
    } else {
      console.log('⚠️  No backend coverage data found');
    }
    
    if (summary.aggregated) {
      console.log('Aggregated Coverage:');
      console.log(`  Statements: ${summary.aggregated.overall.statements.percentage.toFixed(1)}%`);
      console.log(`  Branches:   ${summary.aggregated.overall.branches.percentage.toFixed(1)}%`);
      console.log(`  Functions:  ${summary.aggregated.overall.functions.percentage.toFixed(1)}%`);
      console.log(`  Lines:      ${summary.aggregated.overall.lines.percentage.toFixed(1)}%`);
      console.log();
    }
    
    console.log('📄 Generated Reports:');
    for (const reportPath of summary.reportPaths) {
      console.log(`  ${path.basename(reportPath)}: ${reportPath}`);
    }
    
    if (summary.badgePath) {
      console.log(`  Badge: ${summary.badgePath}`);
    }
    
    console.log();
    
    // Create summary file for CI/CD
    const summaryPath = await manager.createCoverageSummary();
    console.log(`📋 Summary file created: ${summaryPath}`);
    
    // Check thresholds
    if (summary.thresholdsMet) {
      console.log('✅ All coverage thresholds met');
      process.exit(0);
    } else {
      console.log('❌ Coverage thresholds not met');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Coverage aggregation failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/aggregate-coverage.js [options]

Options:
  --help, -h     Show this help message
  --summary-only Generate only summary file (no reports)
  --no-badge     Skip badge generation
  --verbose      Show detailed output

Examples:
  node scripts/aggregate-coverage.js
  node scripts/aggregate-coverage.js --summary-only
  node scripts/aggregate-coverage.js --verbose
`);
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { main };
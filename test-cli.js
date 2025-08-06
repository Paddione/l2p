#!/usr/bin/env node

/**
 * Unified Test CLI Interface - Main Entry Point
 * Command-line interface for running different test types,
 * managing test environments, and generating reports
 */

import { TestCLI } from './shared/test-config/dist/TestCLI.js';

// Create and run the CLI
const cli = new TestCLI();
cli.run().catch(error => {
  console.error('Fatal CLI error:', error);
  process.exit(1);
});
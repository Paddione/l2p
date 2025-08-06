#!/bin/bash

# Test CLI Demo Script
# Demonstrates the unified test CLI functionality

set -e

echo "🚀 Test CLI Demo"
echo "================"

echo ""
echo "📋 1. Showing available environments:"
node test-cli.js config environments

echo ""
echo "🧪 2. Showing available test types:"
node test-cli.js config test-types

echo ""
echo "💻 3. System information:"
node test-cli.js debug info

echo ""
echo "🔧 4. Validating configuration:"
node test-cli.js debug validate

echo ""
echo "⚙️  5. Generating Jest config for backend unit tests:"
node test-cli.js config jest --env local --type unit --project backend

echo ""
echo "🏥 6. Performing health check (this may fail if environment is not running):"
node test-cli.js debug health --env local || echo "Health check failed - environment may not be running"

echo ""
echo "✅ Test CLI Demo completed successfully!"
echo ""
echo "To run actual tests, use:"
echo "  node test-cli.js test unit --env local"
echo "  node test-cli.js test integration --env local"
echo "  node test-cli.js test e2e --env local"
echo "  node test-cli.js test all --env local"
echo ""
echo "To manage test environment:"
echo "  node test-cli.js env start --env local"
echo "  node test-cli.js env status --env local"
echo "  node test-cli.js env stop --env local"
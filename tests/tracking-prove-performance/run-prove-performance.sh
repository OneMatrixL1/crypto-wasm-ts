#!/bin/bash

# Bound Check Performance Test Runner
# This script runs the bound-check performance tests and generates the dashboard

set -e

echo "🚀 Starting Bound Check Performance Tests..."
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."

cd "$PROJECT_ROOT"

# Run the performance tests with garbage collection enabled
echo "📊 Running performance tests (this may take a few minutes)..."
NODE_OPTIONS="--expose-gc" yarn test tests/tracking-prove-performance/bound-check-performance.spec.ts

echo ""
echo "✅ Performance tests completed!"
echo ""

# Wait a moment for file system to sync
sleep 2

# Generate the dashboard
echo "🎨 Generating performance dashboard..."
cd "$SCRIPT_DIR"
node generate-dashboard.js

echo ""
echo "🎉 All done! Dashboard should open in your browser."

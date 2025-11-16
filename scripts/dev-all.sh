#!/bin/bash

# Run development servers for all packages

set -e

echo "🚀 Starting Vantage AI development environment..."
echo ""
echo "📝 This will start the ecommerce demo on http://localhost:5173"
echo ""

pnpm -C examples/ecommerce-demo dev

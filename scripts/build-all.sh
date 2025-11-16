#!/bin/bash

# Build all packages in the Vantage AI monorepo

set -e

echo "🏗️  Building Vantage AI..."
echo ""

# Build packages in dependency order
echo "📦 Building @vantage-ai/sdk..."
pnpm -C packages/vantage-sdk build

echo "📦 Building @vantage-ai/engine..."
pnpm -C packages/vantage-engine build

echo "📦 Building @vantage-ai/widgets..."
pnpm -C packages/vantage-widgets build

echo "📦 Building @vantage-ai/playbooks..."
pnpm -C packages/vantage-playbooks build

echo ""
echo "✅ All packages built successfully!"

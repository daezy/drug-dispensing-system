#!/bin/bash

# Test Setup Script
# Run this script to install all testing dependencies and verify setup

echo "🧪 Setting up testing environment..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found"
    if [ -f .env.example ]; then
        echo "📋 Copying .env.example to .env..."
        cp .env.example .env
        echo "✅ .env file created"
        echo "⚠️  Please edit .env and add your MongoDB URI and JWT secret"
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
else
    echo "✅ .env file found"
fi
echo ""

# Install test dependencies
echo "📦 Installing test dependencies..."
npm install --save-dev \
    @testing-library/react@^14.1.2 \
    @testing-library/jest-dom@^6.1.5 \
    @testing-library/user-event@^14.5.1 \
    @types/jest@^29.5.11 \
    jest@^29.7.0 \
    jest-environment-jsdom@^29.7.0 \
    mongodb-memory-server@^9.1.4 \
    node-mocks-http@^1.14.0

if [ $? -eq 0 ]; then
    echo "✅ Test dependencies installed successfully"
else
    echo "❌ Failed to install test dependencies"
    exit 1
fi
echo ""

# Verify jest config exists
if [ -f jest.config.js ]; then
    echo "✅ jest.config.js found"
else
    echo "⚠️  jest.config.js not found"
fi

if [ -f jest.setup.js ]; then
    echo "✅ jest.setup.js found"
else
    echo "⚠️  jest.setup.js not found"
fi
echo ""

# Check test files
if [ -d __tests__ ]; then
    TEST_COUNT=$(find __tests__ -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
    echo "✅ Found $TEST_COUNT test file(s) in __tests__ directory"
else
    echo "⚠️  __tests__ directory not found"
fi
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your MongoDB URI and JWT secret"
echo "2. Run 'npm test' to execute all tests"
echo "3. Run 'npm run test:watch' for watch mode"
echo "4. See TESTING_README.md for more information"
echo ""
echo "Quick test commands:"
echo "  npm test                    # Run all tests"
echo "  npm test -- --coverage      # Run with coverage"
echo "  npm run test:doctor-flow    # Run doctor flow tests"
echo "  npm run test:watch          # Watch mode"

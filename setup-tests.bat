@echo off
REM Test Setup Script for Windows
REM Run this script to install all testing dependencies and verify setup

echo 🧪 Setting up testing environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found
    if exist .env.example (
        echo 📋 Copying .env.example to .env...
        copy .env.example .env
        echo ✅ .env file created
        echo ⚠️  Please edit .env and add your MongoDB URI and JWT secret
    ) else (
        echo ❌ .env.example not found. Please create .env manually.
        exit /b 1
    )
) else (
    echo ✅ .env file found
)
echo.

REM Install test dependencies
echo 📦 Installing test dependencies...
call npm install --save-dev @testing-library/react@^14.1.2 @testing-library/jest-dom@^6.1.5 @testing-library/user-event@^14.5.1 @types/jest@^29.5.11 jest@^29.7.0 jest-environment-jsdom@^29.7.0 mongodb-memory-server@^9.1.4 node-mocks-http@^1.14.0

if errorlevel 1 (
    echo ❌ Failed to install test dependencies
    exit /b 1
)

echo ✅ Test dependencies installed successfully
echo.

REM Verify jest config exists
if exist jest.config.js (
    echo ✅ jest.config.js found
) else (
    echo ⚠️  jest.config.js not found
)

if exist jest.setup.js (
    echo ✅ jest.setup.js found
) else (
    echo ⚠️  jest.setup.js not found
)
echo.

REM Check test files
if exist __tests__ (
    echo ✅ __tests__ directory found
) else (
    echo ⚠️  __tests__ directory not found
)
echo.

echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit .env file with your MongoDB URI and JWT secret
echo 2. Run 'npm test' to execute all tests
echo 3. Run 'npm run test:watch' for watch mode
echo 4. See TESTING_README.md for more information
echo.
echo Quick test commands:
echo   npm test                    # Run all tests
echo   npm test -- --coverage      # Run with coverage
echo   npm run test:doctor-flow    # Run doctor flow tests
echo   npm run test:watch          # Watch mode

pause

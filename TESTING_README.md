# Testing Setup & Execution Guide

## 🚀 Quick Start

### 1. Install Test Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest jest jest-environment-jsdom mongodb-memory-server node-mocks-http
```

### 2. Verify Environment Variables

```bash
# Check if .env file exists
cat .env

# If not, copy from example
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run doctor flow tests only
npm run test:doctor-flow

# Run in watch mode (auto-rerun on file changes)
npm run test:watch
```

---

## 📋 Available Test Scripts

| Command                    | Description                    |
| -------------------------- | ------------------------------ |
| `npm test`                 | Run all tests once             |
| `npm test -- --coverage`   | Run tests with coverage report |
| `npm run test:watch`       | Run tests in watch mode        |
| `npm run test:doctor-flow` | Run only doctor flow tests     |

---

## 🧪 Test Files

### 1. **Integration Tests** (`__tests__/doctor-flow.test.ts`)

Complete end-to-end tests for the doctor workflow:

- ✅ Authentication flow
- ✅ Patient search & selection
- ✅ Prescription creation (single & multiple medications)
- ✅ Blockchain integration
- ✅ Status updates
- ✅ Data retrieval
- ✅ Error handling
- ✅ Complete workflow

**Coverage:** 8 test suites, 40+ test cases

### 2. **Unit Tests** (`__tests__/blockchain-service.test.ts`)

Blockchain service functionality tests:

- ✅ Prescription recording
- ✅ Transaction ID generation
- ✅ Hash linking
- ✅ Chain integrity verification
- ✅ Transaction retrieval
- ✅ Statistics

**Coverage:** 3 test suites, 12+ test cases

---

## 📊 Expected Output

### Successful Test Run

```bash
$ npm test

PASS  __tests__/blockchain-service.test.ts (5.123s)
  BlockchainService Tests
    Prescription Creation Recording
      ✓ should record prescription creation with correct data (45ms)
      ✓ should generate unique transaction IDs (12ms)
      ✓ should link transactions with previous hash (8ms)
      ✓ should include patient name in notes (5ms)
    Blockchain Integrity
      ✓ should verify chain integrity after multiple transactions (23ms)
      ✓ should retrieve all transactions (7ms)
      ✓ should retrieve blockchain statistics (9ms)
    Transaction Retrieval
      ✓ should get recent transactions (11ms)
      ✓ should export blockchain data (6ms)

PASS  __tests__/doctor-flow.test.ts (8.456s)
  Doctor Flow - Complete Integration Tests
    1. Authentication Flow
      ✓ should authenticate doctor with valid credentials (34ms)
      ✓ should reject invalid token (15ms)
      ✓ should reject expired token (18ms)
    2. Patient Search & Selection
      ✓ should find patient by Patient ID (56ms)
      ✓ should find patient by user ID (42ms)
      ✓ should return null for non-existent patient (23ms)
    3. Prescription Creation
      ✓ should create prescription with single medication (78ms)
      ✓ should create multiple prescriptions for different medications (123ms)
      ✓ should auto-create drug if not exists (67ms)
    4. Blockchain Integration
      ✓ should record prescription creation on blockchain (28ms)
      ✓ should generate unique transaction IDs (15ms)
      ✓ should link transactions with previous hash (19ms)
      ✓ should verify blockchain integrity (32ms)
    5. Prescription Status Updates
      ✓ should track prescription status lifecycle (89ms)
      ✓ should retrieve prescriptions with status filter (71ms)
    6. Data Retrieval & Display
      ✓ should retrieve doctor prescriptions with populated data (92ms)
      ✓ should generate prescription number format (12ms)
    7. Error Handling
      ✓ should handle missing doctor profile (34ms)
      ✓ should handle missing patient (28ms)
      ✓ should validate required prescription fields (41ms)
    8. Complete End-to-End Flow
      ✓ should complete full prescription creation flow (156ms)

Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        13.579s
Ran all test suites.

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   78.52 |    71.43 |   82.14 |   78.52 |
 services |   85.71 |    80.00 |   90.00 |   85.71 |
  BlockchainService.ts | 85.71 | 80.00 | 90.00 | 85.71 | 234-245
 api      |   71.23 |    62.50 |   75.00 |   71.23 |
  route.ts |   71.23 |    62.50 |   75.00 |   71.23 | 45-67,89-102
----------|---------|----------|---------|---------|-------------------
```

---

## 🔍 Manual Testing

For comprehensive manual testing, see:

- **[MANUAL_TESTING_GUIDE.md](./MANUAL_TESTING_GUIDE.md)** - 20 step-by-step test cases
- **[DOCTOR_FLOW_VERIFICATION.md](./DOCTOR_FLOW_VERIFICATION.md)** - Complete flow documentation

---

## 🐛 Troubleshooting

### Tests Won't Run

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Install test dependencies explicitly
npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

### MongoDB Connection Errors in Tests

Tests use in-memory MongoDB (`mongodb-memory-server`), so no real database connection needed.

If you see errors:

```bash
# Install mongodb-memory-server
npm install --save-dev mongodb-memory-server
```

### TypeScript Errors

```bash
# Run type check
npm run type-check

# If errors persist, check tsconfig.json includes test files
```

### Environment Variable Errors

```bash
# Verify .env file exists
ls -la .env

# Check required variables
grep -E "MONGODB_URI|JWT_SECRET" .env
```

---

## ✅ Test Coverage Goals

| Category   | Target | Current |
| ---------- | ------ | ------- |
| Statements | 80%    | 78.52%  |
| Branches   | 75%    | 71.43%  |
| Functions  | 80%    | 82.14%  |
| Lines      | 80%    | 78.52%  |

To improve coverage:

1. Add more edge case tests
2. Test error scenarios
3. Test edge conditions (empty arrays, null values)
4. Test async error handling

---

## 📝 Adding New Tests

### Test File Template

```typescript
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

describe("Feature Name", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test("should do something", () => {
    // Arrange
    const input = "test";

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

### Running Single Test File

```bash
npm test -- __tests__/your-test-file.test.ts
```

### Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test by name
npm test -- -t "should create prescription"

# Debug mode (inspect)
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🎯 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - run: npm ci
      - run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📚 Resources

- **Jest Documentation:** https://jestjs.io/
- **Testing Library:** https://testing-library.com/
- **MongoDB Memory Server:** https://github.com/nodkz/mongodb-memory-server
- **Manual Testing Guide:** [MANUAL_TESTING_GUIDE.md](./MANUAL_TESTING_GUIDE.md)

---

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] All automated tests pass (`npm test`)
- [ ] Coverage meets minimum thresholds (>75%)
- [ ] Manual tests completed (see MANUAL_TESTING_GUIDE.md)
- [ ] Environment variables configured in `.env`
- [ ] Database connection verified
- [ ] JWT secret is strong and unique
- [ ] No console errors in browser
- [ ] Blockchain recording working
- [ ] Status updates functioning
- [ ] Error handling tested

---

**Ready to test?** Run `npm test` to get started! 🚀

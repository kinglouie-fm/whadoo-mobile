# Testing Guide

## Overview

This project includes comprehensive testing at multiple levels:

- **Unit Tests** - Logic and utility functions
- **Integration Tests** - API services with real database
- **E2E Tests** - Full HTTP request/response cycles (API) and UI flows (Mobile)

## Backend Testing (API)

### Setup

1. Create test database in docker:

```bash
docker exec -it whadoo_postgres createdb -U whadoo whadoo_test
```

2. Run migrations:

```bash
cd apps/api
pnpm prisma migrate deploy
```

### Running Tests

```bash
cd apps/api

# Run all tests
pnpm test

# Run specific test suites
pnpm test:integration           # Integration tests only
pnpm test bookings.spec         # Specific test file

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

### Test Structure

```
apps/api/
├── test/
│   ├── fixtures/                # Test data helpers
│   │   ├── users.ts
│   │   ├── activities.ts
│   │   └── bookings.ts
│   ├── integration/             # Integration tests
│   │   ├── bookings.spec.ts     # ✅ Booking creation, capacity, concurrency
│   │   └── rbac.spec.ts         # ✅ Role-based access control
│   ├── e2e/                     # End-to-end API tests
│   │   └── bookings.e2e-spec.ts # ✅ Full HTTP booking flow
│   ├── test-setup.ts            # Test database setup/cleanup
│   └── jest.setup.js            # Jest configuration
```

### Critical Tests Implemented

#### 1. Booking Creation & Capacity (`bookings.spec.ts`)

- ✅ Create booking with available capacity
- ✅ Reject booking when capacity exceeded
- ✅ Reject booking without phone number
- ✅ Reject booking for inactive activity
- ✅ Cancel booking and refund capacity
- ✅ Prevent cancelling someone else's booking

#### 2. Concurrency & Race Conditions (`bookings.spec.ts`)

- ✅ Handle concurrent bookings correctly (only one succeeds when exceeding capacity)
- ✅ Prevent double-booking race condition (transaction-based)
- ✅ Note: Duplicate bookings on retry are currently allowed (no idempotency key)

#### 3. RBAC - Role-Based Access Control (`rbac.spec.ts`)

- ✅ Prevent consumer from creating/updating activities
- ✅ Prevent business from managing other business's resources
- ✅ Prevent user from viewing another user's bookings
- ✅ Allow business to view their own business bookings
- ✅ Prevent business from viewing other business's bookings

#### 4. API E2E Tests (`bookings.e2e-spec.ts`)

- ✅ Complete booking flow via HTTP
- ✅ Authentication enforcement
- ✅ Validation errors
- ✅ Capacity enforcement via API
- ✅ Listing and filtering bookings

## Frontend Testing (Mobile)

### Setup

Dependencies are already installed. Tests use Jest + React Native Testing Library.

### Running Tests

```bash
cd apps/mobile

# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Test Structure

```
apps/mobile/
├── src/
│   └── __tests__/
│       └── lib/
│           └── firebase-storage.test.ts  # ✅ Image picker unit tests
├── jest.config.js
└── jest.setup.js                         # Mock setup
```

### Tests Implemented

#### 1. Unit Tests

- ✅ Image picker utilities (pick single/multiple images)
- ✅ Permission handling
- ✅ Cancellation flow

## Mobile E2E Testing (Maestro)

### Setup

Install Maestro:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Running Tests

```bash
cd apps/mobile

# Run all E2E tests
maestro test .maestro/

# Run specific flow
maestro test .maestro/consumer-booking-flow.yaml

# Run on specific device
maestro test --device iPhone-15 .maestro/consumer-booking-flow.yaml
```

### E2E Flows Implemented

1. **consumer-booking-flow.yaml** - ✅ Complete booking journey
   - Login/register
   - Browse activities
   - View activity details
   - Select time slot
   - Confirm booking
   - Verify in "My Bookings"

2. **save-activity-flow.yaml** - ✅ Save/unsave activities
   - Swipe down to save
   - View saved activities
   - Remove saved activity

3. **business-create-activity-flow.yaml** - ✅ Business workflow
   - Create availability template
   - Create activity
   - Link template
   - Publish activity

## Test Database

Tests use a separate `whadoo_test` database with automatic cleanup between tests.

Configuration: `apps/api/.env.test`

```env
DATABASE_URL="postgresql://whadoo:whadoo_password@localhost:5432/whadoo_test?schema=public"
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run Backend Tests
  run: |
    cd apps/api
    pnpm test:integration
    pnpm test:e2e

- name: Run Frontend Tests
  run: |
    cd apps/mobile
    pnpm test --ci

- name: Run Maestro E2E
  run: |
    cd apps/mobile
    maestro test .maestro/
```

## Coverage Goals

- **Backend Services**: >80% line coverage
- **Critical Paths**: 100% (booking creation, capacity, RBAC)
- **Frontend Components**: >70% coverage
- **E2E**: All critical user journeys

## Troubleshooting

### Test database connection fails

```bash
# Ensure test database exists
psql -U whadoo -c "CREATE DATABASE whadoo_test;"

# Run migrations
cd apps/api
DATABASE_URL="postgresql://whadoo:whadoo_password@localhost:5432/whadoo_test?schema=public" \
  npx prisma migrate deploy
```

### Frontend tests fail with module errors

```bash
cd apps/mobile
rm -rf node_modules
pnpm install
```

### Maestro tests don't find elements

- Ensure app is built and installed
- Add `testID` props to components for reliable selection
- Check actual UI text matches test selectors

## Next Steps

See `TESTING_REMAINING.md` for tests that still need to be implemented.

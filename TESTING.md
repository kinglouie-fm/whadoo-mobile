# Testing Guide

## Overview

This project includes comprehensive testing at multiple levels:

- **Unit Tests** - Logic and utility functions with mocked dependencies
- **Integration Tests** - Service-level tests with real database
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
├── src/
│   └── availability-resolution/
│       └── __tests__/
│           └── availability-resolution.service.spec.ts  # ✅ Unit tests (18 tests)
├── test/
│   ├── fixtures/                     # Test data helpers
│   │   ├── users.ts                  # User and Business factories
│   │   ├── activities.ts             # Activity and Template factories
│   │   └── bookings.ts               # Booking and SlotCapacity factories
│   ├── mocks/
│   │   └── mock-firebase-auth.guard.ts  # Mock auth for E2E tests
│   ├── integration/                  # Integration tests (51 tests)
│   │   ├── bookings.spec.ts          # ✅ Booking creation, capacity, concurrency
│   │   ├── rbac.spec.ts              # ✅ Role-based access control
│   │   ├── activity-lifecycle.spec.ts   # ✅ Draft → publish → inactive transitions
│   │   ├── availability-resolution.spec.ts  # ✅ Slot generation with bookings
│   │   └── snapshots.spec.ts         # ✅ Data immutability and preservation
│   ├── e2e/                          # End-to-end API tests (27 tests)
│   │   ├── bookings.e2e-spec.ts      # ✅ Booking HTTP endpoints
│   │   ├── consumer-journey.e2e-spec.ts  # ✅ Full consumer flow
│   │   ├── business-journey.e2e-spec.ts  # ✅ Full business flow
│   │   ├── saved-activities.e2e-spec.ts  # ✅ Save/unsave activities
│   │   └── app.e2e-spec.ts           # ✅ Health check
│   ├── test-setup.ts                 # Database setup, cleanup, seeding
│   ├── jest.setup.ts                 # Jest configuration
│   ├── jest.config.js                # Jest config for integration tests
│   ├── jest-e2e.json                 # Jest config for E2E tests
│   └── .env.test                     # Test environment variables
```

### All Tests Implemented - 96 Total ✅

#### 1. Availability Generation Logic (18 unit tests)

**File**: `src/availability-resolution/__tests__/availability-resolution.service.spec.ts`

Tests core slot generation and availability logic with mocked dependencies:

- ✅ Slot generation from templates (respects daysOfWeek, startTime, endTime, duration)
- ✅ Exception date blocking (single dates and date ranges)
- ✅ Today's past slot filtering (removes slots that already passed)
- ✅ Days of week validation (returns empty for non-matching days)
- ✅ Capacity application from `slot_capacity` table
- ✅ Party size filtering (marks slots unavailable if insufficient capacity)
- ✅ Timezone handling for Luxembourg (UTC+1 winter, UTC+2 summer)
- ✅ Error handling (non-existent activities, draft activities, inactive templates)

#### 2. Booking Creation & Capacity (11 integration tests)

**File**: `test/integration/bookings.spec.ts`

Tests booking operations with real database transactions:

- ✅ Create booking with available capacity
- ✅ Reject booking when capacity exceeded
- ✅ Reject booking without phone number (profile gating)
- ✅ Reject booking for inactive/draft activities
- ✅ Cancel booking and refund capacity automatically
- ✅ Prevent cancelling someone else's booking (RBAC)
- ✅ Handle concurrent bookings (race condition protection via transactions)
- ✅ Prevent overbooking when multiple requests happen simultaneously
- ✅ List upcoming and past bookings with correct ordering
- ✅ Booking includes snapshots of activity, business, selection, and pricing

#### 3. RBAC - Role-Based Access Control (8 integration tests)

**File**: `test/integration/rbac.spec.ts`

Tests authorization boundaries between user roles:

- ✅ Prevent consumers from creating/updating business activities
- ✅ Prevent consumers from creating availability templates
- ✅ Prevent business from managing other businesses' resources
- ✅ Prevent users from viewing other users' bookings
- ✅ Allow businesses to view their own bookings
- ✅ Prevent businesses from viewing other businesses' bookings
- ✅ Ensure proper 403 Forbidden responses for unauthorized actions

#### 4. Activity Lifecycle (10 integration tests)

**File**: `test/integration/activity-lifecycle.spec.ts`

Tests full activity state transitions and visibility rules:

- ✅ Create activity in draft status by default
- ✅ Reject activity creation for non-owners
- ✅ Reject activities with invalid type IDs
- ✅ Require linked availability template for publishing
- ✅ Successfully publish with valid template and config
- ✅ Require active template (not inactive) for publishing
- ✅ Show only published activities in discovery
- ✅ Hide draft and inactive activities from consumers
- ✅ Update draft activities successfully
- ✅ Prevent changing template on published activities

#### 5. Availability Resolution + Capacity (8 integration tests)

**File**: `test/integration/availability-resolution.spec.ts`

Tests availability calculation with real database and bookings:

- ✅ Return slots based on template configuration
- ✅ Return empty array for non-matching days of week
- ✅ Show default capacity when no bookings exist
- ✅ Update remaining capacity after booking creation
- ✅ Restore capacity after booking cancellation
- ✅ Handle multiple activities with overlapping time slots (separate capacity tracking)
- ✅ Use default capacity when `slot_capacity` record missing
- ✅ Create `slot_capacity` record automatically on first booking

#### 6. Snapshots & Edge Cases (6 integration tests)

**File**: `test/integration/snapshots.spec.ts`

Tests data immutability and snapshot preservation:

- ✅ Preserve existing bookings when availability template is edited
- ✅ Preserve booking access when activity becomes inactive
- ✅ Hide inactive activities from discovery while preserving booking data
- ✅ Don't affect existing booking amounts when prices change
- ✅ Preserve business details in booking snapshots
- ✅ Preserve activity config in selection snapshots

#### 7. Bookings API E2E (8 tests)

**File**: `test/e2e/bookings.e2e-spec.ts`

Tests complete booking flow through HTTP endpoints:

- ✅ Create booking via POST /bookings
- ✅ Get booking details via GET /bookings/:id
- ✅ List user's bookings with pagination
- ✅ Cancel booking via PATCH /bookings/:id/cancel
- ✅ Enforce authentication (401 when no token)
- ✅ Prevent booking past slots (400 validation error)
- ✅ Handle capacity exceeded errors
- ✅ Filter upcoming vs past bookings

#### 8. Consumer Journey E2E (6 tests)

**File**: `test/e2e/consumer-journey.e2e-spec.ts`

Tests full consumer user journey from discovery to booking:

- ✅ Complete flow: discover → view activity → check availability → book → view bookings
- ✅ Enforce phone number requirement before booking (403 forbidden)
- ✅ Allow profile completion (add phone number) before booking
- ✅ Handle validation errors gracefully (400 responses)
- ✅ Handle missing authentication (401 responses)
- ✅ Handle non-existent activity booking (400/404 responses)

#### 9. Business Journey E2E (5 tests)

**File**: `test/e2e/business-journey.e2e-spec.ts`

Tests full business workflow from setup to viewing bookings:

- ✅ Complete flow: create template → create activity → link → publish → view bookings
- ✅ Prevent publishing without linked template
- ✅ Allow updating draft activities
- ✅ Allow unpublishing activities back to draft
- ✅ View and filter business bookings (upcoming/past/all)

#### 10. Saved Activities E2E (8 tests)

**File**: `test/e2e/saved-activities.e2e-spec.ts`

Tests saved/favorited activities functionality:

- ✅ Save activity to user's saved list
- ✅ List all saved activities for user
- ✅ Check if specific activity is saved
- ✅ Return false for unsaved activities
- ✅ Unsave (remove) single activity
- ✅ Bulk delete multiple saved activities
- ✅ Handle non-existent activity saves (400/404)
- ✅ Handle duplicate saves idempotently (upsert behavior)

#### 11. App Health Check (1 test)

**File**: `test/app.e2e-spec.ts`

- ✅ Database connectivity health check

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

## Test Infrastructure Details

### Key Implementation Features

1. **Separate Test Database**
   - Uses `whadoo_test` PostgreSQL database
   - Automatic cleanup between tests with CASCADE truncation
   - Seeded with required data (ActivityTypeDefinitions)

2. **Mock Firebase Authentication**
   - `MockFirebaseAuthGuard` replaces real Firebase auth in E2E tests
   - Test tokens are simple Firebase UIDs (e.g., `'test-consumer-uid'`)
   - Extracts UID from Bearer token and creates mock Firebase user object

3. **Sequential Test Execution**
   - All tests run with `--runInBand` flag to prevent race conditions
   - Each test file is isolated but runs sequentially
   - Prevents database conflicts and foreign key violations

4. **UUID-Based Test Data**
   - All test users use `randomUUID()` for `firebaseUid` and `email`
   - Ensures uniqueness across test runs and parallel execution
   - Prevents constraint violations

5. **Transaction-Based Booking Logic**
   - Booking creation uses Prisma `$transaction` for atomicity
   - Capacity checks and updates happen within same transaction
   - Prevents race conditions during concurrent bookings

6. **Comprehensive Fixtures**
   - Reusable factory functions for Users, Businesses, Activities, Templates, Bookings
   - Configurable via overrides while maintaining sensible defaults
   - Handles all required fields and relationships

### Test Execution Strategy

```bash
# Integration + Unit Tests (69 tests)
cd apps/api
pnpm test

# API E2E Tests (27 tests)
pnpm test:e2e

# Specific test file
pnpm test bookings.spec
pnpm test:e2e consumer-journey

# All tests
pnpm test && pnpm test:e2e
```

### Common Test Patterns

**Integration Test Setup:**

```typescript
beforeAll(async () => {
  await setupTestDatabase(); // Connect and run migrations
});

beforeEach(async () => {
  await cleanupTestDatabase(); // Truncate all tables
  // Create test users, businesses, activities...
});

afterAll(async () => {
  await disconnectTestDatabase(); // Close connections
});
```

**E2E Test Setup:**

```typescript
beforeAll(async () => {
  await setupTestDatabase();

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(FirebaseAuthGuard)
    .useClass(MockFirebaseAuthGuard)
    .compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  await cleanupTestDatabase();
  // Create test data...
});
```

## Next Steps

See `TESTING_REMAINING.md` for additional tests that could be implemented (validation rules, frontend component tests, extended mobile E2E scenarios, performance tests).

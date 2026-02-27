# Remaining Tests to Implement

## Backend Unit Tests

### 1. Availability Generation Logic

**File**: `apps/api/src/availability-resolution/__tests__/availability-resolution.service.spec.ts`

- [ ] Slot generation from template (days, start/end, duration)
- [ ] Exceptions block dates/ranges correctly
- [ ] "Today" handling (past times removed/disabled)
- [ ] Timezone handling (Luxembourg time)
- [ ] Multi-day availability windows

**Priority**: High (core booking functionality)

### 2. Validation Rules

**File**: `apps/api/src/activity-type-definitions/__tests__/validation.spec.ts`

- [ ] Invalid configurations rejected (min/max participants, unknown option IDs)
- [ ] Package pricing validation
- [ ] Config schema validation per activity type
- [ ] Required field enforcement

**Priority**: Medium

### 3. Utility Validation

**File**: `apps/api/src/auth/__tests__/validation.spec.ts`

- [ ] Phone number presence check for booking gating
- [ ] Email validation
- [ ] Firebase UID validation

**Priority**: Low

## Backend Integration Tests

### 4. Activity Lifecycle

**File**: `apps/api/test/integration/activity-lifecycle.spec.ts`

- [ ] Create activity → draft
- [ ] Publishing requires linked availability template
- [ ] Published activities appear in discovery
- [ ] Draft/inactive activities do not appear in discovery
- [ ] Update activity maintains state correctly
- [ ] Delete activity cascades correctly

**Priority**: High

### 5. Availability Resolution + Capacity

**File**: `apps/api/test/integration/availability-resolution.spec.ts`

- [ ] Resolution returns slots based on template fields
- [ ] Capacity reflected correctly from `slot_capacity`
- [ ] Slot doc is created/initialized when missing
- [ ] Multiple activities sharing same time slots
- [ ] Capacity updates after booking/cancellation

**Priority**: High

### 6. Error / Edge Cases

**File**: `apps/api/test/integration/snapshots.spec.ts`

- [ ] Availability template edited after bookings exist → existing bookings unchanged (snapshots)
- [ ] Activity becomes inactive → not shown in discovery but existing booking detail still works (snapshots)
- [ ] Price changes don't affect existing bookings
- [ ] Business details change preserved in booking snapshots

**Priority**: Medium

## Frontend Unit Tests

### 7. State & UI Logic

**Files**: `apps/mobile/src/__tests__/components/*.test.tsx`

- [ ] Saved/un-saved toggles update state correctly
- [ ] Swipe gesture mapping triggers correct navigation/action
- [ ] Phone number gate component
- [ ] Booking confirmation flow logic
- [ ] Price calculation display
- [ ] Participant count validation UI

**Priority**: Medium

### 8. Redux State Management

**Files**: `apps/mobile/src/__tests__/store/*.test.ts`

- [ ] Activity slice reducers
- [ ] Booking slice reducers
- [ ] User profile slice reducers
- [ ] Saved activities slice reducers
- [ ] Async thunk actions

**Priority**: Low

## Additional E2E Tests

### 9. API E2E Tests

**Files**: `apps/api/test/e2e/*.e2e-spec.ts`

- [ ] Complete consumer journey (discover → book → view booking)
- [ ] Complete business journey (create template → create activity → view bookings)
- [ ] Saved activities flow
- [ ] Profile completion enforcement
- [ ] Error handling (network errors, validation errors)

**Priority**: Medium

### 10. Mobile E2E Tests (Maestro)

**Files**: `apps/mobile/.maestro/*.yaml`

- [ ] Phone number gate enforcement (user without phone tries to book)
- [ ] Capacity full scenario (user sees "fully booked" message)
- [ ] Booking cancellation flow
- [ ] Business booking management
- [ ] Search/filter activities
- [ ] Profile update flow

**Priority**: Medium

## Performance & Load Tests

### 11. Concurrency Tests (Extended)

**File**: `apps/api/test/performance/concurrency.spec.ts`

- [ ] 10+ simultaneous bookings for same slot
- [ ] Stress test slot capacity updates
- [ ] Race conditions on template updates
- [ ] Concurrent cancellations

**Priority**: Low (MVP complete, nice to have)

### 12. Load Testing

**Tool**: k6 or Artillery

- [ ] Booking creation under load (100 req/sec)
- [ ] Discovery feed pagination performance
- [ ] Database query optimization verification
- [ ] API response time benchmarks

**Priority**: Low (post-MVP)

## Test Infrastructure Improvements

### 13. Test Data Builders

**File**: `apps/api/test/builders/*.ts`

- [ ] Fluent API for creating test data
- [ ] Realistic data generators (faker integration)
- [ ] Predefined test scenarios

**Priority**: Low

### 14. Test Utilities

**Files**: `apps/api/test/utils/*.ts` & `apps/mobile/src/__tests__/utils/*.ts`

- [ ] Common assertions
- [ ] Test helpers for auth/tokens
- [ ] Snapshot testing utilities
- [ ] Mock factories

**Priority**: Low

## Documentation Tests

### 15. API Contract Tests

**Tool**: Pact or similar

- [ ] Consumer contract tests
- [ ] Provider contract tests
- [ ] API documentation validation

**Priority**: Low (nice to have)

## Recommended Implementation Order

### Phase 1: Critical Paths (Next Sprint)

1. Availability generation logic tests
2. Activity lifecycle tests
3. Availability resolution + capacity tests

### Phase 2: Edge Cases & Validation

4. Validation rules tests
5. Snapshot/edge case tests
6. Additional E2E scenarios

### Phase 3: Frontend Coverage

7. State & UI logic tests
8. Redux state management tests
9. Extended mobile E2E tests

### Phase 4: Performance & Infrastructure (Post-MVP)

10. Concurrency tests (extended)
11. Load testing
12. Test infrastructure improvements

## Test Coverage Summary

### ✅ Implemented (Critical MVP Tests)

- Booking creation & capacity
- Concurrency & race conditions
- RBAC (role-based access control)
- Basic API E2E (bookings)
- Basic frontend unit tests (image picker)
- Core mobile E2E flows (Maestro)

### 🚧 Remaining (75% of original scope)

- Availability generation logic
- Activity lifecycle
- Snapshot preservation
- Frontend component tests
- Redux state tests
- Extended E2E scenarios
- Performance tests

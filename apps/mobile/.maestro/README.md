# Maestro E2E Tests

## Setup

Install Maestro CLI:
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## Running Tests

### Run all tests
```bash
maestro test .maestro/
```

### Run specific test
```bash
maestro test .maestro/consumer-booking-flow.yaml
```

### Run on specific device/simulator
```bash
# iOS Simulator
maestro test --device iPhone-15 .maestro/consumer-booking-flow.yaml

# Android Emulator
maestro test --device emulator-5554 .maestro/consumer-booking-flow.yaml
```

## Test Coverage

1. **consumer-booking-flow.yaml** - Complete booking journey from discovery to confirmation
2. **save-activity-flow.yaml** - Save/unsave activities flow
3. **business-create-activity-flow.yaml** - Business creates and publishes activity

## Prerequisites

- App must be built and installed on device/simulator
- Test user accounts should exist (or use signup flow)
- Backend API must be running

## Notes

- Tests use app ID: `com.whadoo.mobile`
- Adjust text matchers based on actual UI copy
- Add testID props to components for more reliable selection

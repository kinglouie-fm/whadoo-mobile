# Maestro E2E Tests

## Setup

Install Maestro CLI:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## Running Tests

Run maestro studio for setup and debug

```bash
maestro studio
```

### Run specific test

```bash
maestro test .maestro/consumer-booking-flow.yaml
```

## Test Coverage

1. **consumer-booking-flow.yaml** - Complete booking journey from discovery to confirmation
2. **business-create-activity-flow.yaml** - Business creates and publishes activity

## Prerequisites

- App must be built and installed on device/simulator
- Test user accounts should exist
- Backend API must be running

## Notes

- Check App ID that tests uses with

```bash
xcrun simctl listapps E1725E80-D193-45A5-A9D4-E2B44AB97513 | grep -i whadoo
```

- Log in with correct account:
  - Consumer Account for **consumer-booking-flow.yaml**
  - Business Account for **business-create-activity-flow.yaml**

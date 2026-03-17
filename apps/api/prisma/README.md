# Database Seeding Guide

This guide explains how to populate your database with test data for development.

## Prerequisites

Before running any seed scripts, ensure you have:

### 1. Database Running

```bash
# From root directory
pnpm db

# Verify it's running
docker ps | grep whadoo_postgres
```

### 2. Database Migrations Applied

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
```

### 3. Firebase Service Account Setup

The seed scripts create users in Firebase Authentication, so you need:

1. Firebase service account JSON file saved to `apps/api/.secrets/firebase-service-account.json`
2. Environment variables configured in `apps/api/.env`:

```bash
FIREBASE_SERVICE_ACCOUNT_PATH="./.secrets/firebase-service-account.json"
DATABASE_URL="postgresql://whadoo:whadoo_password@localhost:5432/whadoo_dev?schema=public"
```

## Available Seed Scripts

### 1. Multiple Business Accounts with Activities (Recommended)

This is the main seed script for development. It creates realistic test data.

**Run from root directory:**

```bash
npx tsx prisma/multiple-business-and-seed-data.ts
```

**What it creates:**

- **20 business owner accounts** in Firebase Auth
- **20 business profiles** in the database with:
  - Business name, description, address
  - Contact information
  - Profile images
- **Multiple activities per business** with:
  - Activity details (name, description, price)
  - Images
  - Availability schedules

**Login Credentials:**

After the script finishes, it prints login credentials for all created accounts.

**Save these credentials** to log in to the mobile app for testing or create an additional account.

**Configuration:**

The script uses these settings:

- `TOTAL_BUSINESSES`: 20
- `DEFAULT_PASSWORD`: "password"
- `CITY`: "Luxembourg"

## Important Notes

### Idempotent Seeding

- Seeds are **idempotent** - safe to run multiple times
- Existing data won't be duplicated
- Business accounts won't be deleted if they have bookings
- Activity seeds will replace existing activities (unless they have bookings)

### Resetting the Database

To start fresh:

```bash
cd apps/api

# Option 1: Reset and rerun all migrations (deletes everything)
pnpm prisma migrate reset

# Option 2: Clean database but preserve accounts
pnpm db:clean

# Then run seeds again
npx tsx apps/api/prisma/multiple-business-and-seed-data.ts
```

### Firebase Authentication Sync

The seed scripts create users in BOTH:

1. Firebase Authentication (for login)
2. PostgreSQL database (for app data)

The `firebaseUid` field in the database links to the Firebase Auth user.

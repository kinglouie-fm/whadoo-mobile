# Database Seeding Guide

## Prerequisites

### 1. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the downloaded JSON file as `firebase-service-account.json` in `apps/api/prisma/`
6. Add the file to .gitignore

### 2. Environment Variables

Make sure your `apps/api/.env` file contains:

```bash
DATABASE_URL="postgresql://..."
FIREBASE_SERVICE_ACCOUNT_PATH="../.secrets/firebase-service-account.json"
```

## Running Seeds

### Seed multiple business accounts

```bash
npx tsx apps/api/prisma/multiple-business-and-seed-data.ts
```

This creates:

- 20 business owner accounts in Firebase Auth
- 20 business profiles in your database

**Login Credentials:**

- Printed at the end of the seed generation inside the terminal.

## Notes

- Seeds are **idempotent** - safe to run multiple times
- Business seed won't delete businesses with existing bookings
- Activity seeds will replace existing activities (unless they have bookings)

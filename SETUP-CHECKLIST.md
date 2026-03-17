# Setup Checklist

Use this checklist to ensure you've completed all setup steps correctly.

## Prerequisites Checklist

- [ ] Node.js 20+ installed (`node --version`)
- [ ] pnpm 10.28.1+ installed (`pnpm --version`)
- [ ] Docker Desktop installed and running
- [ ] Xcode 15.0+ installed (macOS only)
- [ ] Xcode license accepted (`sudo xcodebuild -license accept`)
- [ ] Firebase account created with Blaze (paid) plan
  - This app does not produce costs

## Firebase Setup Checklist

- [ ] Created Firebase project named "whadoo-mobile"
- [ ] Enabled Email/Password authentication
- [ ] Enabled Google authentication provider
- [ ] Enabled Firebase Storage
- [ ] Upgraded to Blaze plan
- [ ] Downloaded Firebase service account JSON file
- [ ] Created `apps/api/.secrets/` directory
- [ ] Saved service account as `apps/api/.secrets/firebase-service-account.json`
- [ ] Registered iOS app in Firebase (Bundle ID: `com.kinglouie-fm.whadoo`)
- [ ] Downloaded `GoogleService-Info.plist`
- [ ] Saved `GoogleService-Info.plist` to `apps/mobile/` and `apps/mobile/ios/whadoo/`
- [ ] Set Firebase Storage rules (copied from README)

## Environment Variables Checklist

### API Environment (`apps/api/.env`)

- [ ] Copied from `apps/api/.env.example`
- [ ] `PORT=3000` (or your preferred port)
- [ ] `DATABASE_URL` points to `whadoo_dev` database
- [ ] `DEV_ADMIN_SECRET` set (use "admin" for local dev)
- [ ] `NODE_ENV=development`
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` points to `./.secrets/firebase-service-account.json`
- [ ] `FIREBASE_SERVICE_ACCOUNT_PATH` points to `./.secrets/firebase-service-account.json`

### Mobile Environment (`apps/mobile/.env`)

- [ ] Copied from `apps/mobile/.env.example`
- [ ] `EXPO_PUBLIC_API_URL=http://localhost:3000`
- [ ] `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` copied from `GoogleService-Info.plist`
- [ ] `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` copied from `GoogleService-Info.plist`

## Database Setup Checklist

- [ ] Ran `pnpm install` from root directory
- [ ] Started database: `pnpm db`
- [ ] Verified database running: `docker ps | grep whadoo_postgres`
- [ ] Ran migrations: `cd apps/api && pnpm prisma migrate dev`
- [ ] Generated Prisma Client: `pnpm prisma generate`
- [ ] Ran seed script: `npx tsx apps/api/prisma/multiple-business-and-seed-data.ts` (from root)
- [ ] Saved login credentials printed by seed script

## Mobile App Setup Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] `GoogleService-Info.plist` in place
- [ ] Built native iOS app: `npx expo run:ios`
- [ ] App successfully opened in simulator

## Verification Steps

### Verify Database

```bash
# Should show whadoo_postgres running
docker ps | grep whadoo_postgres

# Should connect successfully
docker exec -it whadoo_postgres psql -U whadoo -d whadoo_dev -c "SELECT 1;"
```

- [ ] Database container is running
- [ ] Can connect to database
- [ ] Tables exist (check with Prisma Studio: `cd apps/api && pnpm prisma studio`)

### Verify API

```bash
# Start API
pnpm api

# In another terminal, test the endpoint
curl http://localhost:3000
```

- [ ] API starts without errors
- [ ] Can access `http://localhost:3000`
- [ ] No Firebase authentication errors in logs

### Verify Mobile

```bash
# Start mobile app
pnpm mobile:dev

# Press 'i' for iOS simulator
```

- [ ] Expo dev client starts
- [ ] iOS simulator opens
- [ ] App launches successfully
- [ ] Can see login screen

### Verify Authentication

- [ ] Can log in with seeded account credentials
- [ ] Google Sign-In button appears
- [ ] Can sign up with email/password

### Verify Full Stack Integration

- [ ] Logged in user data loads from API
- [ ] Can view activities
- [ ] Can swipe through activities
- [ ] Images load properly

# Whadoo

Activity booking platform with React Native mobile app and NestJS API backend. Login available through E-Mail or Google.

## Prerequisites

- **Node.js** 18+ and **pnpm** 9+
- **Docker Desktop** (for PostgreSQL database)
- **Xcode** (for iOS development, macOS only)
- **Firebase Project** (for authentication)

## First-Time Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

Start PostgreSQL with Docker:

```bash
pnpm db
```

**Database credentials:**

- Host: `localhost:your-port`
- Database: `your-database`
- User: `your-user`
- Password: `your-password`

**Connect to database:**

```bash
# Using psql
docker exec -it whadoo_postgres psql -U whadoo -d whadoo_dev
```

### 3. Setup Firebase

- Call the project whadoo-mobile

#### Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project
2. Navigate to **Project Settings** → **Service Accounts**
3. Click **"Generate New Private Key"**
4. Save as `apps/api/prisma/firebase-service-account.json`

#### Get Firebase Config Files for Mobile

1. In Firebase Console → **Project Settings** → **General**
2. Scroll to **Your apps** section
3. Download config files:
   - **iOS**: Download `GoogleService-Info.plist` → Save to `apps/mobile/`
   - **Android**: Download `google-services.json` → Save to `apps/mobile/`

#### Get Firebase Storage

1. Set the rules

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    function isImageWrite() {
      return request.resource != null
        && request.resource.contentType.matches('image/(jpeg|png|webp|heic|heif)');
    }

    function underMaxSize() {
      return request.resource != null
        && request.resource.size < 10 * 1024 * 1024; // 10MB
    }

    // Staging area - users can only upload to their own staging folder
    match /staging/{userId}/{allPaths=**} {
      allow write: if isOwner(userId) && isImageWrite() && underMaxSize();
      allow read: if isOwner(userId);
      allow delete: if isOwner(userId);
      allow list: if false;
    }

    // Final processed images are public read-only
    // Only backend Admin SDK can write (bypasses rules)
    match /users/{userId}/{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if false; // Only backend can write
      allow list: if false;  // No directory listing
    }

    match /businesses/{businessId}/{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if false; // Only backend can write
      allow list: if false;  // No directory listing
    }

    match /activities/{activityId}/{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if false; // Only backend can write
      allow list: if false;  // No directory listing
    }

    // Default deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Configure Environment

Create `apps/api/.env`:

```bash
PORT=3000
DATABASE_URL="postgresql://..."

DEV_ADMIN_SECRET=...
NODE_ENV=development
GOOGLE_APPLICATION_CREDENTIALS="./.secrets/firebase-service-account.json"
FIREBASE_SERVICE_ACCOUNT_PATH="./.secrets/firebase-service-account.json"
```

### 5. Add the following .env to apps/mobile when using Google Sign-In and Firebase Storage (from GoogleService-Info.plist)

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<CLIENT_ID>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<STORAGE_BUCKET>
```

- Attention: You need a Blaze account for setting up Firebase Storage!

### 6. Run Database Migrations

```bash
cd apps/api
pnpm prisma migrate dev
```

### 7. Seed Database

See detailed seeding instructions in [`apps/api/prisma/README.md`](./apps/api/prisma/README.md)

### 8. Build Mobile App (First Time Only)

```bash
# iOS
npx expo run:ios
```

This creates the native builds with Firebase integration. Only needed once or when native dependencies change.

## Running the App

### Start Database

```bash
pnpm db
```

### Start API Backend

```bash
pnpm api
```

API runs at `http://localhost:3000`

### Start Mobile App

```bash
pnpm mobile:dev
```

Then press:

- `i` for iOS simulator

## Useful Commands

### Database

```bash
pnpm db          # Start database
pnpm db:stop     # Stop database
pnpm db:down     # Stop and remove database
pnpm db:logs     # View database logs
```

### Prisma

```bash
cd apps/api
pnpm prisma studio              # Open Prisma Studio (database GUI)
pnpm prisma migrate dev         # Create and apply migration
pnpm prisma generate            # Regenerate Prisma Client
```

### Mobile

```bash
pnpm mobile:dev                 # Start with dev client
pnpm mobile                     # Start Expo dev server
```

## Troubleshooting

### Database connection issues

- Ensure Docker is running: `docker ps`
- Check database logs: `pnpm db:logs`

### Firebase authentication errors

- Verify `GOOGLE_APPLICATION_CREDENTIALS` is set
- Check that `firebase-service-account.json` exists

### Mobile app won't start

- Clear cache: `npx expo start -c`

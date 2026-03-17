# Whadoo

Activity booking platform with React Native mobile app and NestJS API backend. Login available through E-Mail or Google.

## Quick Start (Check setup checklist too)

```bash
pnpm db          # Start database
pnpm api         # Start backend (in new terminal)
pnpm mobile:dev  # Start mobile app (in new terminal)
# Press 'i' for iOS simulator
```

## Project Structure

```
/apps
  /api      - NestJS backend API (port 3000)
  /mobile   - React Native Expo app
  /infra    - Docker Compose configuration
  /coverage - Jest test coverage reports (auto-generated, gitignored)
```

## Prerequisites

### Required Software

- **Node.js** 20+ (check with `node --version`)
- **pnpm** 10.28.1+ (install with `npm install -g pnpm`)
- **Docker Desktop** (for PostgreSQL database)
- **Xcode** 15.0+ (for iOS development, macOS only)
  - Accept Xcode license: `sudo xcodebuild -license accept`
  - iOS Simulator (comes with Xcode)
  - CocoaPods (usually installed with Xcode)

### Required Services

- **Firebase Project** with Blaze (paid) plan
  - Required for Firebase Authentication and Storage
  - Free tier is NOT sufficient due to Storage requirements

## First-Time Setup

Follow these steps in order. This only needs to be done once.

### 1. Install Dependencies

From the root directory:

```bash
pnpm install
```

This installs dependencies for all workspace packages (API, mobile).

### 2. Setup Database

Start PostgreSQL with Docker:

```bash
pnpm db
```

This creates and starts a PostgreSQL container with the following credentials:

- Host: `localhost:5432`
- Database: `whadoo_dev`
- User: `whadoo`
- Password: `whadoo_password`

**Verify database is running:**

```bash
docker ps | grep whadoo_postgres
```

**Connect to database (optional):**

```bash
# Using psql inside the container
docker exec -it whadoo_postgres psql -U whadoo -d whadoo_dev
```

### 3. Setup Firebase

**IMPORTANT:** You need a Firebase project with a **Blaze (paid) plan** for Firebase Storage to work.

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Name it `whadoo-mobile` (or your preferred name)
4. Enable Firebase Authentication:
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password** provider
   - Enable **Google** provider
5. Enable Firebase Storage:
   - Go to **Storage** → **Get Started**
   - Choose a location for your default bucket
6. Upgrade to Blaze plan if not already on it

#### Get Firebase Service Account

1. In Firebase Console → Navigate to **Project Settings** → **Service Accounts**
2. Click **"Generate New Private Key"**
3. Download the JSON file

**Save the service account file:**

```bash
# Create the .secrets directory in apps/api
mkdir -p apps/api/.secrets

# Move/copy the downloaded file to:
# apps/api/.secrets/firebase-service-account.json
```

**Important:** The `.secrets` directory is gitignored for security. Never commit Firebase credentials.

#### Get Firebase Config File for iOS

1. In Firebase Console → **Project Settings** → **General**
2. Scroll to **Your apps** section
3. If you don't have an iOS app registered:
   - Click **"Add app"** → Choose **iOS**
   - Bundle ID: `com.kinglouie-fm.whadoo` (matches `apps/mobile/app.json`)
   - App nickname: `whadoo` (or your preference)
   - Register the app
4. Download `GoogleService-Info.plist`
5. Save it to `apps/mobile/GoogleService-Info.plist`

**Note:** A template file `GoogleService-Info.plist.example` is provided for reference.

#### Setup Firebase Storage Rules

1. In Firebase Console → **Storage** → **Rules**
2. Replace the default rules with the following:

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

3. Click **"Publish"** to save the rules

### 4. Configure Environment Variables

Copy the example files and fill in your specific values:

#### API Backend Environment

```bash
# Copy the example file
cp apps/api/.env.example apps/api/.env
```

The default values in `apps/api/.env.example` should work for local development:

- `DATABASE_URL` is correct if you used the Docker setup
- `DEV_ADMIN_SECRET` can stay as "admin" for development (used for admin endpoints)
- Firebase paths are correct if you saved the file to `apps/api/.secrets/`

**No changes needed unless you modified the database configuration.**

#### API Test Environment

```bash
# Copy the test environment example
cp apps/api/.env.test.example apps/api/.env.test
```

**IMPORTANT:** Edit `apps/api/.env.test` and update `GOOGLE_APPLICATION_CREDENTIALS`:

- It MUST be an absolute path
- Replace with your actual path: `/Users/yourname/path/to/whadoo/apps/api/.secrets/firebase-service-account.json`

#### Mobile App Environment

```bash
# Copy the example file
cp apps/mobile/.env.example apps/mobile/.env
```

Now edit `apps/mobile/.env` and update these values from your `GoogleService-Info.plist`:

**To find the values:**

1. Open `apps/mobile/GoogleService-Info.plist` in a text editor
2. **EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID**:
   - Find `<key>CLIENT_ID</key>`
   - Copy the `<string>` value on the next line
3. **EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET**:
   - Find `<key>STORAGE_BUCKET</key>`
   - Copy the `<string>` value (format: `your-project-id.appspot.com`)
4. **EXPO_PUBLIC_API_URL**:
   - Keep as `http://localhost:3000` for iOS simulator
   - For physical iOS devices, use your machine's local IP: `http://192.168.1.XXX:3000`

### 5. Run Database Migrations

```bash
cd apps/api
pnpm prisma migrate dev
```

This creates the database tables from the Prisma schema.

**Generate Prisma Client:**

```bash
pnpm prisma generate
```

This generates the TypeScript types for database access.

### 6. Seed Database (Optional but Recommended)

The seed script creates 20 business owner accounts with sample data for testing.

```bash
# From the root directory
npx tsx apps/api/prisma/multiple-business-and-seed-data.ts
```

**What this creates:**

- 20 business owner accounts in Firebase Auth
- 20 business profiles with activities in your database
- Login credentials will be printed in the terminal

**Note:** See detailed seeding instructions in [`apps/api/prisma/README.md`](./apps/api/prisma/README.md)

### 7. Build Mobile App (First Time Only)

```bash
# From root directory or apps/mobile directory
npx expo run:ios
```

**What this does:**

- Creates native iOS build folders
- Installs CocoaPods dependencies
- Integrates Firebase SDK
- Opens the app in iOS Simulator

**Note:** This step takes 5-10 minutes on first run. You only need to run this:

- Once during initial setup
- When native dependencies change (rare)
- When updating Firebase configuration

### 8. Verify Setup

Check that everything is working:

```bash
# Verify database is running
docker ps | grep whadoo_postgres

# Verify API can connect to database
curl http://localhost:3000

# Check environment variables are set
cd apps/api && cat .env | grep -v PASSWORD
```

## Daily Development Workflow

After initial setup, you only need these commands each time you work on the project:

### Terminal 1: Start Database

```bash
pnpm db
```

Wait for: `database system is ready to accept connections`

### Terminal 2: Start API Backend

```bash
pnpm api
```

Wait for: `Nest application successfully started` at `http://localhost:3000`

### Terminal 3: Start Mobile App

```bash
pnpm mobile:dev
```

Then press `i` for iOS simulator.

**Tip:** Keep these three terminals running while developing.

## Useful Commands

### Database Management

```bash
pnpm db          # Start database
pnpm db:stop     # Stop database
pnpm db:down     # Stop and remove database (deletes all data!)
pnpm db:logs     # View database logs
```

### Prisma Commands

```bash
cd apps/api

pnpm prisma studio              # Open Prisma Studio (database GUI at localhost:5555)
pnpm prisma migrate dev         # Create and apply new migration
pnpm prisma generate            # Regenerate Prisma Client after schema changes
pnpm prisma db push             # Push schema changes without creating migration
pnpm prisma db seed             # Run seed scripts
```

### Mobile Development

```bash
pnpm mobile:dev                 # Start with dev client (recommended)
pnpm mobile                     # Start Expo dev server
npx expo start -c               # Start with cache cleared
npx expo run:ios                # Rebuild native iOS app
```

### Testing

- Refer to `apps/mobile/.maestro/README.md` for running the E2E tests.

## Architecture Overview

### API Structure

```
apps/api/
├── src/
│   ├── modules/          # Feature modules (users, businesses, activities, etc.)
│   ├── common/           # Shared utilities, guards, decorators
│   ├── config/           # Configuration files
│   └── main.ts           # Application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── *.ts              # Seed scripts
└── test/                 # Test utilities and setup
```

### Mobile Structure

```
apps/mobile/
├── app/                  # Expo Router pages
│   ├── (auth)/          # Authentication flow
│   ├── (tabs)/          # Main app tabs
│   └── _layout.tsx      # Root layout
├── components/           # Reusable React components
├── hooks/               # Custom React hooks
├── src/
│   ├── api/             # API client
│   ├── store/           # Redux store
│   └── types/           # TypeScript types
└── assets/              # Images, fonts, etc.
```

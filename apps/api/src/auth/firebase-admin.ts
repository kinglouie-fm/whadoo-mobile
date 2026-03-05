import * as admin from 'firebase-admin';

/**
 * Shared Firebase Admin singleton for auth and storage integrations.
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: 'whadoo-mobile.firebasestorage.app',
  });
}

export { admin };

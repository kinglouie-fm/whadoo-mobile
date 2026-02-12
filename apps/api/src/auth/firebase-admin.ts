import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: 'whadoo-mobile.firebasestorage.app',
  });
}

export { admin };

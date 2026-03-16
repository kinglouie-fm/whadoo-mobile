import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Provides a globally shared Firebase Admin instance for Nest providers.
 */
@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (configService: ConfigService) => {
        if (!admin.apps.length) {
          const credPath = configService.get<string>(
            'GOOGLE_APPLICATION_CREDENTIALS',
          );

          if (credPath) {
            try {
              // Support relative credential paths in local/dev environments.
              const resolvedPath = path.isAbsolute(credPath)
                ? credPath
                : path.join(process.cwd(), credPath);

              const serviceAccount = JSON.parse(
                fs.readFileSync(resolvedPath, 'utf8'),
              );
              
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
              });
              
              console.log(`✓ Firebase Admin initialized with credentials from: ${resolvedPath}`);
            } catch (error) {
              console.error('Failed to load Firebase credentials:', error);
              throw error;
            }
          } else {
            // Fall back to ADC (Application Default Credentials) when no path is configured.
            admin.initializeApp();
          }
        }
        return admin;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule {}

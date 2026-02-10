import { Global, Module } from "@nestjs/common";
import admin from "firebase-admin";

@Global()
@Module({
  providers: [
    {
      provide: "FIREBASE_ADMIN",
      useFactory: () => {
        // Uses GOOGLE_APPLICATION_CREDENTIALS if set,
        // OR explicit env vars if you later add them.
        if (!admin.apps.length) {
          admin.initializeApp();
        }
        return admin;
      },
    },
  ],
  exports: ["FIREBASE_ADMIN"],
})
export class FirebaseModule {}

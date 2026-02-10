import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import type admin from "firebase-admin";

export type Role = "user" | "business";

export type RequestAppUser = {
  id: string;
  firebaseUid: string;
  role: Role;
};

export type AuthedRequest = Request & {
  firebase?: {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  appUser?: RequestAppUser;
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(@Inject("FIREBASE_ADMIN") private readonly firebaseAdmin: typeof admin) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing Bearer token");
    }

    const token = header.slice("Bearer ".length).trim();

    try {
      const decoded = await this.firebaseAdmin.auth().verifyIdToken(token);

      req.firebase = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      };
      console.log("verifyIdToken OK uid=", decoded.uid);

      return true;
    } catch (e) {
      console.error("verifyIdToken failed:", e);
      throw new UnauthorizedException("Invalid Firebase token");
    }
  }
}

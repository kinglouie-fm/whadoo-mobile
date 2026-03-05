import { SetMetadata } from "@nestjs/common";
import { Role } from "./firebase-auth.guard";

/**
 * Metadata key read by role-based authorization guards.
 */
export const ROLES_KEY = "roles";

/**
 * Declares which app roles may access a route handler/class.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

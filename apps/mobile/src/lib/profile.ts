import type { AppUser } from "@/src/providers/auth-context";

export function isConsumerProfileComplete(u: AppUser | null): boolean {
  if (!u) return false;
  const first = (u.firstName ?? "").trim();
  const last = (u.lastName ?? "").trim();
  const phone = (u.phoneNumber ?? "").trim();
  return first.length > 0 && last.length > 0 && phone.length > 0;
}

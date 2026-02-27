import { PrismaClient, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<{
    firebaseUid: string;
    email: string;
    role: UserRole;
    phoneNumber: string;
  }> = {},
) {
  const uid = overrides.firebaseUid || `test-uid-${randomUUID()}`;
  const email = overrides.email || `test-${randomUUID()}@example.com`;
  return prisma.user.create({
    data: {
      firebaseUid: uid,
      email,
      role: overrides.role || 'user',
      phoneNumber: overrides.phoneNumber ?? null,
    },
  });
}

export async function createTestBusiness(
  prisma: PrismaClient,
  ownerUserId: string,
  overrides: Partial<{
    name: string;
    description: string;
  }> = {},
) {
  return prisma.business.create({
    data: {
      name: overrides.name || `Test Business ${randomUUID()}`,
      description: overrides.description ?? 'Test business description',
      ownerUserId,
    },
  });
}

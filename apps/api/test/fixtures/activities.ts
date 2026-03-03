import { ActivityStatus, PrismaClient } from '@prisma/client';

export async function createTestActivity(
  prisma: PrismaClient,
  businessId: string,
  overrides: Partial<{
    typeId: string;
    title: string;
    description: string;
    status: ActivityStatus;
    config: any;
    pricing: any;
    priceFrom: number;
    city: string;
  }> = {},
) {
  const defaultConfig = {
    packages: [
      {
        code: 'standard',
        title: 'Standard Package',
        min_participants: 1,
        availability: {
          daysOfWeek: [1, 2, 3, 4, 5],
          startTime: '09:00:00',
          endTime: '17:00:00',
          slotDurationMinutes: 60,
          capacity: 5,
          status: 'active',
        },
      },
    ],
  };

  return prisma.activity.create({
    data: {
      businessId,
      typeId: overrides.typeId || 'karting',
      title: overrides.title || `Test Activity ${Date.now()}`,
      description: overrides.description || 'Test activity description',
      status: overrides.status || 'published',
      config: overrides.config || defaultConfig,
      pricing: overrides.pricing || { basePrice: 50 },
      priceFrom: overrides.priceFrom || 50,
      city: overrides.city || 'Luxembourg',
    },
  });
}

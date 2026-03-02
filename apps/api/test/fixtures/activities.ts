import { ActivityStatus, PrismaClient } from '@prisma/client';

export async function createTestAvailabilityTemplate(
  prisma: PrismaClient,
  businessId: string,
  overrides: Partial<{
    name: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    capacity: number;
    status: 'active' | 'inactive';
  }> = {},
) {
  return prisma.availabilityTemplate.create({
    data: {
      name: overrides.name || `Template ${Date.now()}`,
      businessId,
      daysOfWeek: overrides.daysOfWeek || [1, 2, 3, 4, 5], // Mon-Fri
      startTime: new Date(`1970-01-01T${overrides.startTime || '09:00'}:00Z`),
      endTime: new Date(`1970-01-01T${overrides.endTime || '17:00'}:00Z`),
      slotDurationMinutes: overrides.slotDurationMinutes || 60,
      capacity: overrides.capacity || 5,
      status: overrides.status || 'active',
    },
  });
}

export async function createTestActivity(
  prisma: PrismaClient,
  businessId: string,
  overrides: Partial<{
    typeId: string;
    title: string;
    description: string;
    status: ActivityStatus;
    availabilityTemplateId: string;
    config: any;
    pricing: any;
    priceFrom: number;
    city: string;
  }> = {},
) {
  return prisma.activity.create({
    data: {
      businessId,
      typeId: overrides.typeId || 'karting',
      title: overrides.title || `Test Activity ${Date.now()}`,
      description: overrides.description || 'Test activity description',
      status: overrides.status || 'published',
      availabilityTemplateId: overrides.availabilityTemplateId || null,
      config: overrides.config || {},
      pricing: overrides.pricing || { basePrice: 50 },
      priceFrom: overrides.priceFrom || 50,
      city: overrides.city || 'Luxembourg',
    },
  });
}

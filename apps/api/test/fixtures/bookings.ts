import { PrismaClient } from '@prisma/client';

export async function createTestBooking(
  prisma: PrismaClient,
  data: {
    userId: string;
    activityId: string;
    businessId: string;
    slotStart: Date;
    activitySnapshot?: any;
    businessSnapshot?: any;
    selectionSnapshot?: any;
    priceSnapshot?: any;
    participantsCount?: number;
  },
) {
  return prisma.booking.create({
    data: {
      userId: data.userId,
      activityId: data.activityId,
      businessId: data.businessId,
      slotStart: data.slotStart,
      activitySnapshot: data.activitySnapshot || { title: 'Test Activity' },
      businessSnapshot: data.businessSnapshot || {},
      selectionSnapshot: data.selectionSnapshot || {},
      priceSnapshot: data.priceSnapshot || { total: 50 },
      participantsCount: data.participantsCount || 1,
      status: 'active',
    },
  });
}

export async function getOrCreateSlotCapacity(
  prisma: PrismaClient,
  activityId: string,
  slotStart: Date,
  totalCapacity: number,
) {
  const existing = await prisma.slotCapacity.findUnique({
    where: {
      activityId_slotStart: {
        activityId,
        slotStart,
      },
    },
  });

  if (existing) return existing;

  const slotId = `${activityId}_${slotStart.toISOString()}`;

  return prisma.slotCapacity.create({
    data: {
      id: slotId,
      activityId,
      slotStart,
      capacity: totalCapacity,
      bookedSeats: 0,
      status: 'active',
    },
  });
}

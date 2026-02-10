import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Set these before running
 */
const BUSINESS_ID = '1065dafa-d46d-41cb-84ba-f6efbc602a73'; // required
const CITY = 'Luxembourg'; // optional but nice for discovery
const ADDRESS = '2 rue Principale'; // optional

/**
 * For discovery visibility:
 * - "published" -> shows in grouped cards immediately
 * - "draft" -> won't appear until you publish in-app
 */
const DEFAULT_STATUS: 'draft' | 'published' | 'inactive' = 'published';

/**
 * Groups (one card per group)
 */
const ESCAPE_GROUP = {
  catalogGroupId: 'actionfuncenter-escape-room',
  catalogGroupTitle: 'Escape Room',
  catalogGroupKind: 'escape_room',
};

const COOKING_GROUP = {
  catalogGroupId: 'actionfuncenter-cooking-class',
  catalogGroupTitle: 'Cooking Class',
  catalogGroupKind: 'cooking_class',
};

/**
 * Helpers
 */
function computePriceFromFromPackages(packages: any[]): number | undefined {
  const prices = packages
    .map((pkg) => pkg.base_price)
    .filter((p) => typeof p === 'number' && !Number.isNaN(p));
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

type SeedActivity = {
  durationMin: number; // MUST match availabilityTemplate.slotDurationMinutes
  title: string;
  description?: string;
  category?: string;
  packages: any[]; // Now using packages instead of individual config/pricing
};

/**
 * Escape Room activity with packages
 * - ONE activity per group with multiple package options
 */
const escapeRoomActivity: SeedActivity = {
  durationMin: 60, // Default/most common duration
  title: 'Escape Room',
  description:
    'Immersive puzzle experiences with various themes and difficulty levels. Choose your perfect challenge!',
  category: 'Entertainment',
  packages: [
    {
      code: '2-players',
      title: '2 Players',
      description: 'Perfect for couples or close friends',
      base_price: 50,
      currency: 'EUR',
      is_default: false,
      sort_order: 0,
      player_count: '2',
      difficulty_level: 'medium',
    },
    {
      code: '3-4-players',
      title: '3-4 Players',
      description: 'Most popular option for small groups',
      base_price: 22,
      currency: 'EUR',
      pricing_type: 'per_person',
      is_default: true,
      sort_order: 1,
      min_participants: 3,
      max_participants: 4,
      player_count: '3-4',
      difficulty_level: 'medium',
    },
    {
      code: '5-6-players',
      title: '5-6 Players',
      description: 'Great for larger groups and teams',
      base_price: 20,
      currency: 'EUR',
      pricing_type: 'per_person',
      is_default: false,
      sort_order: 2,
      min_participants: 5,
      max_participants: 6,
      player_count: '5-6',
      difficulty_level: 'medium',
    },
    {
      code: 'birthday',
      title: 'Birthday Package (up to 8)',
      description:
        'Includes decorations, cake, and special celebration. Fixed price for your group.',
      base_price: 200,
      currency: 'EUR',
      pricing_type: 'fixed',
      is_default: false,
      sort_order: 3,
      min_participants: 4,
      max_participants: 8,
      player_count: 'up to 8',
      difficulty_level: 'medium',
      includes_extras: true,
    },
  ],
};

/**
 * Cooking Class activity with packages
 * - ONE activity per group with multiple package options
 */
const cookingClassActivity: SeedActivity = {
  durationMin: 120, // Default/most common duration
  title: 'Cooking Class',
  description:
    'Learn culinary skills in a fun, hands-on environment. Choose from individual seats to private group experiences.',
  category: 'Food & Dining',
  packages: [
    {
      code: 'standard',
      title: 'Standard Seat',
      description:
        'Individual seat with all materials and ingredients included',
      base_price: 79,
      currency: 'EUR',
      pricing_type: 'per_person',
      is_default: true,
      sort_order: 0,
      min_participants: 1,
      max_participants: 1,
    },
    {
      code: 'premium',
      title: 'Premium with Wine Pairing',
      description: 'Includes curated wine pairing for each dish',
      base_price: 99,
      currency: 'EUR',
      pricing_type: 'per_person',
      is_default: false,
      sort_order: 1,
      min_participants: 1,
      max_participants: 1,
      includes_wine: true,
    },
    {
      code: 'couples',
      title: 'Couples Package (2 seats)',
      description: 'Special package for two with shared cooking station',
      base_price: 149,
      currency: 'EUR',
      pricing_type: 'fixed',
      is_default: false,
      sort_order: 2,
      min_participants: 2,
      max_participants: 2,
    },
    {
      code: 'private-group',
      title: 'Private Group (6-10 people)',
      description:
        'Exclusive session for your group with dedicated instructor. Fixed price regardless of group size.',
      base_price: 650,
      currency: 'EUR',
      pricing_type: 'fixed',
      is_default: false,
      sort_order: 3,
      min_participants: 6,
      max_participants: 10,
    },
  ],
};

async function seedActivity(params: {
  typeId: 'escape_room' | 'cooking_class';
  group: {
    catalogGroupId: string;
    catalogGroupTitle: string;
    catalogGroupKind: string;
  };
  activity: SeedActivity;
}) {
  const { typeId, group, activity } = params;

  // Load active templates for this business
  const templates = await prisma.availabilityTemplate.findMany({
    where: { businessId: BUSINESS_ID, status: 'active' },
    select: { id: true, slotDurationMinutes: true, name: true },
  });

  const templateByDuration = new Map<number, string>();
  for (const t of templates)
    templateByDuration.set(t.slotDurationMinutes, t.id);

  // Validate duration exists
  if (!templateByDuration.has(activity.durationMin)) {
    console.log(`\nAvailable templates for business ${BUSINESS_ID}:`);
    templates
      .sort((a, b) => a.slotDurationMinutes - b.slotDurationMinutes)
      .forEach((t) =>
        console.log(`- ${t.slotDurationMinutes} min: ${t.name} (${t.id})`),
      );

    throw new Error(
      `Missing active availability template for ${activity.durationMin} minutes. Create a template with that slotDurationMinutes first.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    // Check for existing activities with bookings
    const existingActivities = await tx.activity.findMany({
      where: {
        businessId: BUSINESS_ID,
        typeId,
        catalogGroupId: group.catalogGroupId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    const activitiesWithBookings = existingActivities.filter(
      (a) => a._count.bookings > 0,
    );

    if (activitiesWithBookings.length > 0) {
      console.log(
        `\n⚠️  Warning: Found ${activitiesWithBookings.length} existing activities with bookings.`,
      );
      console.log(
        `These activities will NOT be deleted to preserve booking data:`,
      );
      activitiesWithBookings.forEach((a) => {
        console.log(`  - ${a.title} (${a._count.bookings} bookings)`);
      });
      console.log(
        `\nThe new activity will be created alongside these old ones.`,
      );
      console.log(
        `You can manually archive or delete old activities from the business dashboard.\n`,
      );
    } else {
      // Safe to delete - no bookings
      await tx.activity.deleteMany({
        where: {
          businessId: BUSINESS_ID,
          typeId,
          catalogGroupId: group.catalogGroupId,
        },
      });
    }

    // Create ONE activity with packages
    await tx.activity.create({
      data: {
        businessId: BUSINESS_ID,
        status: DEFAULT_STATUS,
        typeId,
        title: activity.title,
        description: activity.description,
        category: activity.category,
        city: CITY || undefined,
        address: ADDRESS || undefined,
        priceFrom: computePriceFromFromPackages(activity.packages),
        catalogGroupId: group.catalogGroupId,
        catalogGroupTitle: group.catalogGroupTitle,
        catalogGroupKind: group.catalogGroupKind,
        availabilityTemplateId: templateByDuration.get(activity.durationMin)!,
        config: { packages: activity.packages },
        pricing: {},
      },
    });
  });

  console.log(
    `✓ Seeded '${typeId}' activity '${activity.title}' with ${activity.packages.length} packages into group '${group.catalogGroupId}'.`,
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }
  if (!BUSINESS_ID || BUSINESS_ID.includes('PUT_YOUR_BUSINESS')) {
    throw new Error(
      'Set BUSINESS_ID in prisma/escape-cooking-seed.ts before running.',
    );
  }

  console.log('Starting seed: Escape Room + Cooking Class (with packages)...');

  await seedActivity({
    typeId: 'escape_room',
    group: ESCAPE_GROUP,
    activity: escapeRoomActivity,
  });

  await seedActivity({
    typeId: 'cooking_class',
    group: COOKING_GROUP,
    activity: cookingClassActivity,
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

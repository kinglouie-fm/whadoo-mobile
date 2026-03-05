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
 * Config
 */
const BUSINESS_ID = '1065dafa-d46d-41cb-84ba-f6efbc602a73';
const CITY = 'Luxembourg';
const ADDRESS = '2 rue Principale';
const DEFAULT_STATUS: 'draft' | 'published' | 'inactive' = 'published';

/**
 * Groups
 */
const KARTING_GROUP = {
  catalogGroupId: 'demo-actionfuncenter-karting',
  catalogGroupTitle: 'Karting at ActionFunCenter',
  catalogGroupKind: 'karting',
};

const ESCAPE_GROUP = {
  catalogGroupId: 'demo-actionfuncenter-escape-room',
  catalogGroupTitle: 'Escape Room',
  catalogGroupKind: 'escape_room',
};

const COOKING_GROUP = {
  catalogGroupId: 'demo-actionfuncenter-cooking-class',
  catalogGroupTitle: 'Cooking Class',
  catalogGroupKind: 'cooking_class',
};

/**
 * Types
 */
type PackageConfig = {
  code: string;
  title: string;
  description?: string;
  base_price: number;
  currency: string;
  pricing_type?: 'per_person' | 'fixed';
  is_default: boolean;
  sort_order: number;

  min_participants?: number;
  max_participants?: number;

  age_min?: number;
  age_max?: number;

  // optional custom fields
  track_type?: string;
  format_lines?: string;
  schedule_note?: string;
  request_only?: boolean;

  player_count?: string;
  difficulty_level?: string;

  includes_extras?: boolean;
  includes_wine?: boolean;
};

type ActivitySeed = {
  durationMin: number; // MUST match availability.slotDurationMinutes
  title: string;
  description?: string;
  category?: string;
  packages: PackageConfig[];
};

/**
 * Helpers
 */
function addAvailability(pkg: PackageConfig, slotDurationMinutes: number) {
  return {
    ...pkg,
    min_participants: pkg.min_participants || 1,
    max_participants: pkg.max_participants || undefined,
    availability: {
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // Mon-Sun (1-7)
      startTime: '10:00:00',
      endTime: '22:00:00',
      slotDurationMinutes, // must match activity.durationMin
      capacity: 12,
      status: 'active' as const,
    },
  };
}

function computePriceFrom(
  packages: Array<{ base_price: number }>,
): number | undefined {
  const prices = packages
    .map((p) => p.base_price)
    .filter((p) => typeof p === 'number' && !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : undefined;
}

/**
 * Seeds
 */

// Karting: MULTIPLE activities per group (different durations)
const kartingSeeds: ActivitySeed[] = [
  {
    durationMin: 15,
    title: 'Karting — Quick Sprint (15 min)',
    description:
      'Perfect for a quick adrenaline hit. Great for beginners and first-timers.',
    category: 'Action & Adventure',
    packages: [
      {
        code: 'sprint-standard',
        title: 'Standard Sprint',
        description: '15-minute sprint session',
        base_price: 18,
        currency: 'EUR',
        pricing_type: 'per_person',
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        format_lines: 'Briefing + 15 min race time',
      },
      {
        code: 'sprint-family',
        title: 'Family Sprint (min. 3)',
        description: 'Discounted for families (3–6 participants)',
        base_price: 16,
        currency: 'EUR',
        pricing_type: 'per_person',
        is_default: false,
        sort_order: 1,
        min_participants: 3,
        max_participants: 6,
        track_type: 'indoor',
      },
    ],
  },
  {
    durationMin: 30,
    title: 'Karting — Grand Prix (30 min)',
    description: 'Qualifying + race format. Ideal for groups and team events.',
    category: 'Action & Adventure',
    packages: [
      {
        code: 'gp-standard',
        title: 'Grand Prix',
        description: 'Qualifying + Race (30 min total track time)',
        base_price: 32,
        currency: 'EUR',
        pricing_type: 'per_person',
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        format_lines: 'Briefing + Quali (10m) + Race (20m)',
      },
      {
        code: 'gp-private',
        title: 'Private Track (up to 10)',
        description: 'Exclusive track booking for your group (fixed price)',
        base_price: 290,
        currency: 'EUR',
        pricing_type: 'fixed',
        is_default: false,
        sort_order: 1,
        min_participants: 6,
        max_participants: 10,
        track_type: 'indoor',
        request_only: true,
        schedule_note: 'Request-only: subject to track availability',
      },
    ],
  },
];

// Escape Room: ONE activity per group, multiple packages
const escapeRoomActivity: ActivitySeed = {
  durationMin: 60,
  title: 'Escape Room',
  description:
    'Immersive puzzle experiences with multiple themes. Choose your perfect challenge!',
  category: 'Entertainment',
  packages: [
    {
      code: '2-players',
      title: 'Escape from Alcatraz (2 players)',
      description: 'Perfect for couples or close friends',
      base_price: 50,
      currency: 'EUR',
      pricing_type: 'fixed',
      is_default: false,
      sort_order: 0,
      min_participants: 2,
      max_participants: 2,
      player_count: '2',
      difficulty_level: 'medium',
    },
    {
      code: '3-4-players',
      title: 'Prison Break (3–4 players)',
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
      code: 'birthday-up-to-8',
      title: 'Birthday Package (up to 8)',
      description: 'Includes small extras for celebrations (fixed price)',
      base_price: 200,
      currency: 'EUR',
      pricing_type: 'fixed',
      is_default: false,
      sort_order: 2,
      min_participants: 4,
      max_participants: 8,
      player_count: 'up to 8',
      difficulty_level: 'medium',
      includes_extras: true,
    },
  ],
};

// Cooking Class: ONE activity per group, multiple packages
const cookingClassActivity: ActivitySeed = {
  durationMin: 120,
  title: 'Cooking Class',
  description:
    'Hands-on culinary experience with an instructor. Choose seats or a private group session.',
  category: 'Food & Dining',
  packages: [
    {
      code: 'standard-seat',
      title: 'Standard Seat',
      description: 'Individual seat with ingredients included',
      base_price: 79,
      currency: 'EUR',
      pricing_type: 'per_person',
      is_default: true,
      sort_order: 0,
      min_participants: 1,
      max_participants: 1,
    },
    {
      code: 'premium-wine',
      title: 'Premium + Wine Pairing',
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
      code: 'private-group',
      title: 'Private Group (6–10 people)',
      description: 'Exclusive class for your group (fixed price)',
      base_price: 650,
      currency: 'EUR',
      pricing_type: 'fixed',
      is_default: false,
      sort_order: 2,
      min_participants: 6,
      max_participants: 10,
      request_only: true,
      schedule_note: 'Request-only: instructor availability required',
    },
  ],
};

/**
 * Seeding functions
 */
async function seedKarting() {
  console.log('\nSeeding: Karting (multi-activity group)...');

  await prisma.$transaction(async (tx) => {
    // idempotent delete (karting: we assume safe to delete demo data)
    await tx.activity.deleteMany({
      where: {
        businessId: BUSINESS_ID,
        typeId: 'karting',
        catalogGroupId: KARTING_GROUP.catalogGroupId,
      },
    });

    for (const seed of kartingSeeds) {
      const packagesWithAvailability = seed.packages.map((pkg) =>
        addAvailability(pkg, seed.durationMin),
      );

      await tx.activity.create({
        data: {
          businessId: BUSINESS_ID,
          status: DEFAULT_STATUS,
          typeId: 'karting',
          title: seed.title,
          description: seed.description,
          category: seed.category,
          city: CITY || undefined,
          address: ADDRESS || undefined,
          priceFrom: computePriceFrom(packagesWithAvailability),
          catalogGroupId: KARTING_GROUP.catalogGroupId,
          catalogGroupTitle: KARTING_GROUP.catalogGroupTitle,
          catalogGroupKind: KARTING_GROUP.catalogGroupKind,
          config: { packages: packagesWithAvailability },
          pricing: {},
        },
      });
    }
  });

  console.log(
    `✓ Seeded karting group '${KARTING_GROUP.catalogGroupId}' with ${kartingSeeds.length} activities.`,
  );
}

async function seedSingleActivityGroup(params: {
  typeId: 'escape_room' | 'cooking_class';
  group: {
    catalogGroupId: string;
    catalogGroupTitle: string;
    catalogGroupKind: string;
  };
  activity: ActivitySeed;
}) {
  const { typeId, group, activity } = params;

  console.log(`\nSeeding: ${typeId} (single activity group)...`);

  const packagesWithAvailability = activity.packages.map((pkg) =>
    addAvailability(pkg, activity.durationMin),
  );

  await prisma.$transaction(async (tx) => {
    // Do not delete if bookings exist
    const existing = await tx.activity.findMany({
      where: {
        businessId: BUSINESS_ID,
        typeId,
        catalogGroupId: group.catalogGroupId,
      },
      include: { _count: { select: { bookings: true } } },
    });

    const withBookings = existing.filter((a) => a._count.bookings > 0);

    if (withBookings.length === 0) {
      await tx.activity.deleteMany({
        where: {
          businessId: BUSINESS_ID,
          typeId,
          catalogGroupId: group.catalogGroupId,
        },
      });
    } else {
      console.log(
        `⚠️  Found ${withBookings.length} existing '${typeId}' activities with bookings. Skipping delete to preserve data.`,
      );
    }

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
        priceFrom: computePriceFrom(packagesWithAvailability),
        catalogGroupId: group.catalogGroupId,
        catalogGroupTitle: group.catalogGroupTitle,
        catalogGroupKind: group.catalogGroupKind,
        config: { packages: packagesWithAvailability },
        pricing: {},
      },
    });
  });

  console.log(
    `✓ Seeded '${typeId}' activity '${activity.title}' with ${activity.packages.length} packages into group '${group.catalogGroupId}'.`,
  );
}

/**
 * Main
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }
  if (!BUSINESS_ID || BUSINESS_ID.includes('PUT_YOUR_BUSINESS')) {
    throw new Error('Set BUSINESS_ID at the top of this file before running.');
  }

  console.log('Starting demo seed: Karting + Escape Room + Cooking Class...');

  await seedKarting();

  await seedSingleActivityGroup({
    typeId: 'escape_room',
    group: ESCAPE_GROUP,
    activity: escapeRoomActivity,
  });

  await seedSingleActivityGroup({
    typeId: 'cooking_class',
    group: COOKING_GROUP,
    activity: cookingClassActivity,
  });

  console.log('\nSeed completed! ✅');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

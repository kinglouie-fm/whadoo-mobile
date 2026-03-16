import { PrismaPg } from '@prisma/adapter-pg';
import { BusinessStatus, PrismaClient } from '@prisma/client';
import 'dotenv/config';
import * as admin from 'firebase-admin';
import { Pool } from 'pg';

/**
 * DB init
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Firebase init
 */
function initFirebase() {
  if (admin.apps.length > 0) return admin.app();

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    );
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  throw new Error(
    'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON env var',
  );
}

/**
 * Config
 */
const TOTAL_BUSINESSES = 20;
const DEFAULT_PASSWORD = 'password';

const CITY = 'Luxembourg';
const ADDRESS = '2 rue Principale';
const DEFAULT_STATUS: 'draft' | 'published' | 'inactive' = 'published';

/**
 * Seed types
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
  durationMin: number;
  title: string;
  description?: string;
  category?: string;
  packages: PackageConfig[];
};

type BusinessSeedData = {
  owner: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    city?: string;
    phoneNumber?: string;
  };
  business: {
    name: string;
    description?: string;
    category?: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    city?: string;
    lat?: number;
    lng?: number;
    status?: 'active' | 'inactive' | 'pending';
  };
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
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startTime: '10:00:00',
      endTime: '22:00:00',
      slotDurationMinutes,
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
 * Create/ensure Firebase user + DB user + business
 */
async function seedBusiness(data: BusinessSeedData) {
  const { owner: ownerData, business: businessData } = data;

  // 1) Firebase user
  let firebaseUser: admin.auth.UserRecord;
  try {
    firebaseUser = await admin.auth().getUserByEmail(ownerData.email);
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      firebaseUser = await admin.auth().createUser({
        email: ownerData.email,
        password: ownerData.password,
        displayName: `${ownerData.firstName} ${ownerData.lastName}`,
        emailVerified: true,
      });
    } else {
      throw err;
    }
  }

  // 2) DB user
  let ownerUser = await prisma.user.findUnique({
    where: { firebaseUid: firebaseUser.uid },
  });

  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        role: 'business',
        email: ownerData.email,
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        city: ownerData.city,
        phoneNumber: ownerData.phoneNumber,
      },
    });
  }

  // 3) Business
  const existingBusiness = await prisma.business.findFirst({
    where: { name: businessData.name, ownerUserId: ownerUser.id },
  });

  if (existingBusiness) return existingBusiness;

  return prisma.business.create({
    data: {
      ownerUserId: ownerUser.id,
      name: businessData.name,
      description: businessData.description,
      category: businessData.category,
      contactPhone: businessData.contactPhone,
      contactEmail: businessData.contactEmail,
      address: businessData.address,
      city: businessData.city,
      lat: businessData.lat,
      lng: businessData.lng,
      status: (businessData.status as BusinessStatus) || 'active',
    },
  });
}

/**
 * Demo activities per business
 * - Karting: multiple activities per group
 * - Escape Room/Cooking: one activity per group (with multiple packages)
 */
function buildKartingSeeds(): ActivitySeed[] {
  return [
    {
      durationMin: 15,
      title: 'Karting — Quick Sprint (15 min)',
      description: 'Perfect for a quick adrenaline hit. Great for beginners.',
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
      description: 'Qualifying + race format. Ideal for groups and teams.',
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
          request_only: true,
          schedule_note: 'Request-only: subject to track availability',
        },
      ],
    },
  ];
}

function buildEscapeRoomActivity(): ActivitySeed {
  return {
    durationMin: 60,
    title: 'Escape Room',
    description: 'Immersive puzzle experiences with multiple themes.',
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
}

function buildCookingClassActivity(): ActivitySeed {
  return {
    durationMin: 120,
    title: 'Cooking Class',
    description: 'Hands-on culinary experience with an instructor.',
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
}

/**
 * Seed activities for a given business
 */
async function seedKartingForBusiness(params: {
  businessId: string;
  group: {
    catalogGroupId: string;
    catalogGroupTitle: string;
    catalogGroupKind: string;
  };
}) {
  const { businessId, group } = params;
  const seeds = buildKartingSeeds();

  await prisma.$transaction(async (tx) => {
    await tx.activity.deleteMany({
      where: {
        businessId,
        typeId: 'karting',
        catalogGroupId: group.catalogGroupId,
      },
    });

    for (const seed of seeds) {
      const packagesWithAvailability = seed.packages.map((p) =>
        addAvailability(p, seed.durationMin),
      );

      await tx.activity.create({
        data: {
          businessId,
          status: DEFAULT_STATUS,
          typeId: 'karting',
          title: seed.title,
          description: seed.description,
          category: seed.category,
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
    }
  });
}

async function seedSingleActivityGroupForBusiness(params: {
  businessId: string;
  typeId: 'escape_room' | 'cooking_class';
  group: {
    catalogGroupId: string;
    catalogGroupTitle: string;
    catalogGroupKind: string;
  };
  activity: ActivitySeed;
}) {
  const { businessId, typeId, group, activity } = params;

  const packagesWithAvailability = activity.packages.map((p) =>
    addAvailability(p, activity.durationMin),
  );

  await prisma.$transaction(async (tx) => {
    // preserve existing ones with bookings
    const existing = await tx.activity.findMany({
      where: { businessId, typeId, catalogGroupId: group.catalogGroupId },
      include: { _count: { select: { bookings: true } } },
    });

    const withBookings = existing.filter((a) => a._count.bookings > 0);
    if (withBookings.length === 0) {
      await tx.activity.deleteMany({
        where: { businessId, typeId, catalogGroupId: group.catalogGroupId },
      });
    }

    await tx.activity.create({
      data: {
        businessId,
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
}

/**
 * Main
 */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

  initFirebase();

  console.log(`Seeding ${TOTAL_BUSINESSES} businesses + demo activities...\n`);

  const created: Array<{
    idx: number;
    businessId: string;
    email: string;
    name: string;
  }> = [];

  for (let i = 1; i <= TOTAL_BUSINESSES; i++) {
    const email = `business${i}@hotmail.com`;
    const name = `business${i}`;

    const seedData: BusinessSeedData = {
      owner: {
        email,
        password: DEFAULT_PASSWORD,
        firstName: 'Business',
        lastName: String(i),
        city: CITY,
        phoneNumber: '+352 000 000 000',
      },
      business: {
        name,
        description: `Demo business account #${i}`,
        category: 'Entertainment & Recreation',
        contactPhone: '+352 000 000 000',
        contactEmail: email,
        address: ADDRESS,
        city: CITY,
        lat: 49.6116,
        lng: 6.1319,
        status: 'active',
      },
    };

    const business = await seedBusiness(seedData);

    // Unique group IDs per business (prevents discovery grouping collisions)
    const kartingGroup = {
      catalogGroupId: `demo-${name}-karting`,
      catalogGroupTitle: `Karting${i}`,
      catalogGroupKind: 'karting',
    };
    const escapeGroup = {
      catalogGroupId: `demo-${name}-escape-room`,
      catalogGroupTitle: `Escape Room${i}`,
      catalogGroupKind: 'escape_room',
    };
    const cookingGroup = {
      catalogGroupId: `demo-${name}-cooking-class`,
      catalogGroupTitle: `Cooking Class${i}`,
      catalogGroupKind: 'cooking_class',
    };

    await seedKartingForBusiness({
      businessId: business.id,
      group: kartingGroup,
    });

    await seedSingleActivityGroupForBusiness({
      businessId: business.id,
      typeId: 'escape_room',
      group: escapeGroup,
      activity: buildEscapeRoomActivity(),
    });

    await seedSingleActivityGroupForBusiness({
      businessId: business.id,
      typeId: 'cooking_class',
      group: cookingGroup,
      activity: buildCookingClassActivity(),
    });

    created.push({ idx: i, businessId: business.id, email, name });

    console.log(`✓ Seeded ${name} (${email}) -> businessId=${business.id}`);
  }

  console.log('\n=== Summary ===');
  console.log(`Total businesses created/verified: ${created.length}\n`);

  console.log('📋 Business IDs:');
  for (const b of created) {
    console.log(`  - ${b.name}: ${b.businessId}`);
  }

  console.log('\n🔑 Login credentials:');
  for (const b of created) {
    console.log(`  - ${b.email} / ${DEFAULT_PASSWORD}`);
  }

  console.log('\nDone ✅');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

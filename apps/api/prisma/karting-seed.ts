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
 *  Set these before running
 */
const BUSINESS_ID = '1065dafa-d46d-41cb-84ba-f6efbc602a73'; // required
const CITY = 'Luxembourg'; // optional but nice for discovery
const ADDRESS = '2 rue Principale'; // optional
const CATEGORY = 'Karting'; // optional

/**
 * Grouping metadata (same for all activities in this provider)
 */
const GROUP = {
  catalogGroupId: 'actionfuncenter-karting',
  catalogGroupTitle: 'Karting at ActionFunCenter',
  catalogGroupKind: 'karting',
};

/**
 * Helper: compute priceFrom from packages
 */
function computePriceFrom(packages: any[]): number | undefined {
  const prices = packages
    .map((p) => p.base_price)
    .filter((p) => typeof p === 'number' && !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : undefined;
}

type ActivitySeed = {
  durationMin: number; // MUST match availabilityTemplate.slotDurationMinutes
  title: string;
  description?: string;
  packages: any[];
};

/**
 * ActionFunCenter packages split into activities by duration bucket.
 * IMPORTANT: durationMin must have a matching availability template.
 */
const seeds: ActivitySeed[] = [
  {
    durationMin: 11,
    title: 'Karting — 11 min',
    description: 'ActionFunCenter formulas (11 min). Choose a package.',
    packages: [
      {
        code: 'mini-race',
        title: 'Mini Race',
        currency: 'EUR',
        base_price: 25,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        description: '11 min qualifying',
        format_lines: '11 min quali',
      },
      {
        code: 'kids-fun-race',
        title: 'KIDS Fun Race (8–12 years)',
        age_min: 8,
        age_max: 12,
        currency: 'EUR',
        base_price: 20,
        is_default: false,
        sort_order: 1,
        track_type: 'indoor',
        description: 'Kids session — 11 min',
        format_lines: '11 min session',
      },
    ],
  },

  {
    durationMin: 20,
    title: 'Karting — 20 min',
    description: 'ActionFunCenter formulas (20 min). Choose a package.',
    packages: [
      {
        code: 'action-race',
        title: 'Action Race',
        currency: 'EUR',
        base_price: 35,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        description: '20 min qualifying',
        format_lines: '20 min quali',
      },
      {
        code: 'kids-junior-race',
        title: 'KIDS Junior Race (8–12 years)',
        age_min: 8,
        age_max: 12,
        currency: 'EUR',
        base_price: 28,
        is_default: false,
        sort_order: 1,
        track_type: 'indoor',
        description: 'Kids session — 20 min',
        format_lines: '20 min session',
      },
      {
        code: 'kids-junior-coaching',
        title: 'KIDS Junior Coaching (8–12 years)',
        age_min: 8,
        age_max: 12,
        currency: 'EUR',
        is_default: false,
        sort_order: 2,
        track_type: 'indoor',
        description: 'Every first Wednesday of the month at 17:15',
        format_lines: '20 min coaching session',
        schedule_note: 'Every first Wednesday of the month at 17:15',
        request_only: true,
      },
    ],
  },

  {
    durationMin: 24, // 8 + 16
    title: 'Karting — 24 min',
    description: 'Speed Race format (8 min quali + 16 min race).',
    packages: [
      {
        code: 'speed-race',
        title: 'Speed Race',
        currency: 'EUR',
        base_price: 45,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        description: '8 min quali + 16 min race',
        format_lines: '8 min quali\n16 min race',
      },
    ],
  },

  {
    durationMin: 34, // 11 + 23
    title: 'Karting — 34 min',
    description: 'Gold Race (min 5 karts): 11 min quali + 23 min race.',
    packages: [
      {
        code: 'gold-race',
        title: 'Gold Race',
        currency: 'EUR',
        base_price: 58,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        min_participants: 5,
        description: '11 min quali + 23 min race (min 5 karts)',
        format_lines: '11 min quali\n23 min race',
      },
    ],
  },

  {
    durationMin: 40, // 2x20 quali
    title: 'Karting — 40 min',
    description: 'Double Action Race: 2× 20 min qualifying.',
    packages: [
      {
        code: 'double-action-race',
        title: 'Double Action Race (2×)',
        currency: 'EUR',
        base_price: 60,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        description: '2× 20 min quali',
        format_lines: '20 min quali\n20 min quali',
      },
    ],
  },

  {
    durationMin: 44, // 20 + 8 + 16
    title: 'Karting — 44 min',
    description: 'Monaco GP: 20 warm-up + 8 quali + 16 race.',
    packages: [
      {
        code: 'monaco-gp',
        title: 'Monaco GP',
        currency: 'EUR',
        base_price: 69,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        description: '20 min warm-up + 8 min quali + 16 min race',
        format_lines: '20 min warm-up\n8 min quali\n16 min race',
      },
    ],
  },

  {
    durationMin: 48, // 2x (8+16)
    title: 'Karting — 48 min',
    description: 'Double Speed Race: 2× (8 min quali + 16 min race).',
    packages: [
      {
        code: 'double-speed-race',
        title: 'Double Speed Race (2×)',
        currency: 'EUR',
        base_price: 75,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        description: '2× (8 min quali + 16 min race)',
        format_lines: '8 min quali\n16 min race\n8 min quali\n16 min race',
      },
    ],
  },

  {
    durationMin: 60, // 10 + 50
    title: 'Karting — 60 min',
    description: 'Personal coaching: 10 min instructions + 50 min training.',
    packages: [
      {
        code: 'personal-kart-coaching',
        title: 'Personal Kart Coaching',
        currency: 'EUR',
        base_price: 89,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        description: '10 min instructions + 50 min driving training',
        format_lines: '10 min instructions\n50 min driving training',
      },
    ],
  },

  {
    durationMin: 61, // 11 + 50
    title: 'Karting — 61 min',
    description: 'Iron Race (min 15 karts): 11 min quali + 50 min race.',
    packages: [
      {
        code: 'iron-race',
        title: 'Iron Race',
        currency: 'EUR',
        base_price: 79,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        min_participants: 15,
        description: '11 min quali + 50 min race (min 15 karts)',
        format_lines: '11 min quali\n50 min race',
      },
    ],
  },

  {
    durationMin: 68, // 2x (11 + 23)
    title: 'Karting — 68 min',
    description:
      'Double Gold Race: 2× (11 min quali + 23 min race) (min 5 karts).',
    packages: [
      {
        code: 'double-gold-race',
        title: 'Double Gold Race (2×)',
        currency: 'EUR',
        base_price: 95,
        is_default: true,
        sort_order: 0,
        track_type: 'indoor',
        min_participants: 5,
        description: '2× (11 min quali + 23 min race) (min 5 karts)',
        format_lines: '11 min quali\n23 min race\n11 min quali\n23 min race',
      },
    ],
  },
];

async function main() {
  if (!BUSINESS_ID || BUSINESS_ID.includes('PUT_YOUR_BUSINESS')) {
    throw new Error(
      'Set BUSINESS_ID in prisma/karting-seed.ts before running.',
    );
  }

  console.log('Starting karting seed (ActionFunCenter)...');

  // Load active templates for this business
  const templates = await prisma.availabilityTemplate.findMany({
    where: { businessId: BUSINESS_ID, status: 'active' },
    select: { id: true, slotDurationMinutes: true, name: true },
  });

  const templateByDuration = new Map<number, string>();
  for (const t of templates)
    templateByDuration.set(t.slotDurationMinutes, t.id);

  // Validate durations exist
  const missingDurations = seeds
    .map((s) => s.durationMin)
    .filter((d) => !templateByDuration.has(d));

  if (missingDurations.length > 0) {
    console.log('Available templates:');
    templates
      .sort((a, b) => a.slotDurationMinutes - b.slotDurationMinutes)
      .forEach((t) =>
        console.log(`- ${t.slotDurationMinutes} min: ${t.name} (${t.id})`),
      );

    throw new Error(
      `Missing active availability templates for durations: ${missingDurations.join(
        ', ',
      )}. Create templates with those slotDurationMinutes first.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    // idempotent: remove previous runs for this group
    await tx.activity.deleteMany({
      where: {
        businessId: BUSINESS_ID,
        typeId: 'karting',
        catalogGroupId: GROUP.catalogGroupId,
      },
    });

    // insert all
    for (const s of seeds) {
      await tx.activity.create({
        data: {
          businessId: BUSINESS_ID,
          typeId: 'karting',
          title: s.title,
          description: s.description,
          category: CATEGORY,
          city: CITY || undefined,
          address: ADDRESS || undefined,
          priceFrom: computePriceFrom(s.packages),
          catalogGroupId: GROUP.catalogGroupId,
          catalogGroupTitle: GROUP.catalogGroupTitle,
          catalogGroupKind: GROUP.catalogGroupKind,
          availabilityTemplateId: templateByDuration.get(s.durationMin)!,
          config: { packages: s.packages },
          pricing: {},
        },
      });
    }
  });

  console.log(
    `✓ Seeded ${seeds.length} karting activities into group '${GROUP.catalogGroupId}'.`,
  );
  console.log('Karting seed completed!');
}

main()
  .catch((e) => {
    console.error('Karting seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

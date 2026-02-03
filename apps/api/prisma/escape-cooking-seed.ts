import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * ✅ Set these before running
 */
const BUSINESS_ID = "1065dafa-d46d-41cb-84ba-f6efbc602a73"; // required
const CITY = "Luxembourg"; // optional but nice for discovery
const ADDRESS = "2 rue Principale"; // optional

/**
 * For discovery visibility:
 * - "published" -> shows in grouped cards immediately
 * - "draft" -> won't appear until you publish in-app
 */
const DEFAULT_STATUS: "draft" | "published" | "inactive" = "published";

/**
 * Groups (one card per group)
 */
const ESCAPE_GROUP = {
  catalogGroupId: "actionfuncenter-escape-room",
  catalogGroupTitle: "Escape Room at ActionFunCenter",
  catalogGroupKind: "escape_room",
};

const COOKING_GROUP = {
  catalogGroupId: "actionfuncenter-cooking-class",
  catalogGroupTitle: "Cooking Class at ActionFunCenter",
  catalogGroupKind: "cooking_class",
};

/**
 * Helpers
 */
function computePriceFromFromPricing(pricing: any): number | undefined {
  const v = pricing?.base_price;
  return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
}

type SeedItem = {
  durationMin: number; // MUST match availabilityTemplate.slotDurationMinutes
  title: string;
  description?: string;
  category?: string;
  config: Record<string, any>;
  pricing: Record<string, any>;
};

/**
 * Escape Room seeds
 * - configSchema requires: difficulty_level, theme, min_participants, max_participants, duration_minutes
 * - pricingSchema requires: base_price (per group), per_person_price optional
 */
const escapeRoomSeeds: SeedItem[] = [
  {
    durationMin: 60,
    title: "Escape Room — The Heist (60 min)",
    description: "Steal the artifact before time runs out. Team-based puzzle experience.",
    category: "Escape Room",
    config: {
      difficulty_level: "medium",
      theme: "Heist / Mystery",
      min_participants: 2,
      max_participants: 6,
      duration_minutes: 60,
      age_restriction: 12,
    },
    pricing: {
      base_price: 110, // per group
      per_person_price: 0, // optional
    },
  },
  {
    durationMin: 75,
    title: "Escape Room — Haunted Manor (75 min)",
    description: "Atmospheric horror theme with harder puzzles and more story.",
    category: "Escape Room",
    config: {
      difficulty_level: "hard",
      theme: "Horror / Mystery",
      min_participants: 2,
      max_participants: 6,
      duration_minutes: 75,
      age_restriction: 16,
    },
    pricing: {
      base_price: 135, // per group
      per_person_price: 0,
    },
  },
  {
    durationMin: 90,
    title: "Escape Room — Space Station (90 min)",
    description: "Sci-Fi adventure with multi-room tasks and timed challenges.",
    category: "Escape Room",
    config: {
      difficulty_level: "expert",
      theme: "Sci-Fi",
      min_participants: 3,
      max_participants: 8,
      duration_minutes: 90,
      age_restriction: 12,
    },
    pricing: {
      base_price: 160, // per group
      per_person_price: 0,
    },
  },
];

/**
 * Cooking Class seeds
 * - configSchema requires: cuisine_type, skill_level, max_participants, duration_minutes
 * - pricingSchema requires: base_price (per person), group_discount optional
 */
const cookingClassSeeds: SeedItem[] = [
  {
    durationMin: 120,
    title: "Cooking Class — Italian Pasta Workshop (120 min)",
    description: "Learn fresh pasta basics + sauce pairing. Beginner-friendly.",
    category: "Cooking Class",
    config: {
      cuisine_type: "italian",
      skill_level: "beginner",
      max_participants: 12,
      duration_minutes: 120,
      dietary_restrictions_accommodated: true,
    },
    pricing: {
      base_price: 79, // per person
      group_discount: 0,
    },
  },
  {
    durationMin: 150,
    title: "Cooking Class — Thai Street Food (150 min)",
    description: "Pad Thai + curry fundamentals. Build flavor profiles from scratch.",
    category: "Cooking Class",
    config: {
      cuisine_type: "thai",
      skill_level: "intermediate",
      max_participants: 10,
      duration_minutes: 150,
      dietary_restrictions_accommodated: true,
    },
    pricing: {
      base_price: 89,
      group_discount: 10,
    },
  },
  {
    durationMin: 180,
    title: "Cooking Class — Sushi Basics (180 min)",
    description: "Rice technique, nigiri + maki practice, and knife safety tips.",
    category: "Cooking Class",
    config: {
      cuisine_type: "japanese",
      skill_level: "beginner",
      max_participants: 8,
      duration_minutes: 180,
      dietary_restrictions_accommodated: false,
    },
    pricing: {
      base_price: 99,
      group_discount: 0,
    },
  },
];

async function seedType(params: {
  typeId: "escape_room" | "cooking_class";
  group: { catalogGroupId: string; catalogGroupTitle: string; catalogGroupKind: string };
  seeds: SeedItem[];
}) {
  const { typeId, group, seeds } = params;

  // Load active templates for this business
  const templates = await prisma.availabilityTemplate.findMany({
    where: { businessId: BUSINESS_ID, status: "active" },
    select: { id: true, slotDurationMinutes: true, name: true },
  });

  const templateByDuration = new Map<number, string>();
  for (const t of templates) templateByDuration.set(t.slotDurationMinutes, t.id);

  // Validate durations exist
  const missingDurations = Array.from(new Set(seeds.map((s) => s.durationMin))).filter(
    (d) => !templateByDuration.has(d)
  );

  if (missingDurations.length > 0) {
    console.log(`\nAvailable templates for business ${BUSINESS_ID}:`);
    templates
      .sort((a, b) => a.slotDurationMinutes - b.slotDurationMinutes)
      .forEach((t) => console.log(`- ${t.slotDurationMinutes} min: ${t.name} (${t.id})`));

    throw new Error(
      `Missing active availability templates for durations: ${missingDurations.join(
        ", "
      )}. Create templates with those slotDurationMinutes first.`
    );
  }

  await prisma.$transaction(async (tx) => {
    // idempotent: remove previous runs for this group+type
    await tx.activity.deleteMany({
      where: {
        businessId: BUSINESS_ID,
        typeId,
        catalogGroupId: group.catalogGroupId,
      },
    });

    // insert all
    for (const s of seeds) {
      await tx.activity.create({
        data: {
          businessId: BUSINESS_ID,
          status: DEFAULT_STATUS,
          typeId,
          title: s.title,
          description: s.description,
          category: s.category,
          city: CITY || undefined,
          address: ADDRESS || undefined,
          priceFrom: computePriceFromFromPricing(s.pricing),
          catalogGroupId: group.catalogGroupId,
          catalogGroupTitle: group.catalogGroupTitle,
          catalogGroupKind: group.catalogGroupKind,
          availabilityTemplateId: templateByDuration.get(s.durationMin)!,
          config: s.config,
          pricing: s.pricing,
        },
      });
    }
  });

  console.log(`✓ Seeded ${seeds.length} '${typeId}' activities into group '${group.catalogGroupId}'.`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!BUSINESS_ID || BUSINESS_ID.includes("PUT_YOUR_BUSINESS")) {
    throw new Error("Set BUSINESS_ID in prisma/escape-cooking-seed.ts before running.");
  }

  console.log("Starting seed: Escape Room + Cooking Class...");

  await seedType({
    typeId: "escape_room",
    group: ESCAPE_GROUP,
    seeds: escapeRoomSeeds,
  });

  await seedType({
    typeId: "cooking_class",
    group: COOKING_GROUP,
    seeds: cookingClassSeeds,
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
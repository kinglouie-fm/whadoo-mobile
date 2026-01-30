import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function seedActivityTypes() {
  const types = [
    {
      typeId: "karting",
      schemaVersion: 1,
      displayName: "Karting Experience",
      configSchema: {
        fields: [
          {
            name: "track_type",
            label: "Track Type",
            type: "select",
            required: true,
            options: [
              { value: "indoor", label: "Indoor" },
              { value: "outdoor", label: "Outdoor" },
            ],
          },
          {
            name: "min_age",
            label: "Minimum Age",
            type: "number",
            required: true,
            min: 0,
            max: 100,
          },
          {
            name: "max_participants",
            label: "Max Participants per Session",
            type: "number",
            required: true,
            min: 1,
            max: 50,
          },
          {
            name: "equipment_provided",
            label: "Include Helmet & Suit?",
            type: "checkbox",
            required: false,
          },
          {
            name: "duration_minutes",
            label: "Session Duration (minutes)",
            type: "number",
            required: true,
            min: 15,
            max: 180,
          },
        ],
      },
      pricingSchema: {
        fields: [
          {
            name: "base_price",
            label: "Base Price (per person)",
            type: "number",
            required: true,
            min: 0,
          },
          {
            name: "group_discount",
            label: "Group Discount %",
            type: "number",
            required: false,
            min: 0,
            max: 100,
          },
          {
            name: "equipment_rental_fee",
            label: "Equipment Rental (if not included)",
            type: "number",
            required: false,
            min: 0,
          },
        ],
      },
    },
    {
      typeId: "cooking_class",
      schemaVersion: 1,
      displayName: "Cooking Class",
      configSchema: {
        fields: [
          {
            name: "cuisine_type",
            label: "Cuisine",
            type: "select",
            required: true,
            options: [
              { value: "italian", label: "Italian" },
              { value: "thai", label: "Thai" },
              { value: "french", label: "French" },
              { value: "japanese", label: "Japanese" },
              { value: "mexican", label: "Mexican" },
            ],
          },
          {
            name: "skill_level",
            label: "Skill Level",
            type: "select",
            required: true,
            options: [
              { value: "beginner", label: "Beginner" },
              { value: "intermediate", label: "Intermediate" },
              { value: "advanced", label: "Advanced" },
            ],
          },
          {
            name: "max_participants",
            label: "Max Participants",
            type: "number",
            required: true,
            min: 1,
            max: 20,
          },
          {
            name: "duration_minutes",
            label: "Class Duration (minutes)",
            type: "number",
            required: true,
            min: 30,
            max: 300,
          },
          {
            name: "dietary_restrictions_accommodated",
            label: "Accommodate Dietary Restrictions?",
            type: "checkbox",
            required: false,
          },
        ],
      },
      pricingSchema: {
        fields: [
          {
            name: "base_price",
            label: "Base Price (per person)",
            type: "number",
            required: true,
            min: 0,
          },
          {
            name: "group_discount",
            label: "Group Discount %",
            type: "number",
            required: false,
            min: 0,
            max: 100,
          },
        ],
      },
    },
    {
      typeId: "escape_room",
      schemaVersion: 1,
      displayName: "Escape Room",
      configSchema: {
        fields: [
          {
            name: "difficulty_level",
            label: "Difficulty Level",
            type: "select",
            required: true,
            options: [
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
              { value: "expert", label: "Expert" },
            ],
          },
          {
            name: "theme",
            label: "Theme",
            type: "text",
            required: true,
            placeholder: "e.g., Mystery, Horror, Sci-Fi",
          },
          {
            name: "min_participants",
            label: "Minimum Participants",
            type: "number",
            required: true,
            min: 1,
            max: 20,
          },
          {
            name: "max_participants",
            label: "Maximum Participants",
            type: "number",
            required: true,
            min: 1,
            max: 20,
          },
          {
            name: "duration_minutes",
            label: "Time Limit (minutes)",
            type: "number",
            required: true,
            min: 30,
            max: 120,
          },
          {
            name: "age_restriction",
            label: "Minimum Age",
            type: "number",
            required: false,
            min: 0,
            max: 18,
          },
        ],
      },
      pricingSchema: {
        fields: [
          {
            name: "base_price",
            label: "Base Price (per group)",
            type: "number",
            required: true,
            min: 0,
          },
          {
            name: "per_person_price",
            label: "Price per Additional Person",
            type: "number",
            required: false,
            min: 0,
          },
        ],
      },
    },
  ];

  for (const type of types) {
    await prisma.activityTypeDefinition.upsert({
      where: {
        typeId_schemaVersion: {
          typeId: type.typeId,
          schemaVersion: type.schemaVersion,
        },
      },
      create: type,
      update: type,
    });
    console.log(`✓ Seeded type: ${type.displayName}`);
  }
}

async function main() {
  console.log("Starting seed...");
  await seedActivityTypes();
  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

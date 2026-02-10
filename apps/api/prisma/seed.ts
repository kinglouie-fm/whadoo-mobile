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
            name: "packages",
            label: "Packages / Formulas",
            type: "array",
            required: true,
            itemSchema: {
              fields: [
                {
                  name: "code",
                  label: "Package Code",
                  type: "text",
                  required: true,
                  placeholder: "e.g., standard, mini-gp, grand-gp",
                },
                {
                  name: "title",
                  label: "Package Title",
                  type: "text",
                  required: true,
                  placeholder: "e.g., Standard Session, Mini GP",
                },
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
                  name: "description",
                  label: "Description",
                  type: "textarea",
                  required: false,
                  placeholder: "Describe this package...",
                },
                {
                  name: "format_lines",
                  label: "Format Details (one per line)",
                  type: "textarea",
                  required: false,
                  placeholder: "e.g., 8 min qualifying\n16 min race",
                },
                {
                  name: "base_price",
                  label: "Base Price",
                  type: "number",
                  required: false,
                  min: 0,
                },
                {
                  name: "currency",
                  label: "Currency",
                  type: "text",
                  required: false,
                  placeholder: "EUR",
                },
                {
                  name: "pricing_type",
                  label: "Pricing Model",
                  type: "select",
                  required: true,
                  options: [
                    { label: "Per Person", value: "per_person" },
                    { label: "Fixed (Group Rate)", value: "fixed" },
                  ],
                },
                {
                  name: "min_participants",
                  label: "Minimum Participants",
                  type: "number",
                  required: false,
                  min: 1,
                  placeholder: "e.g., 5 karts minimum",
                },
                {
                  name: "age_min",
                  label: "Minimum Age",
                  type: "number",
                  required: false,
                  min: 0,
                },
                {
                  name: "age_max",
                  label: "Maximum Age",
                  type: "number",
                  required: false,
                  min: 0,
                },
                {
                  name: "is_default",
                  label: "Default Package",
                  type: "checkbox",
                  required: false,
                },
                {
                  name: "sort_order",
                  label: "Sort Order",
                  type: "number",
                  required: false,
                  min: 0,
                },
                {
                  name: "schedule_note",
                  label: "Schedule Note",
                  type: "text",
                  required: false,
                  placeholder: "e.g., First Wednesday of month at 17:15",
                },
                {
                  name: "request_only",
                  label: "Request Only (not bookable online)",
                  type: "checkbox",
                  required: false,
                },
              ],
            },
          },
        ],
      },
      pricingSchema: {
        fields: [],
      },
    },
    {
      typeId: "cooking_class",
      schemaVersion: 1,
      displayName: "Cooking Class",
      configSchema: {
        fields: [
          {
            name: "packages",
            label: "Package Options",
            type: "array",
            required: true,
            itemSchema: {
              fields: [
                {
                  name: "code",
                  label: "Package Code",
                  type: "text",
                  required: true,
                  placeholder: "e.g., standard, premium, couples",
                },
                {
                  name: "title",
                  label: "Package Title",
                  type: "text",
                  required: true,
                  placeholder: "e.g., Standard Seat, Premium with Wine",
                },
                {
                  name: "description",
                  label: "Description",
                  type: "textarea",
                  required: false,
                  placeholder: "Describe this package...",
                },
                {
                  name: "base_price",
                  label: "Price",
                  type: "number",
                  required: false,
                  min: 0,
                },
                {
                  name: "currency",
                  label: "Currency",
                  type: "text",
                  required: false,
                  placeholder: "EUR",
                },
                {
                  name: "pricing_type",
                  label: "Pricing Model",
                  type: "select",
                  required: true,
                  options: [
                    { label: "Per Person", value: "per_person" },
                    { label: "Fixed (Group Rate)", value: "fixed" },
                  ],
                },
                {
                  name: "is_default",
                  label: "Default Package",
                  type: "checkbox",
                  required: true,
                },
                {
                  name: "sort_order",
                  label: "Display Order",
                  type: "number",
                  required: true,
                  min: 0,
                },
                {
                  name: "includes_wine",
                  label: "Includes Wine Pairing",
                  type: "checkbox",
                  required: false,
                },
                {
                  name: "min_participants",
                  label: "Minimum Participants",
                  type: "number",
                  required: false,
                  min: 1,
                  max: 20,
                },
                {
                  name: "max_participants",
                  label: "Maximum Participants",
                  type: "number",
                  required: false,
                  min: 1,
                  max: 20,
                },
              ],
            },
          },
        ],
      },
      pricingSchema: {
        fields: [],
      },
    },
    {
      typeId: "escape_room",
      schemaVersion: 1,
      displayName: "Escape Room",
      configSchema: {
        fields: [
          {
            name: "packages",
            label: "Package Options",
            type: "array",
            required: true,
            itemSchema: {
              fields: [
                {
                  name: "code",
                  label: "Package Code",
                  type: "text",
                  required: true,
                  placeholder: "e.g., 2-players, 3-4-players, birthday",
                },
                {
                  name: "title",
                  label: "Package Title",
                  type: "text",
                  required: true,
                  placeholder: "e.g., 2 Players, Birthday Package",
                },
                {
                  name: "description",
                  label: "Description",
                  type: "textarea",
                  required: false,
                  placeholder: "Describe this package...",
                },
                {
                  name: "base_price",
                  label: "Price",
                  type: "number",
                  required: false,
                  min: 0,
                },
                {
                  name: "currency",
                  label: "Currency",
                  type: "text",
                  required: false,
                  placeholder: "EUR",
                },
                {
                  name: "pricing_type",
                  label: "Pricing Model",
                  type: "select",
                  required: true,
                  options: [
                    { label: "Per Person", value: "per_person" },
                    { label: "Fixed (Group Rate)", value: "fixed" },
                  ],
                },
                {
                  name: "is_default",
                  label: "Default Package",
                  type: "checkbox",
                  required: true,
                },
                {
                  name: "sort_order",
                  label: "Display Order",
                  type: "number",
                  required: true,
                  min: 0,
                },
                {
                  name: "player_count",
                  label: "Number of Players",
                  type: "text",
                  required: false,
                  placeholder: "e.g., 2-4, up to 8",
                },
                {
                  name: "difficulty_level",
                  label: "Difficulty Level",
                  type: "select",
                  required: false,
                  options: [
                    { value: "easy", label: "Easy" },
                    { value: "medium", label: "Medium" },
                    { value: "hard", label: "Hard" },
                    { value: "expert", label: "Expert" },
                  ],
                },
                {
                  name: "includes_extras",
                  label: "Includes Extras (decorations, etc.)",
                  type: "checkbox",
                  required: false,
                },
              ],
            },
          },
        ],
      },
      pricingSchema: {
        fields: [],
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

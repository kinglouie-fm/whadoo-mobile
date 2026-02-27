import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { Pool } from 'pg';

async function seedActivityTypeDefinitions(prisma: PrismaClient) {
  const existing = await prisma.activityTypeDefinition.findUnique({
    where: { typeId_schemaVersion: { typeId: 'karting', schemaVersion: 1 } },
  });
  if (existing) return;

  await prisma.activityTypeDefinition.create({
    data: {
      typeId: 'karting',
      schemaVersion: 1,
      displayName: 'Karting Experience',
      configSchema: { fields: [] },
      pricingSchema: { fields: [] },
    },
  });
}

const url = process.env.DATABASE_URL ?? '';
if (process.env.NODE_ENV !== 'test' || !url.includes('/whadoo_test')) {
  throw new Error(
    `Refusing to run tests on non-test DB. NODE_ENV=${process.env.NODE_ENV} DATABASE_URL=${url}`,
  );
}

// Create a dedicated pool + adapter for tests (Prisma 7 driver adapter style)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// PrismaClientOptions in Prisma 7 expects adapter (NOT datasources)
const prisma = new PrismaClient({ adapter });

export async function setupTestDatabase() {
  // Run migrations against the test DB
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }

  // Ensure Prisma can connect
  await prisma.$connect();

  // Ensure activity type definitions exist (required for activity create/update)
  await seedActivityTypeDefinitions(prisma);
}

export async function cleanupTestDatabase() {
  const rows = await prisma.$queryRawUnsafe<
    { tablename: string; schemaname: string }[]
  >(`
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `);

  if (!rows.length) return;

  const tableList = rows
    .map((r) => `"${r.schemaname}"."${r.tablename}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`,
  );

  await seedActivityTypeDefinitions(prisma);
}

export async function disconnectTestDatabase() {
  await prisma.$disconnect();
  await pool.end();
}

export { prisma as testPrisma };

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Cleaning database (preserving accounts)...\n');

  try {
    // Delete in dependency order
    console.log('  Deleting bookings...');
    const bookings = await prisma.booking.deleteMany({});
    console.log(`    ✓ Deleted ${bookings.count} bookings`);

    console.log('  Deleting slot capacities...');
    const slotCapacities = await prisma.slotCapacity.deleteMany({});
    console.log(`    ✓ Deleted ${slotCapacities.count} slot capacities`);

    console.log('  Deleting activity images...');
    const activityImages = await prisma.activityImage.deleteMany({});
    console.log(`    ✓ Deleted ${activityImages.count} activity images`);

    console.log('  Deleting saved activities...');
    const savedActivities = await prisma.savedActivity.deleteMany({});
    console.log(`    ✓ Deleted ${savedActivities.count} saved activities`);

    console.log('  Deleting user swipes...');
    const userSwipes = await prisma.userSwipe.deleteMany({});
    console.log(`    ✓ Deleted ${userSwipes.count} user swipes`);

    console.log('  Deleting activities...');
    const activities = await prisma.activity.deleteMany({});
    console.log(`    ✓ Deleted ${activities.count} activities`);

    console.log('  Deleting assets...');
    const assets = await prisma.asset.deleteMany({});
    console.log(`    ✓ Deleted ${assets.count} assets`);

    console.log('\n✅ Database cleaned successfully!');
    console.log('📋 Preserved: User accounts, Business accounts, Activity type definitions');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

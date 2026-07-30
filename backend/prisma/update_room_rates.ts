/**
 * update_room_rates.ts
 * Sets correct hourly rates per room:
 *  - Space  → 20 EGP / person / hr
 *  - Outdoor (1 & 2) → 10 EGP / person / hr
 *  - cafe (meeting room billed wrongly at 300) → 10 EGP
 * Run with: npx tsx prisma/update_room_rates.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying per-room hourly rate corrections...');

  // Space → 20 EGP per person
  const space = await prisma.room.updateMany({
    where: { name: { contains: 'space', mode: 'insensitive' } },
    data: { hourlyRate: 20, individualHourlyRate: 20 },
  });
  console.log(`Space rooms updated: ${space.count}`);

  // Outdoor (any name containing outdoor) → 10 EGP per person
  const outdoor = await prisma.room.updateMany({
    where: { name: { contains: 'outdoor', mode: 'insensitive' } },
    data: { hourlyRate: 10, individualHourlyRate: 10 },
  });
  console.log(`Outdoor rooms updated: ${outdoor.count}`);

  // cafe room (meeting type, wrongly priced at 300) → 10 EGP
  const cafe = await prisma.room.updateMany({
    where: {
      OR: [
        { name: { contains: 'cafe', mode: 'insensitive' } },
        { hourlyRate: 300 },
      ],
    },
    data: { hourlyRate: 10, individualHourlyRate: 10 },
  });
  console.log(`Cafe/legacy-300 rooms updated: ${cafe.count}`);

  // Print final state
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      name: true,
      roomType: true,
      hourlyRate: true,
      individualHourlyRate: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\nFinal room rates:');
  rooms.forEach((r) => {
    console.log(
      `  [${r.roomType}] ${r.name} -> hourly: ${r.hourlyRate}, individual: ${r.individualHourlyRate}`,
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

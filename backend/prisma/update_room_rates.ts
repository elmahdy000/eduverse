/**
 * update_room_rates.ts
 * Upserts all coworking and study rooms to 10 EGP per person hourly rate.
 * Run with: npx tsx prisma/update_room_rates.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating coworking/study room rates to 10 EGP per person...');

  const result = await prisma.room.updateMany({
    where: {
      roomType: { in: ['coworking', 'study'] },
    },
    data: {
      hourlyRate: 10,
      individualHourlyRate: 10,
    },
  });

  console.log(`Updated ${result.count} room(s) to 10 EGP/hour per person.`);

  const rooms = await prisma.room.findMany({
    select: { id: true, name: true, roomType: true, hourlyRate: true, individualHourlyRate: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Current room rates:');
  rooms.forEach((r) => {
    console.log(`  [${r.roomType}] ${r.name} -> hourly: ${r.hourlyRate}, individual: ${r.individualHourlyRate}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

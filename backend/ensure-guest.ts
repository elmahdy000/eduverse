
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst();
  if (!admin) throw new Error('No admin user found');

  const guest = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' }, // Use a fixed UUID for guest if possible, or just phone
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      fullName: 'Walk-in Guest',
      phoneNumber: '0000000000',
      customerType: 'visitor',
      createdByUserId: admin.id,
    }
  });
  console.log('Guest customer ensured:', guest.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { fullName: { contains: 'ضيف' } },
        { fullName: { contains: 'Guest' } },
        { fullName: { contains: 'Walk-in' } }
      ]
    }
  });
  console.log(JSON.stringify(customers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

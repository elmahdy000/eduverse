import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const counts = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
    _avg: { price: true }
  });
  console.table(counts);
}
main().finally(() => prisma.$disconnect());

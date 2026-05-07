import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orderCount = await prisma.barOrder.count();
  const productCount = await prisma.product.count();
  const inactiveProducts = await prisma.product.count({ where: { active: false } });
  const activeProducts = await prisma.product.count({ where: { active: true } });
  
  console.log(JSON.stringify({ orderCount, productCount, inactiveProducts, activeProducts }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

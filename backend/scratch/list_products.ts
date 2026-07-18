import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { category: { contains: 'tea', mode: 'insensitive' } },
        { category: { contains: 'indom', mode: 'insensitive' } }
      ]
    }
  });
  console.log(`Matching products: ${products.length}`);
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    availability: p.availability,
    active: p.active
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

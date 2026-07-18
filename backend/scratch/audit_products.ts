import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get all products grouped by category
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }, { createdAt: 'asc' }],
  });

  console.log(`Total active products: ${products.length}\n`);

  // Find duplicates (same name, case-insensitive, same category)
  const seen = new Map<string, string>(); // key -> first id
  const duplicates: string[] = [];

  for (const p of products) {
    const key = `${p.category.toLowerCase()}:${p.name.toLowerCase()}`;
    if (seen.has(key)) {
      duplicates.push(p.id);
      console.log(`DUPLICATE: [${p.category}] "${p.name}" (id: ${p.id})`);
    } else {
      seen.set(key, p.id);
    }
  }

  console.log(`\nFound ${duplicates.length} duplicates\n`);

  // Group by category for overview
  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category)!.push(p);
  }

  console.log('=== Products by Category ===');
  for (const [cat, prods] of byCategory) {
    console.log(`\n[${cat}] (${prods.length} items):`);
    for (const p of prods) {
      const isDup = duplicates.includes(p.id);
      console.log(`  ${isDup ? '❌ DUP' : '  ✅'} ${p.name} — ${p.price} ج`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

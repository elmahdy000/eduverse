import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const INDOMY_IMAGE = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400';

const indomyProducts = [
  // ─── الأنواع الأساسية ────────────────────────────────────
  {
    name: 'إندومي عادي',
    category: 'Indomy',
    price: 30,
    costPrice: 12,
    description: 'إندومي مسلوق عادي بالتوابل',
  },
  {
    name: 'إندومي بجبنة',
    category: 'Indomy',
    price: 45,
    costPrice: 18,
    description: 'إندومي مسلوق مع جبنة مشكلة',
  },
  {
    name: 'إندومي بهوت دوج',
    category: 'Indomy',
    price: 45,
    costPrice: 18,
    description: 'إندومي مسلوق مع قطع هوت دوج',
  },
  {
    name: 'إندومي بتركي',
    category: 'Indomy',
    price: 45,
    costPrice: 18,
    description: 'إندومي مسلوق مع شرائح تركي',
  },
  {
    name: 'إندومي بالبيض',
    category: 'Indomy',
    price: 40,
    costPrice: 16,
    description: 'إندومي مسلوق مع بيضة مقلية أو مسلوقة',
  },
  {
    name: 'إندومي سبيشيال',
    category: 'Indomy',
    price: 65,
    costPrice: 26,
    description: 'إندومي مسلوق مع جبنة + هوت دوج + تركي',
  },
  {
    name: 'إندومي حار',
    category: 'Indomy',
    price: 35,
    costPrice: 14,
    description: 'إندومي مسلوق بصلصة حارة',
  },
  {
    name: 'إندومي بالزبدة',
    category: 'Indomy',
    price: 35,
    costPrice: 14,
    description: 'إندومي مسلوق بالزبدة',
  },
  // ─── الإضافات ───────────────────────────────────────────
  {
    name: 'إضافة جبنة',
    category: 'Indomy Add-ons',
    price: 15,
    costPrice: 6,
    description: 'إضافة جبنة مشكلة للإندومي',
  },
  {
    name: 'إضافة هوت دوج',
    category: 'Indomy Add-ons',
    price: 15,
    costPrice: 6,
    description: 'إضافة هوت دوج للإندومي',
  },
  {
    name: 'إضافة تركي',
    category: 'Indomy Add-ons',
    price: 15,
    costPrice: 6,
    description: 'إضافة شرائح تركي للإندومي',
  },
  {
    name: 'إضافة بيضة',
    category: 'Indomy Add-ons',
    price: 10,
    costPrice: 4,
    description: 'إضافة بيضة مقلية أو مسلوقة للإندومي',
  },
  {
    name: 'إضافة زبدة',
    category: 'Indomy Add-ons',
    price: 5,
    costPrice: 2,
    description: 'إضافة زبدة للإندومي',
  },
];

async function main() {
  console.log('🍜 Adding Indomy types...\n');

  let added = 0;
  let skipped = 0;

  for (const item of indomyProducts) {
    // Check if already exists (by name, case-insensitive)
    const existing = await prisma.product.findFirst({
      where: {
        name: { equals: item.name, mode: 'insensitive' },
        active: true,
      },
    });

    if (existing) {
      console.log(`  ⏭️  Skipped (already exists): ${item.name}`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        ...item,
        imageUrl: INDOMY_IMAGE,
        availability: true,
        active: true,
        isFridge: false,
        isBakery: false,
      },
    });

    console.log(`  ✅ Added: ${item.name} (${item.price} ج)`);
    added++;
  }

  console.log(`\n✔ Done! Added: ${added} | Skipped: ${skipped}`);

  // Show all current Indomy products
  const allIndomy = await prisma.product.findMany({
    where: {
      OR: [
        { category: { contains: 'indomy', mode: 'insensitive' } },
      ],
      active: true,
    },
    orderBy: [{ category: 'asc' }, { price: 'asc' }],
  });

  console.log(`\n📋 All Indomy products in DB (${allIndomy.length} total):`);
  for (const p of allIndomy) {
    console.log(`  [${p.category}] ${p.name} — ${p.price} ج`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

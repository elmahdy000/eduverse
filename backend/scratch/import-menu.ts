import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const menuPath = path.join(__dirname, 'menu.json');
  const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));

  console.log(`Starting import of ${menuData.items.length} items across ${menuData.categories.length} categories...`);

  // 1. Deactivate current products
  await prisma.product.updateMany({
    where: { active: true },
    data: { active: false, availability: false },
  });
  console.log('Deactivated existing products.');

  // 2. Import new products
  let count = 0;
  for (const item of menuData.items) {
    const categoryName = item.categoryId; // Using slug/id as category name for consistency

    // Handle regular price
    if (item.regularPrice !== undefined && item.regularPrice !== null && item.regularPrice > 0) {
      const name = item.largePrice ? `${item.name} (M)` : item.name;
      await prisma.product.create({
        data: {
          name,
          category: categoryName,
          price: item.regularPrice,
          description: `${item.name} - Regular Size`,
          availability: true,
          active: true,
        },
      });
      count++;
    }

    // Handle large price
    if (item.largePrice !== undefined && item.largePrice !== null && item.largePrice > 0) {
      await prisma.product.create({
        data: {
          name: `${item.name} (L)`,
          category: categoryName,
          price: item.largePrice,
          description: `${item.name} - Large Size`,
          availability: true,
          active: true,
        },
      });
      count++;
    }
  }

  console.log(`Successfully imported ${count} product variants.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const categoryImages: Record<string, string> = {
  'Coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
  'Tea': 'https://images.unsplash.com/photo-1544787210-2213d84ad960?auto=format&fit=crop&q=80&w=400',
  'Cold Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400',
  'Hot Drinks': 'https://images.unsplash.com/photo-1544787210-2213d84ad960?auto=format&fit=crop&q=80&w=400',
  'Frappe': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400',
  'Frappuccino': 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400',
  'Milk Shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bcc?auto=format&fit=crop&q=80&w=400',
  'Yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400',
  'Cans': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
  'Mocktails': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
  'Boba Additions': 'https://images.unsplash.com/photo-1558857563-b371f31ca735?auto=format&fit=crop&q=80&w=400',
  'Smoothies': 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&q=80&w=400',
  'Fresh Juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400',
  'Indomy': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400',
  'Indomy Add-ons': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400',
  'Additions': 'https://images.unsplash.com/photo-1551024601-bec78acc704b?auto=format&fit=crop&q=80&w=400',
  'Extra\'s': 'https://images.unsplash.com/photo-1551024601-bec78acc704b?auto=format&fit=crop&q=80&w=400'
};

async function main() {
  const csvPath = path.resolve(__dirname, '../../eduverse_menu_prices.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.split('\n');

  console.log(`🚀 Starting menu import from ${csvPath}...`);

  console.log('🧹 Cleaning existing products and related data...');
  await prisma.recipeItem.deleteMany();
  await prisma.barOrderItem.deleteMany();
  await prisma.product.deleteMany();

  let importedCount = 0;
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Basic CSV split (handles simple cases)
    const [category, item, size, priceStr, notes] = line.split(',');
    
    if (!item || !priceStr) continue;

    const price = parseFloat(priceStr);
    if (isNaN(price)) continue;

    const productName = size && size !== 'One Size' ? `${item} (${size})` : item;
    const categoryName = category.trim();
    
    const imageUrl = categoryImages[categoryName] || 'https://images.unsplash.com/photo-1551024601-bec78acc704b?auto=format&fit=crop&q=80&w=400';

    // Use a placeholder cost (40% of price)
    const costPrice = price * 0.4;

    try {
      await prisma.product.create({
        data: {
          name: productName,
          category: categoryName,
          price: price,
          costPrice: costPrice,
          description: notes ? `${notes} - Imported from menu` : `Fresh ${productName}`,
          imageUrl: imageUrl,
          availability: true,
          active: true,
        },
      });
      importedCount++;
      if (importedCount % 10 === 0) {
        console.log(`✅ Imported ${importedCount} products...`);
      }
    } catch (error) {
      console.error(`❌ Failed to import ${productName}:`, error.message);
    }
  }

  console.log(`\n🎉 Import Complete! Total products imported: ${importedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

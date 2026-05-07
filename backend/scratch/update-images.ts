import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const categoryImages: Record<string, string> = {
  "coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80",
  "tea": "https://images.unsplash.com/photo-1544787210-22bbd921bd14?w=500&q=80",
  "frappe": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80",
  "cold-coffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80",
  "hot-drinks": "https://images.unsplash.com/photo-1544145945-f904253db0ad?w=500&q=80",
  "frappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80",
  "milk-shake": "https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&q=80",
  "smoothies": "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500&q=80",
  "yougert": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80",
  "cans": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
  "mocktails": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80",
  "indomy": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80",
  "boba-drinks": "https://images.unsplash.com/photo-1558857563-b371f30ca6a5?w=500&q=80",
  "additions": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&q=80",
};

async function main() {
  console.log('Updating products with beautiful images...');
  
  const products = await prisma.product.findMany({ where: { active: true } });
  
  for (const product of products) {
    const imageUrl = categoryImages[product.category] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl }
    });
  }
  
  console.log(`Updated ${products.length} products with category-based images.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

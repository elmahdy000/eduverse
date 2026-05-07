import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of test items...');
  
  // 1. Find inactive products
  const inactiveProducts = await prisma.product.findMany({
    where: { active: false },
    select: { id: true, name: true }
  });

  console.log(`Found ${inactiveProducts.length} inactive products.`);

  const productIds = inactiveProducts.map(p => p.id);

  // 2. Check for references in BarOrderItem
  const references = await prisma.barOrderItem.count({
    where: { productId: { in: productIds } }
  });

  if (references > 0) {
    console.log(`Found ${references} order items referencing these products. Deleting related orders first...`);
    
    // Find order IDs
    const ordersWithTestItems = await prisma.barOrderItem.findMany({
      where: { productId: { in: productIds } },
      select: { orderId: true }
    });
    
    const orderIds = Array.from(new Set(ordersWithTestItems.map(o => o.orderId)));
    
    // Delete BarOrderItems first (cascade usually handles this but let's be explicit if needed)
    // Actually Prisma usually needs explicit deletion or cascade set in schema.
    // Our schema has: order BarOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
    // So deleting BarOrder will delete BarOrderItems.
    
    await prisma.barOrder.deleteMany({
      where: { id: { in: orderIds } }
    });
    
    console.log(`Deleted ${orderIds.length} test orders.`);
  }

  // 3. Delete the products
  const result = await prisma.product.deleteMany({
    where: { id: { in: productIds } }
  });

  console.log(`Successfully deleted ${result.count} test products.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

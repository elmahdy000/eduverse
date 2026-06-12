import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all inventory-related data...');
  
  // Start a transaction
  await prisma.$transaction(async (tx) => {
    // 1. Delete all RecipeItem links
    const recipeCount = await tx.recipeItem.deleteMany();
    console.log(`🗑️ Deleted ${recipeCount.count} RecipeItem records.`);
    
    // 2. Delete all WasteEntry records
    const wasteCount = await tx.wasteEntry.deleteMany();
    console.log(`🗑️ Deleted ${wasteCount.count} WasteEntry records.`);
    
    // 3. Delete all InventoryTransaction records
    const transactionCount = await tx.inventoryTransaction.deleteMany();
    console.log(`🗑️ Deleted ${transactionCount.count} InventoryTransaction records.`);
    
    // 4. Delete all InventoryItem records
    const itemCount = await tx.inventoryItem.deleteMany();
    console.log(`🗑️ Deleted ${itemCount.count} InventoryItem records.`);
  });
  
  console.log('✅ Inventory database tables cleared successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error clearing inventory:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

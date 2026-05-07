import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // 1. إدارة أصناف المخزن
  async listItems() {
    return this.prisma.inventoryItem.findMany({
      include: {
        _count: { select: { recipes: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createItem(data: { name: string; unit: string; category?: string; minStockLevel?: number; costPerUnit?: number }) {
    return this.prisma.inventoryItem.create({
      data: {
        ...data,
        currentStock: 0,
      },
    });
  }

  // 2. إدارة المخزون (الوارد والمنصرف)
  async addStock(itemId: string, quantity: number, userId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) throw new NotFoundException('Inventory item not found');

      // 1. Create Transaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: itemId,
          type: 'in',
          quantity,
          reason: reason || 'Stock Entry',
          performedByUserId: userId,
        },
      });

      // 2. Update Current Stock
      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: { increment: quantity } },
      });

      // 3. Central Audit Log
      await this.auditLogsService.createAuditLog({
        userId,
        action: 'ADD_STOCK',
        entityType: 'inventory_item',
        entityId: itemId,
        newValue: { quantity, reason: reason || 'Stock Entry', currentStock: updated.currentStock },
      });

      return updated;
    });
  }

  // 3. إدارة الوصفات (Recipes)
  async setRecipe(productId: string, items: { inventoryItemId: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      // Clear old recipe items
      await tx.recipeItem.deleteMany({ where: { productId } });

      // Add new recipe items
      const created = await Promise.all(
        items.map((item) =>
          tx.recipeItem.create({
            data: {
              productId,
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
            },
          }),
        ),
      );
      return created;
    });
  }

  // 4. الخصم التلقائي (السحر الحقيقي)
  async deductStockForOrder(orderId: string, userId: string) {
    const order = await this.prisma.barOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: { recipeItems: true },
            },
          },
        },
      },
    });

    if (!order) return;

    for (const orderItem of order.items) {
      const recipeItems = orderItem.product.recipeItems;
      if (!recipeItems || recipeItems.length === 0) continue;

      for (const recipe of recipeItems) {
        const totalDeduction = Number(recipe.quantity) * orderItem.quantity;

        // Log transaction and update stock
        await this.prisma.$transaction(async (tx) => {
          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId: recipe.inventoryItemId,
              type: 'out',
              quantity: totalDeduction,
              reason: `Order: ${order.id.slice(0, 8)}`,
              referenceId: orderId,
              performedByUserId: userId,
            },
          });

          const updated = await tx.inventoryItem.update({
            where: { id: recipe.inventoryItemId },
            data: { currentStock: { decrement: totalDeduction } },
          });

          // Central Audit Log (Manual)
          await this.auditLogsService.createAuditLog({
            userId,
            action: 'AUTO_DEDUCT_STOCK',
            entityType: 'inventory_item',
            entityId: recipe.inventoryItemId,
            newValue: { orderId, quantity: totalDeduction, currentStock: updated.currentStock },
          });
        });
      }
    }
  }
  
  // 5. إدارة الهالك (Waste Management)
  async recordWaste(data: { inventoryItemId: string; quantity: number; reason?: string }, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
      if (!item) throw new NotFoundException('Inventory item not found');

      // 1. Create Waste Entry
      const waste = await tx.wasteEntry.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          quantity: data.quantity,
          reason: data.reason,
          recordedByUserId: userId,
        },
      });

      // 2. Create Inventory Transaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          type: 'adjustment',
          quantity: data.quantity,
          reason: `Waste: ${data.reason || 'No reason'}`,
          referenceId: waste.id,
          performedByUserId: userId,
        },
      });

      // 3. Update Stock
      const updated = await tx.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: { currentStock: { decrement: data.quantity } },
      });

      // 4. Central Audit Log
      await this.auditLogsService.createAuditLog({
        userId,
        action: 'RECORD_WASTE',
        entityType: 'inventory_item',
        entityId: data.inventoryItemId,
        newValue: { quantity: data.quantity, reason: data.reason, currentStock: updated.currentStock },
      });

      return waste;
    });
  }
}

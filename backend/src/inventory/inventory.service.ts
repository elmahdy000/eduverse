import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  async listItems() {
    return this.prisma.inventoryItem.findMany({
      include: { _count: { select: { recipes: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createItem(data: { name: string; unit: string; category?: string; minStockLevel?: number; costPerUnit?: number }) {
    return this.prisma.inventoryItem.create({
      data: { ...data, currentStock: 0 },
    });
  }

  async addStock(itemId: string, quantity: number, userId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) throw new NotFoundException('Inventory item not found');

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: itemId,
          type: 'in',
          quantity,
          reason: reason || 'Stock Entry',
          performedByUserId: userId,
        },
      });

      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: { increment: quantity } },
      });

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

  async setRecipe(productId: string, items: { inventoryItemId: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { productId } });
      const created = await Promise.all(
        items.map((item) =>
          tx.recipeItem.create({
            data: { productId, inventoryItemId: item.inventoryItemId, quantity: item.quantity },
          }),
        ),
      );
      return created;
    });
  }

  async deductStockForOrder(orderId: string, userId: string) {
    const order = await this.prisma.barOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: { include: { recipeItems: true } } },
        },
      },
    });

    if (!order) return;

    return this.prisma.$transaction(async (tx) => {
      for (const orderItem of order.items) {
        const recipeItems = orderItem.product.recipeItems;
        if (!recipeItems || recipeItems.length === 0) continue;

        for (const recipe of recipeItems) {
          const totalDeduction = Number(recipe.quantity) * orderItem.quantity;

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

          await this.auditLogsService.createAuditLog({
            userId,
            action: 'AUTO_DEDUCT_STOCK',
            entityType: 'inventory_item',
            entityId: recipe.inventoryItemId,
            newValue: {
              orderId,
              quantity: totalDeduction,
              currentStock: updated.currentStock,
              isNegative: Number(updated.currentStock) < 0,
            },
          });
        }
      }
    });
  }

  async getTransactions(itemId?: string, limit = 100) {
    return this.prisma.inventoryTransaction.findMany({
      where: itemId ? { inventoryItemId: itemId } : undefined,
      include: {
        inventoryItem: { select: { name: true, unit: true } },
        performedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async recordWaste(data: { inventoryItemId: string; quantity: number; reason?: string }, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
      if (!item) throw new NotFoundException('Inventory item not found');

      const waste = await tx.wasteEntry.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          quantity: data.quantity,
          reason: data.reason,
          recordedByUserId: userId,
        },
      });

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

      const updated = await tx.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: { currentStock: { decrement: data.quantity } },
      });

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

  async getWasteSummary(fromDate?: string, toDate?: string) {
    const dateFilter =
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {};

    const [entries, byItem] = await Promise.all([
      this.prisma.wasteEntry.aggregate({
        where: dateFilter,
        _sum: { quantity: true },
        _count: true,
      }),
      this.prisma.wasteEntry.groupBy({
        by: ['inventoryItemId'],
        where: dateFilter,
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const itemIds = byItem.map((r) => r.inventoryItemId);
    const items = itemIds.length
      ? await this.prisma.inventoryItem.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, name: true, unit: true, costPerUnit: true },
        })
      : [];
    const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

    const topItems = byItem.map((r) => {
      const item = itemMap[r.inventoryItemId];
      const qty = Number(r._sum.quantity ?? 0);
      const cost = item?.costPerUnit ? Number(item.costPerUnit) * qty : null;
      return {
        itemId: r.inventoryItemId,
        name: item?.name ?? 'Unknown',
        unit: item?.unit ?? '',
        totalQuantity: qty,
        estimatedCost: cost,
        entryCount: r._count,
      };
    });

    return {
      totalEntries: entries._count,
      totalQuantity: Number(entries._sum.quantity ?? 0),
      totalEstimatedCost: topItems.reduce((s, i) => s + (i.estimatedCost ?? 0), 0),
      topWastedItems: topItems,
    };
  }
}

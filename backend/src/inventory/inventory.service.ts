import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

function inferInventoryDefaults(name: string): { unit: string; category: string; minStockLevel: number; isFridge: boolean; isBakery: boolean } {
  const lowerName = name.toLowerCase();
  
  // Default fallback values
  let unit = 'قطعة';
  let category = 'خامات';
  let minStockLevel = 10;
  let isFridge = false;
  let isBakery = false;

  // Fridge keywords
  const fridgeKeywords = [
    'بيبسي', 'pepsi', 'كولا', 'cola', 'سفن', 'seven', 'سبرايت', 'sprite',
    'ريد بول', 'red bull', 'redbull', 'بيريل', 'birell', 'فيروز', 'fayrouz',
    'شويبس', 'schweppes', 'ماء', 'مياه', 'water', 'صودا', 'ساقع', 'كانز', 'can'
  ];

  // Bakery keywords
  const bakeryKeywords = [
    'كرواسون', 'croissant', 'باتيه', 'pate', 'مخبوز', 'مخبوزات', 'كيك', 'cake',
    'كوكيز', 'cookies', 'muffin', 'مافن', 'دونات', 'donut', 'بيكرى', 'bakery'
  ];

  if (fridgeKeywords.some(kw => lowerName.includes(kw))) {
    isFridge = true;
  }
  if (bakeryKeywords.some(kw => lowerName.includes(kw))) {
    isBakery = true;
  }

  // Inference rules based on Arabic & English keywords
  if (
    lowerName.includes('بن') || 
    lowerName.includes('قهوة') || 
    lowerName.includes('اسبريسو') || 
    lowerName.includes('سكر') || 
    lowerName.includes('شوكولاتة') || 
    lowerName.includes('بودرة') ||
    lowerName.includes('ماتشا') ||
    lowerName.includes('كوكو') ||
    lowerName.includes('قرفة') ||
    lowerName.includes('نعناع') ||
    lowerName.includes('coffee') ||
    lowerName.includes('sugar') ||
    lowerName.includes('cocoa') ||
    lowerName.includes('powder')
  ) {
    unit = 'جرام';
    category = 'خامات';
    minStockLevel = 500; // 500 grams default
  } else if (
    lowerName.includes('حليب') || 
    lowerName.includes('لبن') || 
    lowerName.includes('سيرب') || 
    lowerName.includes('شراب') || 
    lowerName.includes('عصير') ||
    lowerName.includes('ماء') || 
    lowerName.includes('مياه') ||
    lowerName.includes('صودا') ||
    lowerName.includes('كريمة') ||
    lowerName.includes('milk') ||
    lowerName.includes('syrup') ||
    lowerName.includes('juice') ||
    lowerName.includes('water') ||
    lowerName.includes('cream')
  ) {
    unit = 'مل';
    category = 'خامات';
    minStockLevel = 1000; // 1000 ml (1 liter) default
  } else if (
    lowerName.includes('كوب') || 
    lowerName.includes('أكواب') ||
    lowerName.includes('غطا') || 
    lowerName.includes('غطاء') || 
    lowerName.includes('أغطية') || 
    lowerName.includes('شفاط') || 
    lowerName.includes('شاليموه') || 
    lowerName.includes('معلقة') || 
    lowerName.includes('ملاعق') ||
    lowerName.includes('شوكة') ||
    lowerName.includes('شوك') ||
    lowerName.includes('شنطة') ||
    lowerName.includes('شنط') ||
    lowerName.includes('علبة') ||
    lowerName.includes('علب') ||
    lowerName.includes('cup') ||
    lowerName.includes('lid') ||
    lowerName.includes('straw') ||
    lowerName.includes('spoon') ||
    lowerName.includes('bag') ||
    lowerName.includes('box')
  ) {
    unit = 'قطعة';
    category = 'تعبئة';
    minStockLevel = 100; // 100 pieces default
  } else if (
    lowerName.includes('صابون') || 
    lowerName.includes('منظف') || 
    lowerName.includes('كلور') || 
    lowerName.includes('ديتول') || 
    lowerName.includes('مناديل') ||
    lowerName.includes('soap') ||
    lowerName.includes('tissue') ||
    lowerName.includes('cleaner')
  ) {
    unit = 'قطعة';
    category = 'منظفات';
    minStockLevel = 5;
  }

  return { unit, category, minStockLevel, isFridge, isBakery };
}

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

  async createItem(
    data: {
      name: string;
      unit?: string;
      category?: string;
      minStockLevel?: number;
      costPerUnit?: number;
      initialStock?: number;
      isFridge?: boolean;
      isBakery?: boolean;
    },
    userId?: string,
  ) {
    const inferred = inferInventoryDefaults(data.name);

    const unit = data.unit || inferred.unit;
    const category = data.category || inferred.category;
    const minStockLevel = data.minStockLevel !== undefined ? data.minStockLevel : inferred.minStockLevel;
    const costPerUnit = data.costPerUnit || 0;
    const initialStock = data.initialStock || 0;
    const isFridge = data.isFridge !== undefined ? data.isFridge : inferred.isFridge;
    const isBakery = data.isBakery !== undefined ? data.isBakery : inferred.isBakery;

    return this.prisma.$transaction(async (tx) => {
      const createdItem = await tx.inventoryItem.create({
        data: {
          name: data.name,
          unit,
          category,
          minStockLevel,
          costPerUnit,
          currentStock: initialStock,
          isFridge,
          isBakery,
        },
      });

      if (initialStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: createdItem.id,
            type: 'in',
            quantity: initialStock,
            reason: 'رصيد أول المدة (تلقائي عند الإنشاء)',
            performedByUserId: userId || '00000000-0000-0000-0000-000000000000', // default fallback uuid if not provided
          },
        });

        if (userId) {
          await this.auditLogsService.createAuditLog({
            userId,
            action: 'INITIAL_STOCK_ENTRY',
            entityType: 'inventory_item',
            entityId: createdItem.id,
            newValue: { initialStock, reason: 'Initial stock auto-fill' },
          });
        }
      }

      return createdItem;
    });
  }

  async addStock(itemId: string, quantity: number, userId: string, reason?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('الكمية المضافة يجب أن تكون أكبر من صفر');
    }
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

  async withdrawStock(itemId: string, quantity: number, userId: string, reason: string) {
    if (quantity <= 0) {
      throw new BadRequestException('الكمية المسحوبة يجب أن تكون أكبر من صفر');
    }
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item) throw new NotFoundException('Inventory item not found');

      if (Number(item.currentStock) < quantity) {
        throw new BadRequestException('الكمية المتاحة في المخزن غير كافية للسحب');
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: itemId,
          type: 'out',
          quantity,
          reason: reason || 'سحب يدوي',
          performedByUserId: userId,
        },
      });

      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: { decrement: quantity } },
      });

      await this.auditLogsService.createAuditLog({
        userId,
        action: 'WITHDRAW_STOCK',
        entityType: 'inventory_item',
        entityId: itemId,
        newValue: { quantity, reason, currentStock: updated.currentStock },
      });

      return updated;
    });
  }

  async setRecipe(productId: string, items: { inventoryItemId: string; quantity: number }[]) {
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestException('كمية المكون يجب أن تكون أكبر من صفر');
      }
    }
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

  async getRecipe(productId: string) {
    return this.prisma.recipeItem.findMany({
      where: { productId },
      include: { inventoryItem: true },
    });
  }

  async deductStockForOrder(orderId: string, userId: string) {
    return this.prisma.$transaction((tx) =>
      this.deductStockForOrderTx(tx, orderId, userId),
    );
  }

  // نسخة تعمل داخل transaction موجود (تُستدعى من عملية تسليم الأوردر)
  // لضمان أن خصم المخزون والفاتورة يحدثان معاً أو يفشلان معاً.
  async deductStockForOrderTx(tx: any, orderId: string, userId: string) {
    const order = await tx.barOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: { include: { recipeItems: true } } },
        },
      },
    });

    if (!order) return;

    {
      // Check if stock has already been deducted for this order to prevent duplicate deductions
      const existingTx = await tx.inventoryTransaction.findFirst({
        where: { referenceId: orderId, type: 'out' },
      });
      if (existingTx) return;

      const deductions = new Map<string, number>();
      for (const orderItem of order.items) {
        let recipeItems: any[] = orderItem.product.recipeItems || [];

        // If no recipe is defined, auto-deduct 1-to-1 if there's a matching InventoryItem by name
        if (recipeItems.length === 0) {
          const matchItem = await tx.inventoryItem.findFirst({
            where: { name: { equals: orderItem.product.name, mode: 'insensitive' } },
          });
          if (matchItem) {
            recipeItems = [
              {
                inventoryItemId: matchItem.id,
                quantity: 1, // 1 unit per product item
              },
            ];
          }
        }

        if (recipeItems.length === 0) continue;

        for (const recipe of recipeItems) {
          const totalDeduction = Number(recipe.quantity) * orderItem.quantity;
          deductions.set(recipe.inventoryItemId, (deductions.get(recipe.inventoryItemId) ?? 0) + totalDeduction);
        }
      }

      for (const [inventoryItemId, totalDeduction] of deductions) {
          const updatedCount = await tx.inventoryItem.updateMany({
            where: { id: inventoryItemId, currentStock: { gte: totalDeduction } },
            data: { currentStock: { decrement: totalDeduction } },
          });
          if (updatedCount.count !== 1) throw new BadRequestException('Insufficient inventory stock to deliver this order');

          const updated = await tx.inventoryItem.findUnique({ where: { id: inventoryItemId } });
          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId,
              type: 'out',
              quantity: totalDeduction,
              reason: `Order: ${order.id.slice(0, 8)}`,
              referenceId: orderId,
              performedByUserId: userId,
            },
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: 'AUTO_DEDUCT_STOCK',
              entityType: 'inventory_item',
              entityId: inventoryItemId,
              newValue: {
                orderId,
                quantity: totalDeduction,
                currentStock: updated.currentStock,
                isNegative: false,
              },
            },
          });
      }
    }
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
    if (data.quantity <= 0) {
      throw new BadRequestException('الكمية التالفة يجب أن تكون أكبر من صفر');
    }
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
      if (!item) throw new NotFoundException('Inventory item not found');
      if (Number(item.currentStock) < data.quantity) throw new BadRequestException('Waste quantity exceeds available stock');

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

  async performStocktake(items: { inventoryItemId: string; actualStock: number; reason?: string }[], userId: string) {
    for (const entry of items) {
      if (Number(entry.actualStock) < 0) {
        throw new BadRequestException('الكمية الفعلية لا يمكن أن تكون أقل من صفر');
      }
    }
    return this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const entry of items) {
        const item = await tx.inventoryItem.findUnique({ where: { id: entry.inventoryItemId } });
        if (!item) throw new NotFoundException(`Item ${entry.inventoryItemId} not found`);

        const current = Number(item.currentStock);
        const actual = Number(entry.actualStock);
        const diff = actual - current;

        if (diff === 0) continue; // No change

        const type = diff > 0 ? 'in' : 'out';
        const absDiff = Math.abs(diff);

        // Update inventory item stock
        const updated = await tx.inventoryItem.update({
          where: { id: entry.inventoryItemId },
          data: { currentStock: actual },
        });

        // Record transaction
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: entry.inventoryItemId,
            type: 'adjustment',
            quantity: absDiff,
            reason: entry.reason || `تسوية جرد: ${diff > 0 ? 'زيادة' : 'عجز'} بقيمة ${absDiff} ${item.unit}`,
            performedByUserId: userId,
          },
        });

        await this.auditLogsService.createAuditLog({
          userId,
          action: 'STOCKTAKE_ADJUSTMENT',
          entityType: 'inventory_item',
          entityId: entry.inventoryItemId,
          newValue: {
            previousStock: current,
            actualStock: actual,
            difference: diff,
            reason: entry.reason,
          },
        });

        results.push(updated);
      }
      return results;
    });
  }
}

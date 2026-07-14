import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * OwnerReportsService
 * -----------------------------------------------------------------------------
 * خدمة موحّدة لبوابة أصحاب المشروع (OwnerPortal): بترجّع تقارير مالية وتشغيلية
 * تفصيلية بدون أي أوامر تعديل. كل التوابع للقراءة فقط.
 */
@Injectable()
export class OwnerReportsService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private parseRange(fromDate?: string, toDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (fromDate) {
      start = new Date(fromDate);
      if (isNaN(start.getTime())) throw new BadRequestException('fromDate غير صالح');
      start.setHours(0, 0, 0, 0);
    } else {
      // افتراضي: أول اليوم الحالي
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
    }

    if (toDate) {
      end = new Date(toDate);
      if (isNaN(end.getTime())) throw new BadRequestException('toDate غير صالح');
      end.setHours(23, 59, 59, 999);
    } else {
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    }

    if (start > end) throw new BadRequestException('fromDate يجب أن يكون قبل toDate');
    return { start, end };
  }

  private localDayKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private daysInRange(start: Date, end: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    while (cursor <= last) {
      days.push(this.localDayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  private pctChange(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private round2(n: number): number {
    return Number(n.toFixed(2));
  }

  // ---------------------------------------------------------------------------
  // 1) KPIs عامة: نظرة سريعة على المؤشرات الأساسية
  // ---------------------------------------------------------------------------

  async getKpis(fromDate?: string, toDate?: string) {
    const { start, end } = this.parseRange(fromDate, toDate);

    // نفس مدى الفترة السابقة للمقارنة
    const spanMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - spanMs);

    const [
      paymentsCurrent,
      paymentsPrevious,
      expensesCurrent,
      expensesPrevious,
      invoicesCurrent,
      sessionsClosedCurrent,
      barOrdersDelivered,
      newCustomers,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.count({
        where: { issuedAt: { gte: start, lte: end } },
      }),
      this.prisma.session.count({
        where: { status: 'closed', endTime: { gte: start, lte: end } },
      }),
      this.prisma.barOrder.count({
        where: { status: 'delivered', updatedAt: { gte: start, lte: end } },
      }),
      this.prisma.customer.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    const revenue = this.round2(Number(paymentsCurrent._sum.amount || 0));
    const prevRevenue = this.round2(Number(paymentsPrevious._sum.amount || 0));
    const expenses = this.round2(Number(expensesCurrent._sum.amount || 0));
    const prevExpenses = this.round2(Number(expensesPrevious._sum.amount || 0));
    const netProfit = this.round2(revenue - expenses);
    const prevNetProfit = this.round2(prevRevenue - prevExpenses);
    const profitMargin = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : null;

    return {
      range: { start: start.toISOString(), end: end.toISOString() },
      revenue: {
        value: revenue,
        previous: prevRevenue,
        change: this.pctChange(revenue, prevRevenue),
        transactionsCount: paymentsCurrent._count,
      },
      expenses: {
        value: expenses,
        previous: prevExpenses,
        change: this.pctChange(expenses, prevExpenses),
        entriesCount: expensesCurrent._count,
      },
      netProfit: {
        value: netProfit,
        previous: prevNetProfit,
        change: this.pctChange(netProfit, prevNetProfit),
        margin: profitMargin,
      },
      counts: {
        invoices: invoicesCurrent,
        sessionsClosed: sessionsClosedCurrent,
        barOrdersDelivered,
        newCustomers,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 2) تقرير الدخل: تفصيل الفواتير والمدفوعات
  // ---------------------------------------------------------------------------

  async getRevenueReport(fromDate?: string, toDate?: string) {
    const { start, end } = this.parseRange(fromDate, toDate);

    const [payments, invoicesAll, refunds, sessionCharges, barOrderRevenue] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end } },
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          paidAt: true,
          invoice: {
            select: {
              invoiceNumber: true,
              customer: { select: { fullName: true, customerType: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.invoice.findMany({
        where: { issuedAt: { gte: start, lte: end } },
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          amountPaid: true,
          remainingAmount: true,
          paymentStatus: true,
          issuedAt: true,
          customer: { select: { fullName: true, customerType: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: start, lte: end }, amount: { lt: 0 } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.session.aggregate({
        where: { status: 'closed', endTime: { gte: start, lte: end } },
        _sum: { chargeAmount: true },
      }),
      this.prisma.barOrder.aggregate({
        where: { status: 'delivered', updatedAt: { gte: start, lte: end } },
        _sum: { totalAmount: true },
      }),
    ]);

    // تفصيل المدفوعات بالطريقة
    const byMethodMap = new Map<string, { method: string; total: number; count: number }>();
    for (const p of payments) {
      const key = p.paymentMethod;
      const existing = byMethodMap.get(key) ?? { method: key, total: 0, count: 0 };
      existing.total += Number(p.amount);
      existing.count += 1;
      byMethodMap.set(key, existing);
    }
    const byMethod = Array.from(byMethodMap.values()).map((x) => ({
      ...x,
      total: this.round2(x.total),
    }));

    // اتجاه يومي
    const trendMap: Record<string, { day: string; revenue: number; count: number }> = {};
    for (const day of this.daysInRange(start, end)) {
      trendMap[day] = { day, revenue: 0, count: 0 };
    }
    for (const p of payments) {
      const key = this.localDayKey(new Date(p.paidAt));
      if (trendMap[key]) {
        trendMap[key].revenue += Number(p.amount);
        trendMap[key].count += 1;
      }
    }
    const dailyTrend = Object.values(trendMap).map((d) => ({
      day: d.day,
      revenue: this.round2(d.revenue),
      count: d.count,
    }));

    // إجماليات
    const totalCollected = this.round2(payments.reduce((s, p) => s + Number(p.amount), 0));
    const totalRefunded = this.round2(Math.abs(Number(refunds._sum.amount || 0)));

    // فواتير غير مدفوعة داخل الفترة
    const unpaidInvoices = invoicesAll.filter((i) => i.paymentStatus !== 'paid');
    const totalOutstanding = this.round2(
      unpaidInvoices.reduce((s, i) => s + Number(i.remainingAmount), 0),
    );

    return {
      range: { start: start.toISOString(), end: end.toISOString() },
      totals: {
        collected: totalCollected,
        refunded: totalRefunded,
        net: this.round2(totalCollected - totalRefunded),
        sessionCharges: this.round2(Number(sessionCharges._sum.chargeAmount || 0)),
        barOrders: this.round2(Number(barOrderRevenue._sum.totalAmount || 0)),
        outstandingInvoices: totalOutstanding,
      },
      counts: {
        payments: payments.length,
        refunds: refunds._count,
        invoices: invoicesAll.length,
        unpaidInvoices: unpaidInvoices.length,
      },
      byMethod,
      dailyTrend,
      payments: payments.slice(0, 100).map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.paymentMethod,
        paidAt: p.paidAt,
        invoiceNumber: p.invoice?.invoiceNumber,
        customerName: p.invoice?.customer?.fullName,
        customerType: p.invoice?.customer?.customerType,
      })),
      unpaidInvoices: unpaidInvoices.slice(0, 50).map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        customerName: i.customer?.fullName,
        totalAmount: Number(i.totalAmount),
        amountPaid: Number(i.amountPaid),
        remainingAmount: Number(i.remainingAmount),
        paymentStatus: i.paymentStatus,
        issuedAt: i.issuedAt,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // 3) تقرير المصروفات: تفصيل حسب التصنيف والمورد
  // ---------------------------------------------------------------------------

  async getExpensesReport(fromDate?: string, toDate?: string) {
    const { start, end } = this.parseRange(fromDate, toDate);

    const [expenses, categories, vendors] = await Promise.all([
      this.prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
        include: {
          category: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
          recordedByUser: { select: { firstName: true, lastName: true } },
          linkedUser: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.expenseCategory.findMany(),
      this.prisma.vendor.findMany(),
    ]);

    const totalAmount = this.round2(expenses.reduce((s, e) => s + Number(e.amount), 0));

    // بالتصنيف
    const byCategoryMap = new Map<string, { categoryId: string; categoryName: string; total: number; count: number }>();
    for (const e of expenses) {
      const key = e.categoryId;
      const existing = byCategoryMap.get(key) ?? {
        categoryId: key,
        categoryName: e.category?.name || 'غير مصنف',
        total: 0,
        count: 0,
      };
      existing.total += Number(e.amount);
      existing.count += 1;
      byCategoryMap.set(key, existing);
    }
    const byCategory = Array.from(byCategoryMap.values())
      .map((x) => ({ ...x, total: this.round2(x.total), percent: totalAmount > 0 ? this.round2((x.total / totalAmount) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);

    // بالمورد
    const byVendorMap = new Map<string, { vendorId: string; vendorName: string; total: number; count: number }>();
    for (const e of expenses) {
      if (!e.vendorId) continue;
      const key = e.vendorId;
      const existing = byVendorMap.get(key) ?? {
        vendorId: key,
        vendorName: e.vendor?.name || 'غير محدد',
        total: 0,
        count: 0,
      };
      existing.total += Number(e.amount);
      existing.count += 1;
      byVendorMap.set(key, existing);
    }
    const byVendor = Array.from(byVendorMap.values())
      .map((x) => ({ ...x, total: this.round2(x.total) }))
      .sort((a, b) => b.total - a.total);

    // بالطريقة
    const byMethodMap = new Map<string, { method: string; total: number; count: number }>();
    for (const e of expenses) {
      const key = e.paymentMethod;
      const existing = byMethodMap.get(key) ?? { method: key, total: 0, count: 0 };
      existing.total += Number(e.amount);
      existing.count += 1;
      byMethodMap.set(key, existing);
    }
    const byMethod = Array.from(byMethodMap.values()).map((x) => ({
      ...x,
      total: this.round2(x.total),
    }));

    // اتجاه يومي
    const trendMap: Record<string, { day: string; total: number; count: number }> = {};
    for (const day of this.daysInRange(start, end)) {
      trendMap[day] = { day, total: 0, count: 0 };
    }
    for (const e of expenses) {
      const key = this.localDayKey(new Date(e.date));
      if (trendMap[key]) {
        trendMap[key].total += Number(e.amount);
        trendMap[key].count += 1;
      }
    }
    const dailyTrend = Object.values(trendMap).map((d) => ({
      day: d.day,
      total: this.round2(d.total),
      count: d.count,
    }));

    // الرواتب/العهد (linkedUserId)
    const linkedExpenses = expenses.filter((e) => e.linkedUserId);
    const salariesTotal = this.round2(
      linkedExpenses.reduce((s, e) => s + Number(e.amount), 0),
    );

    return {
      range: { start: start.toISOString(), end: end.toISOString() },
      totals: {
        total: totalAmount,
        salariesAndAdvances: salariesTotal,
        entriesCount: expenses.length,
      },
      byCategory,
      byVendor,
      byMethod,
      dailyTrend,
      entries: expenses.slice(0, 200).map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        date: e.date,
        description: e.description,
        categoryName: e.category?.name,
        vendorName: e.vendor?.name,
        paymentMethod: e.paymentMethod,
        recordedBy: e.recordedByUser ? `${e.recordedByUser.firstName || ''} ${e.recordedByUser.lastName || ''}`.trim() : null,
        linkedUser: e.linkedUser ? `${e.linkedUser.firstName || ''} ${e.linkedUser.lastName || ''}`.trim() : null,
        status: e.status,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // 4) تقرير صافي الربح: دخل − مصروفات + مقارنة الفترات
  // ---------------------------------------------------------------------------

  async getProfitReport(fromDate?: string, toDate?: string) {
    const { start, end } = this.parseRange(fromDate, toDate);
    const spanMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - spanMs);

    const [payments, expenses, prevPayments, prevExpenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paidAt: { gte: start, lte: end } },
        select: { amount: true, paidAt: true },
      }),
      this.prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
        select: { amount: true, date: true },
      }),
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
    ]);

    const revenue = this.round2(payments.reduce((s, p) => s + Number(p.amount), 0));
    const totalExpenses = this.round2(expenses.reduce((s, e) => s + Number(e.amount), 0));
    const net = this.round2(revenue - totalExpenses);
    const margin = revenue > 0 ? Number(((net / revenue) * 100).toFixed(1)) : null;

    const prevRevenue = this.round2(Number(prevPayments._sum.amount || 0));
    const prevExpensesTotal = this.round2(Number(prevExpenses._sum.amount || 0));
    const prevNet = this.round2(prevRevenue - prevExpensesTotal);

    // Daily trend
    const trendMap: Record<string, { day: string; revenue: number; expenses: number }> = {};
    for (const day of this.daysInRange(start, end)) {
      trendMap[day] = { day, revenue: 0, expenses: 0 };
    }
    for (const p of payments) {
      const key = this.localDayKey(new Date(p.paidAt));
      if (trendMap[key]) trendMap[key].revenue += Number(p.amount);
    }
    for (const e of expenses) {
      const key = this.localDayKey(new Date(e.date));
      if (trendMap[key]) trendMap[key].expenses += Number(e.amount);
    }
    const dailyTrend = Object.values(trendMap).map((d) => ({
      day: d.day,
      revenue: this.round2(d.revenue),
      expenses: this.round2(d.expenses),
      net: this.round2(d.revenue - d.expenses),
    }));

    return {
      range: { start: start.toISOString(), end: end.toISOString() },
      current: {
        revenue,
        expenses: totalExpenses,
        net,
        margin,
      },
      previous: {
        revenue: prevRevenue,
        expenses: prevExpensesTotal,
        net: prevNet,
      },
      changes: {
        revenue: this.pctChange(revenue, prevRevenue),
        expenses: this.pctChange(totalExpenses, prevExpensesTotal),
        net: this.pctChange(net, prevNet),
      },
      dailyTrend,
    };
  }

  // ---------------------------------------------------------------------------
  // 5) تفاصيل البار: مبيعات المنتجات، التصنيفات، الأداء
  // ---------------------------------------------------------------------------

  async getBarReport(fromDate?: string, toDate?: string) {
    const { start, end } = this.parseRange(fromDate, toDate);

    const orderItems = await this.prisma.barOrderItem.findMany({
      where: {
        order: {
          status: 'delivered',
          updatedAt: { gte: start, lte: end },
        },
      },
      include: {
        product: true,
        order: { select: { id: true, updatedAt: true, customerId: true, customer: { select: { customerType: true } } } },
      },
    });

    const totalRevenue = this.round2(orderItems.reduce((s, i) => s + Number(i.subtotal), 0));
    const totalCost = this.round2(
      orderItems.reduce((s, i) => s + Number((i as any).product?.costPrice || 0) * Number(i.quantity), 0),
    );
    const grossProfit = this.round2(totalRevenue - totalCost);
    const grossMargin = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : null;

    // Products
    const productMap = new Map<string, { productId: string; productName: string; category: string; quantity: number; revenue: number; cost: number }>();
    for (const item of orderItems as any[]) {
      const key = item.productId;
      const existing = productMap.get(key) ?? {
        productId: key,
        productName: item.product?.name ?? 'غير معروف',
        category: item.product?.category ?? 'other',
        quantity: 0,
        revenue: 0,
        cost: 0,
      };
      existing.quantity += Number(item.quantity);
      existing.revenue += Number(item.subtotal);
      existing.cost += Number(item.product?.costPrice || 0) * Number(item.quantity);
      productMap.set(key, existing);
    }
    const products = Array.from(productMap.values())
      .map((p) => ({
        ...p,
        revenue: this.round2(p.revenue),
        cost: this.round2(p.cost),
        profit: this.round2(p.revenue - p.cost),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Categories
    const categoryMap = new Map<string, { category: string; quantity: number; revenue: number }>();
    for (const item of orderItems as any[]) {
      const key = item.product?.category ?? 'other';
      const existing = categoryMap.get(key) ?? { category: key, quantity: 0, revenue: 0 };
      existing.quantity += Number(item.quantity);
      existing.revenue += Number(item.subtotal);
      categoryMap.set(key, existing);
    }
    const categories = Array.from(categoryMap.values())
      .map((c) => ({ ...c, revenue: this.round2(c.revenue) }))
      .sort((a, b) => b.revenue - a.revenue);

    // Discounts breakdown by customer type
    const byCustomerTypeMap = new Map<string, { type: string; orders: Set<string>; revenue: number }>();
    for (const item of orderItems as any[]) {
      const type = item.order?.customer?.customerType || 'unknown';
      const existing = byCustomerTypeMap.get(type) ?? { type, orders: new Set<string>(), revenue: 0 };
      existing.orders.add(item.order.id);
      existing.revenue += Number(item.subtotal);
      byCustomerTypeMap.set(type, existing);
    }
    const byCustomerType = Array.from(byCustomerTypeMap.values()).map((x) => ({
      type: x.type,
      ordersCount: x.orders.size,
      revenue: this.round2(x.revenue),
    }));

    // Daily trend
    const trendMap: Record<string, { day: string; revenue: number; quantity: number }> = {};
    for (const day of this.daysInRange(start, end)) {
      trendMap[day] = { day, revenue: 0, quantity: 0 };
    }
    for (const item of orderItems as any[]) {
      const key = this.localDayKey(new Date(item.order.updatedAt));
      if (trendMap[key]) {
        trendMap[key].revenue += Number(item.subtotal);
        trendMap[key].quantity += Number(item.quantity);
      }
    }
    const dailyTrend = Object.values(trendMap).map((d) => ({
      day: d.day,
      revenue: this.round2(d.revenue),
      quantity: d.quantity,
    }));

    return {
      range: { start: start.toISOString(), end: end.toISOString() },
      totals: {
        revenue: totalRevenue,
        cost: totalCost,
        grossProfit,
        grossMargin,
        itemsSold: orderItems.reduce((s, i) => s + Number(i.quantity), 0),
      },
      products,
      categories,
      byCustomerType,
      dailyTrend,
    };
  }

  // ---------------------------------------------------------------------------
  // 6) تقرير المخزون: الحالي، الهالك، تحت الحد
  // ---------------------------------------------------------------------------

  async getInventoryReport(fromDate?: string, toDate?: string) {
    const { start, end } = this.parseRange(fromDate, toDate);

    const [items, wasteEntries, movements] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.wasteEntry.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { inventoryItem: true },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: {
          inventoryItem: { select: { name: true, unit: true, costPerUnit: true } },
          performedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
    ]);

    const totalStockValue = this.round2(
      items.reduce((s, i) => s + Number(i.currentStock) * Number(i.costPerUnit), 0),
    );

    // منتجات تحت حد الإنذار
    const lowStockItems = items
      .filter((i) => Number(i.currentStock) <= Number(i.minStockLevel))
      .map((i) => ({
        id: i.id,
        name: i.name,
        currentStock: Number(i.currentStock),
        minStockLevel: Number(i.minStockLevel),
        unit: i.unit,
        deficit: this.round2(Number(i.minStockLevel) - Number(i.currentStock)),
      }));

    // الهالك داخل الفترة
    const wasteByItemMap = new Map<string, { itemId: string; name: string; quantity: number; estimatedCost: number }>();
    for (const w of wasteEntries) {
      const key = w.inventoryItemId;
      const existing = wasteByItemMap.get(key) ?? {
        itemId: key,
        name: w.inventoryItem?.name || 'غير معروف',
        quantity: 0,
        estimatedCost: 0,
      };
      existing.quantity += Number(w.quantity);
      const cost = Number((w.inventoryItem as any)?.costPerUnit || 0) * Number(w.quantity);
      existing.estimatedCost += cost;
      wasteByItemMap.set(key, existing);
    }
    const wasteByItem = Array.from(wasteByItemMap.values())
      .map((x) => ({ ...x, estimatedCost: this.round2(x.estimatedCost) }))
      .sort((a, b) => b.estimatedCost - a.estimatedCost);

    const totalWasteCost = this.round2(wasteByItem.reduce((s, x) => s + x.estimatedCost, 0));

    return {
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalItems: items.length,
        totalStockValue,
        lowStockCount: lowStockItems.length,
        wasteEntriesCount: wasteEntries.length,
        totalWasteCost,
      },
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        unit: i.unit,
        currentStock: Number(i.currentStock),
        minStockLevel: Number(i.minStockLevel),
        costPerUnit: Number(i.costPerUnit),
        stockValue: this.round2(Number(i.currentStock) * Number(i.costPerUnit)),
        isFridge: i.isFridge,
        isBakery: i.isBakery,
        belowMin: Number(i.currentStock) <= Number(i.minStockLevel),
      })),
      lowStockItems,
      wasteByItem,
      recentMovements: movements.map((m) => ({
        id: m.id,
        itemName: m.inventoryItem?.name,
        unit: m.inventoryItem?.unit,
        type: m.type,
        quantity: Number(m.quantity),
        reason: m.reason,
        performedBy: m.performedBy
          ? `${m.performedBy.firstName || ''} ${m.performedBy.lastName || ''}`.trim()
          : null,
        createdAt: m.createdAt,
      })),
    };
  }
}

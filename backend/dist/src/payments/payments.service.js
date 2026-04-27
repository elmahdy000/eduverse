"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let PaymentsService = class PaymentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getPaymentStatus(totalAmount, amountPaid) {
        if (amountPaid <= 0) {
            return 'unpaid';
        }
        if (amountPaid >= totalAmount) {
            return 'paid';
        }
        return 'partially_paid';
    }
    async recordPayment(recordPaymentDto, userId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: recordPaymentDto.invoiceId },
        });
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        const remainingAmount = Number(invoice.remainingAmount);
        if (recordPaymentDto.amount > remainingAmount) {
            throw new Error('Payment amount exceeds remaining invoice amount');
        }
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    invoiceId: recordPaymentDto.invoiceId,
                    paymentMethod: recordPaymentDto.paymentMethod,
                    amount: recordPaymentDto.amount,
                    notes: recordPaymentDto.notes,
                    recordedByUserId: userId,
                },
            });
            const totalAmount = Number(invoice.totalAmount);
            const updatedAmountPaid = Number((Number(invoice.amountPaid) + recordPaymentDto.amount).toFixed(2));
            const updatedRemaining = Number((totalAmount - updatedAmountPaid).toFixed(2));
            const paymentStatus = this.getPaymentStatus(totalAmount, updatedAmountPaid);
            await tx.invoice.update({
                where: { id: recordPaymentDto.invoiceId },
                data: {
                    amountPaid: updatedAmountPaid,
                    remainingAmount: Math.max(0, updatedRemaining),
                    paymentStatus,
                },
            });
            return payment;
        });
    }
    async listPayments(page = 1, limit = 20, filters) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const safePage = Math.max(page, 1);
        const skip = (safePage - 1) * safeLimit;
        const where = {};
        if (filters?.invoiceId) {
            where.invoiceId = filters.invoiceId;
        }
        if (filters?.paymentMethod) {
            where.paymentMethod = filters.paymentMethod;
        }
        if (filters?.fromDate || filters?.toDate) {
            where.paidAt = {};
            if (filters.fromDate) {
                where.paidAt.gte = new Date(filters.fromDate);
            }
            if (filters.toDate) {
                where.paidAt.lte = new Date(filters.toDate);
            }
        }
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                include: {
                    invoice: true,
                    recordedByUser: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { paidAt: 'desc' },
                skip,
                take: safeLimit,
            }),
            this.prisma.payment.count({ where }),
        ]);
        return {
            data: payments,
            total,
            page: safePage,
            limit: safeLimit,
            hasMore: skip + payments.length < total,
        };
    }
    async refundPayment(paymentId, refundDto, userId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { invoice: true },
        });
        if (!payment) {
            throw new Error('Payment not found');
        }
        const originalAmount = Number(payment.amount);
        if (originalAmount <= 0) {
            throw new Error('Cannot refund a refund payment');
        }
        const refundAmount = refundDto.amount ?? originalAmount;
        if (refundAmount > originalAmount) {
            throw new Error('Refund amount cannot exceed original payment amount');
        }
        return this.prisma.$transaction(async (tx) => {
            const refundPayment = await tx.payment.create({
                data: {
                    invoiceId: payment.invoiceId,
                    paymentMethod: payment.paymentMethod,
                    amount: -Math.abs(refundAmount),
                    notes: refundDto.reason
                        ? `Refund for payment ${paymentId}: ${refundDto.reason}`
                        : `Refund for payment ${paymentId}`,
                    recordedByUserId: userId,
                },
            });
            const invoice = payment.invoice;
            const totalAmount = Number(invoice.totalAmount);
            const adjustedPaid = Math.max(0, Number((Number(invoice.amountPaid) - refundAmount).toFixed(2)));
            const adjustedRemaining = Number((totalAmount - adjustedPaid).toFixed(2));
            const paymentStatus = this.getPaymentStatus(totalAmount, adjustedPaid);
            await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    amountPaid: adjustedPaid,
                    remainingAmount: Math.max(0, adjustedRemaining),
                    paymentStatus,
                },
            });
            return refundPayment;
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map
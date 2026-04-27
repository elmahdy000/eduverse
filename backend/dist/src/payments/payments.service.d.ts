import { PrismaService } from '../common/prisma/prisma.service';
import { RecordPaymentDto, RefundPaymentDto } from './dto/payment.dto';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getPaymentStatus;
    recordPayment(recordPaymentDto: RecordPaymentDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        paidAt: Date;
        invoiceId: string;
        paymentMethod: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        recordedByUserId: string;
    }>;
    listPayments(page?: number, limit?: number, filters?: {
        invoiceId?: string;
        paymentMethod?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<{
        data: ({
            invoice: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                notes: string | null;
                createdByUserId: string;
                issuedAt: Date;
                customerId: string;
                sessionId: string | null;
                invoiceNumber: string;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discountAmount: import("@prisma/client/runtime/library").Decimal;
                taxAmount: import("@prisma/client/runtime/library").Decimal;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                remainingAmount: import("@prisma/client/runtime/library").Decimal;
                paymentStatus: string;
                dueAt: Date | null;
            };
            recordedByUser: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            paidAt: Date;
            invoiceId: string;
            paymentMethod: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            recordedByUserId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    refundPayment(paymentId: string, refundDto: RefundPaymentDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        paidAt: Date;
        invoiceId: string;
        paymentMethod: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        recordedByUserId: string;
    }>;
}

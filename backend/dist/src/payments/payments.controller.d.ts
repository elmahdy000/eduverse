import { RecordPaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    recordPayment(recordPaymentDto: RecordPaymentDto, req: any): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            notes: string | null;
            invoiceId: string;
            paymentMethod: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date;
            recordedByUserId: string;
        };
        timestamp: string;
    }>;
    listPayments(page?: string, limit?: string, invoiceId?: string, paymentMethod?: string, fromDate?: string, toDate?: string): Promise<{
        success: boolean;
        data: {
            data: ({
                invoice: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    notes: string | null;
                    createdByUserId: string;
                    customerId: string;
                    totalAmount: import("@prisma/client/runtime/library").Decimal;
                    sessionId: string | null;
                    subtotal: import("@prisma/client/runtime/library").Decimal;
                    invoiceNumber: string;
                    discountAmount: import("@prisma/client/runtime/library").Decimal;
                    taxAmount: import("@prisma/client/runtime/library").Decimal;
                    amountPaid: import("@prisma/client/runtime/library").Decimal;
                    remainingAmount: import("@prisma/client/runtime/library").Decimal;
                    paymentStatus: string;
                    issuedAt: Date;
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
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                paidAt: Date;
                recordedByUserId: string;
            })[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
    refundPayment(paymentId: string, refundDto: RefundPaymentDto, req: any): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            notes: string | null;
            invoiceId: string;
            paymentMethod: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date;
            recordedByUserId: string;
        };
        message: string;
        timestamp: string;
    }>;
}

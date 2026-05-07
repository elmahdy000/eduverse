import { CreateInvoiceDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private invoicesService;
    constructor(invoicesService: InvoicesService);
    generateInvoice(createInvoiceDto: CreateInvoiceDto, req: any): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    getInvoice(invoiceId: string): Promise<{
        success: boolean;
        data: {
            customer: {
                id: string;
                notes: string | null;
                createdByUserId: string;
                createdAt: Date;
                updatedAt: Date;
                fullName: string;
                phoneNumber: string;
                phoneNumberSecondary: string | null;
                email: string | null;
                address: string | null;
                customerType: string;
                college: string | null;
                studyLevel: string | null;
                specialization: string | null;
                employerName: string | null;
                jobTitle: string | null;
                status: string;
                firstVisitAt: Date | null;
                lastVisitAt: Date | null;
            };
            session: {
                id: string;
                customerId: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                sessionType: string;
                roomId: string | null;
                startTime: Date;
                endTime: Date | null;
                durationMinutes: number | null;
                guestCode: string | null;
                chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
                openedByUserId: string;
                closedByUserId: string | null;
            } | null;
            items: {
                id: string;
                invoiceId: string;
                itemType: string;
                itemId: string | null;
                description: string | null;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                total: import("@prisma/client/runtime/library").Decimal;
            }[];
            payments: {
                id: string;
                notes: string | null;
                createdAt: Date;
                paidAt: Date;
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                recordedByUserId: string;
            }[];
        } & {
            id: string;
            sessionId: string | null;
            invoiceNumber: string;
            customerId: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            discountAmount: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            remainingAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: string;
            notes: string | null;
            issuedAt: Date;
            dueAt: Date | null;
            createdByUserId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        timestamp: string;
    }>;
    getPrintableInvoice(invoiceId: string): Promise<{
        success: boolean;
        data: {
            type: string;
            invoice: {
                customer: {
                    id: string;
                    notes: string | null;
                    createdByUserId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    fullName: string;
                    phoneNumber: string;
                    phoneNumberSecondary: string | null;
                    email: string | null;
                    address: string | null;
                    customerType: string;
                    college: string | null;
                    studyLevel: string | null;
                    specialization: string | null;
                    employerName: string | null;
                    jobTitle: string | null;
                    status: string;
                    firstVisitAt: Date | null;
                    lastVisitAt: Date | null;
                };
                session: {
                    id: string;
                    customerId: string;
                    notes: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    status: string;
                    sessionType: string;
                    roomId: string | null;
                    startTime: Date;
                    endTime: Date | null;
                    durationMinutes: number | null;
                    guestCode: string | null;
                    chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
                    openedByUserId: string;
                    closedByUserId: string | null;
                } | null;
                items: {
                    id: string;
                    invoiceId: string;
                    itemType: string;
                    itemId: string | null;
                    description: string | null;
                    quantity: number;
                    unitPrice: import("@prisma/client/runtime/library").Decimal;
                    total: import("@prisma/client/runtime/library").Decimal;
                }[];
                payments: {
                    id: string;
                    notes: string | null;
                    createdAt: Date;
                    paidAt: Date;
                    invoiceId: string;
                    paymentMethod: string;
                    amount: import("@prisma/client/runtime/library").Decimal;
                    recordedByUserId: string;
                }[];
            } & {
                id: string;
                sessionId: string | null;
                invoiceNumber: string;
                customerId: string;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discountAmount: import("@prisma/client/runtime/library").Decimal;
                taxAmount: import("@prisma/client/runtime/library").Decimal;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                remainingAmount: import("@prisma/client/runtime/library").Decimal;
                paymentStatus: string;
                notes: string | null;
                issuedAt: Date;
                dueAt: Date | null;
                createdByUserId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            generatedAt: string;
            printable: boolean;
        };
        timestamp: string;
    }>;
    getInvoicePayments(invoiceId: string): Promise<{
        success: boolean;
        data: {
            data: {
                id: string;
                notes: string | null;
                createdAt: Date;
                paidAt: Date;
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                recordedByUserId: string;
            }[];
            total: number;
            totalRecorded: number;
            remainingAmount: number;
        };
        timestamp: string;
    }>;
    listInvoices(page?: string, limit?: string, customerId?: string, paymentStatus?: string, sessionId?: string, fromDate?: string, toDate?: string): Promise<{
        success: boolean;
        data: {
            data: ({
                customer: {
                    id: string;
                    notes: string | null;
                    createdByUserId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    fullName: string;
                    phoneNumber: string;
                    phoneNumberSecondary: string | null;
                    email: string | null;
                    address: string | null;
                    customerType: string;
                    college: string | null;
                    studyLevel: string | null;
                    specialization: string | null;
                    employerName: string | null;
                    jobTitle: string | null;
                    status: string;
                    firstVisitAt: Date | null;
                    lastVisitAt: Date | null;
                };
            } & {
                id: string;
                sessionId: string | null;
                invoiceNumber: string;
                customerId: string;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discountAmount: import("@prisma/client/runtime/library").Decimal;
                taxAmount: import("@prisma/client/runtime/library").Decimal;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                amountPaid: import("@prisma/client/runtime/library").Decimal;
                remainingAmount: import("@prisma/client/runtime/library").Decimal;
                paymentStatus: string;
                notes: string | null;
                issuedAt: Date;
                dueAt: Date | null;
                createdByUserId: string;
                createdAt: Date;
                updatedAt: Date;
            })[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
}

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
                notes: string | null;
                status: string;
                firstVisitAt: Date | null;
                lastVisitAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                createdByUserId: string;
            };
            payments: {
                id: string;
                notes: string | null;
                createdAt: Date;
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                paidAt: Date;
                recordedByUserId: string;
            }[];
            session: {
                id: string;
                notes: string | null;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                sessionType: string;
                startTime: Date;
                endTime: Date | null;
                durationMinutes: number | null;
                guestCode: string | null;
                chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
                customerId: string;
                roomId: string | null;
                openedByUserId: string;
                closedByUserId: string | null;
            } | null;
            items: {
                id: string;
                description: string | null;
                quantity: number;
                invoiceId: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                itemType: string;
                total: import("@prisma/client/runtime/library").Decimal;
                itemId: string | null;
            }[];
        } & {
            id: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
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
        timestamp: string;
    }>;
    getPrintableInvoice(invoiceId: string): Promise<{
        success: boolean;
        data: {
            type: string;
            invoice: {
                customer: {
                    id: string;
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
                    notes: string | null;
                    status: string;
                    firstVisitAt: Date | null;
                    lastVisitAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    createdByUserId: string;
                };
                payments: {
                    id: string;
                    notes: string | null;
                    createdAt: Date;
                    invoiceId: string;
                    paymentMethod: string;
                    amount: import("@prisma/client/runtime/library").Decimal;
                    paidAt: Date;
                    recordedByUserId: string;
                }[];
                session: {
                    id: string;
                    notes: string | null;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    sessionType: string;
                    startTime: Date;
                    endTime: Date | null;
                    durationMinutes: number | null;
                    guestCode: string | null;
                    chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
                    customerId: string;
                    roomId: string | null;
                    openedByUserId: string;
                    closedByUserId: string | null;
                } | null;
                items: {
                    id: string;
                    description: string | null;
                    quantity: number;
                    invoiceId: string;
                    unitPrice: import("@prisma/client/runtime/library").Decimal;
                    itemType: string;
                    total: import("@prisma/client/runtime/library").Decimal;
                    itemId: string | null;
                }[];
            } & {
                id: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
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
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                paidAt: Date;
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
                    notes: string | null;
                    status: string;
                    firstVisitAt: Date | null;
                    lastVisitAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    createdByUserId: string;
                };
            } & {
                id: string;
                notes: string | null;
                createdAt: Date;
                updatedAt: Date;
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
            })[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
}

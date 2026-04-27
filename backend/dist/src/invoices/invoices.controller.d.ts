import { CreateInvoiceDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private invoicesService;
    constructor(invoicesService: InvoicesService);
    generateInvoice(createInvoiceDto: CreateInvoiceDto, req: any): Promise<{
        success: boolean;
        data: ({
            payments: {
                id: string;
                createdAt: Date;
                notes: string | null;
                paidAt: Date;
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                recordedByUserId: string;
            }[];
            customer: {
                id: string;
                createdAt: Date;
                email: string | null;
                phoneNumber: string;
                status: string;
                updatedAt: Date;
                employerName: string | null;
                college: string | null;
                fullName: string;
                phoneNumberSecondary: string | null;
                address: string | null;
                customerType: string;
                studyLevel: string | null;
                specialization: string | null;
                jobTitle: string | null;
                notes: string | null;
                firstVisitAt: Date | null;
                lastVisitAt: Date | null;
                createdByUserId: string;
            };
            session: {
                id: string;
                createdAt: Date;
                status: string;
                updatedAt: Date;
                notes: string | null;
                endTime: Date | null;
                customerId: string;
                sessionType: string;
                roomId: string | null;
                startTime: Date;
                durationMinutes: number | null;
                chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
                openedByUserId: string;
                closedByUserId: string | null;
            } | null;
            items: {
                id: string;
                description: string | null;
                total: import("@prisma/client/runtime/library").Decimal;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                itemType: string;
                itemId: string | null;
                invoiceId: string;
            }[];
        } & {
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
        }) | null;
        timestamp: string;
    }>;
    getInvoice(invoiceId: string): Promise<{
        success: boolean;
        data: {
            payments: {
                id: string;
                createdAt: Date;
                notes: string | null;
                paidAt: Date;
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                recordedByUserId: string;
            }[];
            customer: {
                id: string;
                createdAt: Date;
                email: string | null;
                phoneNumber: string;
                status: string;
                updatedAt: Date;
                employerName: string | null;
                college: string | null;
                fullName: string;
                phoneNumberSecondary: string | null;
                address: string | null;
                customerType: string;
                studyLevel: string | null;
                specialization: string | null;
                jobTitle: string | null;
                notes: string | null;
                firstVisitAt: Date | null;
                lastVisitAt: Date | null;
                createdByUserId: string;
            };
            session: {
                id: string;
                createdAt: Date;
                status: string;
                updatedAt: Date;
                notes: string | null;
                endTime: Date | null;
                customerId: string;
                sessionType: string;
                roomId: string | null;
                startTime: Date;
                durationMinutes: number | null;
                chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
                openedByUserId: string;
                closedByUserId: string | null;
            } | null;
            items: {
                id: string;
                description: string | null;
                total: import("@prisma/client/runtime/library").Decimal;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                itemType: string;
                itemId: string | null;
                invoiceId: string;
            }[];
        } & {
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
        timestamp: string;
    }>;
    getPrintableInvoice(invoiceId: string): Promise<{
        success: boolean;
        data: {
            type: string;
            invoice: {
                payments: {
                    id: string;
                    createdAt: Date;
                    notes: string | null;
                    paidAt: Date;
                    invoiceId: string;
                    paymentMethod: string;
                    amount: import("@prisma/client/runtime/library").Decimal;
                    recordedByUserId: string;
                }[];
                customer: {
                    id: string;
                    createdAt: Date;
                    email: string | null;
                    phoneNumber: string;
                    status: string;
                    updatedAt: Date;
                    employerName: string | null;
                    college: string | null;
                    fullName: string;
                    phoneNumberSecondary: string | null;
                    address: string | null;
                    customerType: string;
                    studyLevel: string | null;
                    specialization: string | null;
                    jobTitle: string | null;
                    notes: string | null;
                    firstVisitAt: Date | null;
                    lastVisitAt: Date | null;
                    createdByUserId: string;
                };
                session: {
                    id: string;
                    createdAt: Date;
                    status: string;
                    updatedAt: Date;
                    notes: string | null;
                    endTime: Date | null;
                    customerId: string;
                    sessionType: string;
                    roomId: string | null;
                    startTime: Date;
                    durationMinutes: number | null;
                    chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
                    openedByUserId: string;
                    closedByUserId: string | null;
                } | null;
                items: {
                    id: string;
                    description: string | null;
                    total: import("@prisma/client/runtime/library").Decimal;
                    quantity: number;
                    unitPrice: import("@prisma/client/runtime/library").Decimal;
                    itemType: string;
                    itemId: string | null;
                    invoiceId: string;
                }[];
            } & {
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
                createdAt: Date;
                notes: string | null;
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
                    createdAt: Date;
                    email: string | null;
                    phoneNumber: string;
                    status: string;
                    updatedAt: Date;
                    employerName: string | null;
                    college: string | null;
                    fullName: string;
                    phoneNumberSecondary: string | null;
                    address: string | null;
                    customerType: string;
                    studyLevel: string | null;
                    specialization: string | null;
                    jobTitle: string | null;
                    notes: string | null;
                    firstVisitAt: Date | null;
                    lastVisitAt: Date | null;
                    createdByUserId: string;
                };
            } & {
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
            })[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
}

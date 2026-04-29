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
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                paidAt: Date;
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
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                itemType: string;
                total: import("@prisma/client/runtime/library").Decimal;
                invoiceId: string;
                itemId: string | null;
            }[];
        } & {
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
                invoiceId: string;
                paymentMethod: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                paidAt: Date;
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
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                itemType: string;
                total: import("@prisma/client/runtime/library").Decimal;
                invoiceId: string;
                itemId: string | null;
            }[];
        } & {
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
                    invoiceId: string;
                    paymentMethod: string;
                    amount: import("@prisma/client/runtime/library").Decimal;
                    paidAt: Date;
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
                    unitPrice: import("@prisma/client/runtime/library").Decimal;
                    itemType: string;
                    total: import("@prisma/client/runtime/library").Decimal;
                    invoiceId: string;
                    itemId: string | null;
                }[];
            } & {
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

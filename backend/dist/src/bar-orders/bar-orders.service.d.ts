import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBarOrderDto, UpdateBarOrderStatusDto } from './dto/bar-order.dto';
export declare class BarOrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    createOrder(createBarOrderDto: CreateBarOrderDto, userId?: string): Promise<{
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
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                active: boolean;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                availability: boolean;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
        })[];
    } & {
        id: string;
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
        invoiceId: string | null;
    }>;
    createOrderByGuestCode(guestCode: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
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
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                active: boolean;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                availability: boolean;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
        })[];
    } & {
        id: string;
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
        invoiceId: string | null;
    }>;
    getOrder(orderId: string): Promise<{
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
        createdByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
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
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                active: boolean;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                availability: boolean;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
        })[];
    } & {
        id: string;
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
        invoiceId: string | null;
    }>;
    listOrders(page?: number, limit?: number, filters?: {
        status?: string;
        sessionId?: string;
        customerId?: string;
        guestCode?: string;
    }): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    updateOrderStatus(orderId: string, updateStatusDto: UpdateBarOrderStatusDto): Promise<{
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
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                active: boolean;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                availability: boolean;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
        })[];
    } & {
        id: string;
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
        invoiceId: string | null;
    }>;
    cancelOrder(orderId: string, _reason?: string): Promise<{
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
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                active: boolean;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                availability: boolean;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            productId: string;
        })[];
    } & {
        id: string;
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
        invoiceId: string | null;
    }>;
    getBaristaDashboard(): Promise<{
        newOrders: any[];
        inPreparationOrders: any[];
        readyOrders: any[];
        deliveredTodayCount: number;
        counts: {
            new: number;
            inPreparation: number;
            ready: number;
            deliveredToday: number;
        };
    }>;
}

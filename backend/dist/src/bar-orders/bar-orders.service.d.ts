import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBarOrderDto, UpdateBarOrderStatusDto } from './dto/bar-order.dto';
import { InventoryService } from '../inventory/inventory.service';
export declare class BarOrdersService {
    private prisma;
    private inventoryService;
    constructor(prisma: PrismaService, inventoryService: InventoryService);
    createOrder(createBarOrderDto: CreateBarOrderDto, userId?: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            status: string;
            notes: string | null;
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
            firstVisitAt: Date | null;
            lastVisitAt: Date | null;
        };
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            guestCode: string | null;
            status: string;
            notes: string | null;
            sessionType: string;
            roomId: string | null;
            startTime: Date;
            endTime: Date | null;
            durationMinutes: number | null;
            chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
            openedByUserId: string;
            closedByUserId: string | null;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                category: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
                imageUrl: string | null;
                availability: boolean;
                active: boolean;
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        guestCode: string | null;
        status: string;
        invoiceId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
    }>;
    createOrderByGuestCode(guestCode: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            status: string;
            notes: string | null;
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
            firstVisitAt: Date | null;
            lastVisitAt: Date | null;
        };
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            guestCode: string | null;
            status: string;
            notes: string | null;
            sessionType: string;
            roomId: string | null;
            startTime: Date;
            endTime: Date | null;
            durationMinutes: number | null;
            chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
            openedByUserId: string;
            closedByUserId: string | null;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                category: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
                imageUrl: string | null;
                availability: boolean;
                active: boolean;
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        guestCode: string | null;
        status: string;
        invoiceId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
    }>;
    getOrder(orderId: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            status: string;
            notes: string | null;
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
            firstVisitAt: Date | null;
            lastVisitAt: Date | null;
        };
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            guestCode: string | null;
            status: string;
            notes: string | null;
            sessionType: string;
            roomId: string | null;
            startTime: Date;
            endTime: Date | null;
            durationMinutes: number | null;
            chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
            openedByUserId: string;
            closedByUserId: string | null;
        } | null;
        createdByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                category: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
                imageUrl: string | null;
                availability: boolean;
                active: boolean;
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        guestCode: string | null;
        status: string;
        invoiceId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
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
    updateOrderStatus(orderId: string, updateStatusDto: UpdateBarOrderStatusDto, userId: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            status: string;
            notes: string | null;
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
            firstVisitAt: Date | null;
            lastVisitAt: Date | null;
        };
        items: ({
            product: {
                id: string;
                name: string;
                category: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
                imageUrl: string | null;
                availability: boolean;
                active: boolean;
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        guestCode: string | null;
        status: string;
        invoiceId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
    }>;
    cancelOrder(orderId: string, userId: string, _reason?: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
            status: string;
            notes: string | null;
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
            firstVisitAt: Date | null;
            lastVisitAt: Date | null;
        };
        items: ({
            product: {
                id: string;
                name: string;
                category: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                costPrice: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
                imageUrl: string | null;
                availability: boolean;
                active: boolean;
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        guestCode: string | null;
        status: string;
        invoiceId: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
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

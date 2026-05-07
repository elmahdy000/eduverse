import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBarOrderDto, UpdateBarOrderStatusDto } from './dto/bar-order.dto';
import { InventoryService } from '../inventory/inventory.service';
export declare class BarOrdersService {
    private prisma;
    private inventoryService;
    constructor(prisma: PrismaService, inventoryService: InventoryService);
    createOrder(createBarOrderDto: CreateBarOrderDto, userId?: string): Promise<{
        session: {
            id: string;
            guestCode: string | null;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            sessionType: string;
            roomId: string | null;
            startTime: Date;
            endTime: Date | null;
            durationMinutes: number | null;
            chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
            openedByUserId: string;
            closedByUserId: string | null;
        } | null;
        customer: {
            id: string;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                category: string;
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
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        guestCode: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        invoiceId: string | null;
    }>;
    createOrderByGuestCode(guestCode: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
        session: {
            id: string;
            guestCode: string | null;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            sessionType: string;
            roomId: string | null;
            startTime: Date;
            endTime: Date | null;
            durationMinutes: number | null;
            chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
            openedByUserId: string;
            closedByUserId: string | null;
        } | null;
        customer: {
            id: string;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                category: string;
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
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        guestCode: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        invoiceId: string | null;
    }>;
    getOrder(orderId: string): Promise<{
        session: {
            id: string;
            guestCode: string | null;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            sessionType: string;
            roomId: string | null;
            startTime: Date;
            endTime: Date | null;
            durationMinutes: number | null;
            chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
            openedByUserId: string;
            closedByUserId: string | null;
        } | null;
        customer: {
            id: string;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
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
        createdByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                category: string;
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
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        guestCode: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
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
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                category: string;
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
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        guestCode: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
        invoiceId: string | null;
    }>;
    cancelOrder(orderId: string, _reason?: string): Promise<{
        customer: {
            id: string;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            createdByUserId: string;
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                category: string;
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
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        guestCode: string | null;
        status: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        sessionId: string | null;
        customerId: string;
        createdByUserId: string | null;
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

import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBarOrderDto, UpdateBarOrderStatusDto } from './dto/bar-order.dto';
export declare class BarOrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    createOrder(createBarOrderDto: CreateBarOrderDto, userId?: string): Promise<{
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
        items: ({
            product: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                active: boolean;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        status: string;
        updatedAt: Date;
        notes: string | null;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
    }>;
    createOrderByGuestCode(guestCode: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
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
        items: ({
            product: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                active: boolean;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        status: string;
        updatedAt: Date;
        notes: string | null;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
    }>;
    getOrder(orderId: string): Promise<{
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
        createdByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
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
        items: ({
            product: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                active: boolean;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        status: string;
        updatedAt: Date;
        notes: string | null;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
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
        items: ({
            product: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                active: boolean;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        status: string;
        updatedAt: Date;
        notes: string | null;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
    }>;
    cancelOrder(orderId: string, _reason?: string): Promise<{
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
        items: ({
            product: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                active: boolean;
                category: string;
                price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        status: string;
        updatedAt: Date;
        notes: string | null;
        createdByUserId: string | null;
        guestCode: string | null;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        sessionId: string | null;
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

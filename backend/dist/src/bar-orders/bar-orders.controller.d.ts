import { CreateBarOrderDto, UpdateBarOrderStatusDto } from './dto/bar-order.dto';
import { BarOrdersService } from './bar-orders.service';
export declare class BarOrdersController {
    private barOrdersService;
    constructor(barOrdersService: BarOrdersService);
    createOrder(createBarOrderDto: CreateBarOrderDto, req: any): Promise<{
        success: boolean;
        data: {
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
            } | null;
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
                subtotal: import("@prisma/client/runtime/library").Decimal;
                productId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            createdByUserId: string;
            customerId: string | null;
            sessionId: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        };
        timestamp: string;
    }>;
    getOrder(orderId: string): Promise<{
        success: boolean;
        data: {
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
            } | null;
            createdByUser: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
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
                subtotal: import("@prisma/client/runtime/library").Decimal;
                productId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            createdByUserId: string;
            customerId: string | null;
            sessionId: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        };
        timestamp: string;
    }>;
    listOrders(page?: string, limit?: string, status?: string, sessionId?: string, customerId?: string): Promise<{
        success: boolean;
        data: {
            data: any[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
    updateStatus(orderId: string, updateStatusDto: UpdateBarOrderStatusDto): Promise<{
        success: boolean;
        data: {
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
                subtotal: import("@prisma/client/runtime/library").Decimal;
                productId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            createdByUserId: string;
            customerId: string | null;
            sessionId: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        };
        message: string;
        timestamp: string;
    }>;
    cancelOrder(orderId: string, reason?: string): Promise<{
        success: boolean;
        data: {
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
                subtotal: import("@prisma/client/runtime/library").Decimal;
                productId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            createdByUserId: string;
            customerId: string | null;
            sessionId: string | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal | null;
        };
        message: string;
        timestamp: string;
    }>;
}

import { CreateBarOrderDto, UpdateBarOrderStatusDto } from './dto/bar-order.dto';
import { BarOrdersService } from './bar-orders.service';
import { BarOrdersGateway } from './bar-orders.gateway';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class BarOrdersController {
    private barOrdersService;
    private barOrdersGateway;
    private prisma;
    constructor(barOrdersService: BarOrdersService, barOrdersGateway: BarOrdersGateway, prisma: PrismaService);
    private assertCanMutateOrder;
    createOrder(createBarOrderDto: CreateBarOrderDto, req: any): Promise<{
        success: boolean;
        data: {
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
        };
        timestamp: string;
    }>;
    getOrder(orderId: string): Promise<{
        success: boolean;
        data: {
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
    updateStatus(orderId: string, updateStatusDto: UpdateBarOrderStatusDto, req: any): Promise<{
        success: boolean;
        data: {
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
        };
        message: string;
        timestamp: string;
    }>;
    cancelOrder(orderId: string, reason?: string, req?: any): Promise<{
        success: boolean;
        data: {
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
        };
        message: string;
        timestamp: string;
    }>;
}

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
        };
        timestamp: string;
    }>;
    getOrder(orderId: string): Promise<{
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
        };
        message: string;
        timestamp: string;
    }>;
    cancelOrder(orderId: string, reason?: string, req?: any): Promise<{
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
        };
        message: string;
        timestamp: string;
    }>;
}

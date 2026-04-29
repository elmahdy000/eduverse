import { DashboardsService } from './dashboards.service';
export declare class DashboardsController {
    private dashboardsService;
    constructor(dashboardsService: DashboardsService);
    getOwnerDashboard(): Promise<{
        success: boolean;
        data: {
            activeCustomersNow: number;
            activeSessionsNow: number;
            occupiedRoomsNow: number;
            todayBookings: number;
            currentBarOrders: number;
            todayRevenue: number;
            invoicesToday: number;
            paymentsTodayAmount: number;
            yesterdayRevenue: number;
            weekRevenue: number;
            revenueTrend: number | null;
            avgSessionMinutes: number | null;
            dailyRevenue: Record<string, number>;
            totalCustomers: number;
            newCustomersToday: number;
            topProducts: {
                productName: string;
                quantity: number;
                revenue: number;
            }[];
            operationalAlerts: string[];
        };
        timestamp: string;
    }>;
    getOperationsDashboard(): Promise<{
        success: boolean;
        data: {
            activeSessions: ({
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
                room: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    status: string;
                    updatedAt: Date;
                    notes: string | null;
                    roomType: string;
                    capacity: number;
                    features: string[];
                    hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
                    dailyRate: import("@prisma/client/runtime/library").Decimal | null;
                } | null;
            } & {
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
            })[];
            roomOccupancy: {
                roomId: any;
                roomName: any;
                roomType: any;
                status: any;
                capacity: any;
                activeSessions: number;
                isOccupied: boolean;
            }[];
            roomStats: {
                total: number;
                available: number;
                occupied: number;
                offline: number;
            };
            upcomingBookings: ({
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
                room: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    status: string;
                    updatedAt: Date;
                    notes: string | null;
                    roomType: string;
                    capacity: number;
                    features: string[];
                    hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
                    dailyRate: import("@prisma/client/runtime/library").Decimal | null;
                };
            } & {
                id: string;
                createdAt: Date;
                status: string;
                updatedAt: Date;
                notes: string | null;
                createdByUserId: string;
                startTime: Date;
                endTime: Date;
                customerId: string;
                roomId: string;
                bookingType: string;
                participantCount: number | null;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                depositAmount: import("@prisma/client/runtime/library").Decimal | null;
            })[];
            pendingBarOrders: ({
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
            })[];
            urgentOrderMinutes: number | null;
            alerts: string[];
        };
        timestamp: string;
    }>;
    getReceptionDashboard(): Promise<{
        success: boolean;
        data: {
            activeSessionCount: number;
            recentCustomers: {
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
            }[];
            todayInvoicesCount: number;
            todayRevenuePartial: number;
            activeSessions: ({
                customer: {
                    fullName: string;
                    customerType: string;
                };
                room: {
                    name: string;
                } | null;
            } & {
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
            })[];
            todayBarOrders: number;
        };
        timestamp: string;
    }>;
    getBaristaDashboard(): Promise<{
        success: boolean;
        data: {
            newOrders: any[];
            inPreparationOrders: any[];
            readyOrders: ({
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
            })[];
            deliveredTodayCount: number;
            counts: {
                new: number;
                inPreparation: number;
                ready: number;
            };
        };
        timestamp: string;
    }>;
    getOperationsByRole(): Promise<{
        success: boolean;
        data: {
            operationsByRole: {
                role: string;
                userCount: number;
                totalOperations: number;
                actionCounts: Record<string, number>;
                recentLogs: {
                    id: string;
                    action: string;
                    entityType: string;
                    entityId: string;
                    oldValue: import("@prisma/client/runtime/library").JsonValue;
                    newValue: import("@prisma/client/runtime/library").JsonValue;
                    timestamp: Date;
                    user: {
                        id: string;
                        email: string;
                        firstName: string | null;
                        lastName: string | null;
                    };
                }[];
            }[];
            totalOperationsToday: number;
        };
        timestamp: string;
    }>;
}

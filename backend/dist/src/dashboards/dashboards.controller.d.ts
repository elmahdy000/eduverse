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
            activeSessions: {
                customer: {
                    id: string;
                    fullName: string;
                    customerType: string;
                };
                id: string;
                status: string;
                room: {
                    id: string;
                    name: string;
                    roomType: string;
                } | null;
                startTime: Date;
                guestCode: string | null;
            }[];
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
            upcomingBookings: {
                customer: {
                    id: string;
                    fullName: string;
                };
                id: string;
                status: string;
                room: {
                    id: string;
                    name: string;
                };
                startTime: Date;
                endTime: Date;
            }[];
            pendingBarOrders: {
                customer: {
                    id: string;
                    fullName: string;
                };
                id: string;
                status: string;
                createdAt: Date;
                items: {
                    id: string;
                    product: {
                        id: string;
                        name: string;
                        category: string;
                    };
                    quantity: number;
                }[];
            }[];
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
                        category: string;
                        price: import("@prisma/client/runtime/library").Decimal;
                        costPrice: import("@prisma/client/runtime/library").Decimal;
                        imageUrl: string | null;
                        availability: boolean;
                    };
                } & {
                    id: string;
                    quantity: number;
                    productId: string;
                    unitPrice: import("@prisma/client/runtime/library").Decimal;
                    subtotal: import("@prisma/client/runtime/library").Decimal;
                    orderId: string;
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

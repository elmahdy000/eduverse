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
                endTime: Date | null;
                customerId: string;
                sessionType: string;
                roomId: string | null;
                startTime: Date;
                durationMinutes: number | null;
                chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
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
                endTime: Date;
                customerId: string;
                roomId: string;
                startTime: Date;
                totalAmount: import("@prisma/client/runtime/library").Decimal;
                bookingType: string;
                participantCount: number | null;
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
                endTime: Date | null;
                customerId: string;
                sessionType: string;
                roomId: string | null;
                startTime: Date;
                durationMinutes: number | null;
                chargeAmount: import("@prisma/client/runtime/library").Decimal | null;
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
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCustomer(createCustomerDto, userId) {
        const customer = await this.prisma.customer.create({
            data: {
                ...createCustomerDto,
                createdByUserId: userId,
                firstVisitAt: new Date(),
                lastVisitAt: new Date(),
            },
        });
        return customer;
    }
    async getCustomer(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer;
    }
    async searchCustomers(page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search?.name) {
            where.fullName = { contains: search.name, mode: 'insensitive' };
        }
        if (search?.phone) {
            where.OR = [
                { phoneNumber: { contains: search.phone, mode: 'insensitive' } },
                { phoneNumberSecondary: { contains: search.phone, mode: 'insensitive' } },
            ];
        }
        if (search?.email) {
            where.email = { contains: search.email, mode: 'insensitive' };
        }
        if (search?.customerType) {
            where.customerType = search.customerType;
        }
        if (search?.college) {
            where.college = { contains: search.college, mode: 'insensitive' };
        }
        if (search?.employerName) {
            where.employerName = { contains: search.employerName, mode: 'insensitive' };
        }
        const [customers, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count({ where }),
        ]);
        const hasMore = skip + customers.length < total;
        return {
            data: customers,
            total,
            page,
            limit,
            hasMore,
        };
    }
    async updateCustomer(customerId, updateCustomerDto) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        const updatedCustomer = await this.prisma.customer.update({
            where: { id: customerId },
            data: updateCustomerDto,
        });
        return updatedCustomer;
    }
    async getCustomerHistory(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                sessions: {
                    where: { status: 'closed' },
                    orderBy: { endTime: 'desc' },
                    take: 50,
                },
                invoices: {
                    orderBy: { issuedAt: 'desc' },
                    take: 50,
                },
                bookings: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
                barOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        return {
            customer,
            sessionsCount: customer.sessions.length,
            invoicesCount: customer.invoices.length,
            bookingsCount: customer.bookings.length,
            barOrdersCount: customer.barOrders.length,
            totalSpent: customer.invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0),
        };
    }
    async getActiveSession(customerId) {
        const session = await this.prisma.session.findFirst({
            where: {
                customerId,
                status: 'active',
            },
            include: {
                room: true,
                barOrders: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return session || null;
    }
    async deactivateCustomer(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        return await this.prisma.customer.update({
            where: { id: customerId },
            data: { status: 'inactive' },
        });
    }
    async blacklistCustomer(customerId, reason) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        return await this.prisma.customer.update({
            where: { id: customerId },
            data: { status: 'blacklisted', notes: `Blacklisted: ${reason}` },
        });
    }
    async reactivateCustomer(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new Error('Customer not found');
        }
        return await this.prisma.customer.update({
            where: { id: customerId },
            data: { status: 'active' },
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map
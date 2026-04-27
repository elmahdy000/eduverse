import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  SearchCustomerDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
    userId: string,
  ) {
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

  async getCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async searchCustomers(
    page: number = 1,
    limit: number = 20,
    search?: SearchCustomerDto,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

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

  async updateCustomer(
    customerId: string,
    updateCustomerDto: UpdateCustomerDto,
  ) {
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

  async getCustomerHistory(customerId: string) {
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
      totalSpent: customer.invoices.reduce(
        (sum, inv) => sum + Number(inv.amountPaid),
        0,
      ),
    };
  }

  async getActiveSession(customerId: string) {
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

  async deactivateCustomer(customerId: string) {
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

  async blacklistCustomer(customerId: string, reason: string) {
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

  async reactivateCustomer(customerId: string) {
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
}

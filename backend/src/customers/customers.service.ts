import { Injectable, NotFoundException } from '@nestjs/common';
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
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async searchCustomers(
    page: any = 1,
    limit: any = 20,
    search?: SearchCustomerDto,
  ) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    const conditions: any[] = [];

    if (search?.name) {
      const query = search.name.trim();
      const nameConditions = this.buildArabicSearchConditions('fullName', query);
      conditions.push({
        OR: [
          ...nameConditions,
          { phoneNumber: { contains: query, mode: 'insensitive' } },
          { phoneNumberSecondary: { contains: query, mode: 'insensitive' } },
        ]
      });
    }

    if (search?.phone) {
      const query = search.phone.trim();
      conditions.push({
        OR: [
          { phoneNumber: { contains: query, mode: 'insensitive' } },
          { phoneNumberSecondary: { contains: query, mode: 'insensitive' } },
        ]
      });
    }

    if (search?.email) {
      conditions.push({ email: { contains: search.email, mode: 'insensitive' } });
    }
    if (search?.customerType) {
      const types = search.customerType.split(",").map((t) => t.trim());
      conditions.push(types.length > 1 ? { customerType: { in: types } } : { customerType: types[0] });
    }
    if (search?.college) {
      conditions.push({ college: { contains: search.college, mode: 'insensitive' } });
    }
    if (search?.employerName) {
      conditions.push({ employerName: { contains: search.employerName, mode: 'insensitive' } });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const hasMore = skip + customers.length < total;

    return {
      data: customers,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore,
    };
  }

  private buildArabicSearchConditions(fieldName: string, searchStr: string) {
    const normalized = searchStr.trim();
    if (!normalized) return [];

    const terms = new Set<string>();
    terms.add(normalized);

    const replaceAll = (str: string, from: string[], to: string) => {
      let current = str;
      for (const f of from) {
        current = current.split(f).join(to);
      }
      return current;
    };

    const alifs = ['أ', 'إ', 'آ', 'ا'];
    const yas = ['ي', 'ى'];
    const tas = ['ة', 'ه'];

    let base = normalized;
    base = replaceAll(base, alifs, 'ا');
    base = replaceAll(base, yas, 'ي');
    base = replaceAll(base, tas, 'ه');

    const spaceVariations = [base];
    if (base.includes('عبد ')) {
      spaceVariations.push(base.replace('عبد ', 'عبد'));
    }
    if (base.includes('عبد') && !base.includes('عبد ')) {
      spaceVariations.push(base.replace('عبد', 'عبد '));
    }

    const finalTerms = new Set<string>([normalized]);
    
    for (const sv of spaceVariations) {
      finalTerms.add(sv);
      for (const a of alifs) {
        if (sv.startsWith('ا') || sv.startsWith('أ') || sv.startsWith('إ') || sv.startsWith('آ')) {
          finalTerms.add(a + sv.slice(1));
        }
        const parts = sv.split(' ');
        if (parts.length > 1) {
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].startsWith('ا') || parts[i].startsWith('أ') || parts[i].startsWith('إ') || parts[i].startsWith('آ')) {
              const copy = [...parts];
              copy[i] = a + parts[i].slice(1);
              finalTerms.add(copy.join(' '));
            }
          }
        }
      }
      if (sv.endsWith('ي') || sv.endsWith('ى')) {
        for (const y of yas) {
          finalTerms.add(sv.slice(0, -1) + y);
        }
      }
      if (sv.endsWith('ة') || sv.endsWith('ه')) {
        for (const t of tas) {
          finalTerms.add(sv.slice(0, -1) + t);
        }
      }
    }

    return Array.from(finalTerms).map(term => ({
      [fieldName]: { contains: term, mode: 'insensitive' }
    }));
  }

  async updateCustomer(
    customerId: string,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
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
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
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
      throw new NotFoundException('Customer not found');
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
      throw new NotFoundException('Customer not found');
    }

    const blacklistNote = `[${new Date().toISOString().slice(0, 10)}] القائمة السوداء: ${reason}`;
    const updatedNotes = customer.notes
      ? `${customer.notes}\n${blacklistNote}`
      : blacklistNote;

    return await this.prisma.customer.update({
      where: { id: customerId },
      data: { status: 'blacklisted', notes: updatedNotes },
    });
  }

  async reactivateCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return await this.prisma.customer.update({
      where: { id: customerId },
      data: { status: 'active' },
    });
  }
}

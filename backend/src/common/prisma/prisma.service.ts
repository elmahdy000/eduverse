import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    // Graceful connect with error handling - catch migration warnings
    try {
      await this.$connect();
    } catch (e: any) {
      // Allow connection even with migration warnings
      console.warn('Prisma connect warning:', e.message?.substring(0, 100));
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

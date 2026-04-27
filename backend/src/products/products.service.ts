import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(createProductDto: CreateProductDto) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        name: { equals: createProductDto.name, mode: 'insensitive' },
        active: true,
      },
    });

    if (existingProduct) {
      throw new Error('Active product with this name already exists');
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        availability: createProductDto.availability ?? true,
        active: true,
      },
    });
  }

  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async listProducts(
    page: number = 1,
    limit: number = 20,
    filters?: {
      category?: string;
      availability?: boolean;
      active?: boolean;
      q?: string;
    },
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
    if (filters?.category) {
      where.category = filters.category;
    }
    if (typeof filters?.availability === 'boolean') {
      where.availability = filters.availability;
    }
    if (typeof filters?.active === 'boolean') {
      where.active = filters.active;
    }
    if (filters?.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + products.length < total,
    };
  }

  async updateProduct(productId: string, updateProductDto: UpdateProductDto) {
    await this.getProduct(productId);

    if (updateProductDto.name) {
      const existingByName = await this.prisma.product.findFirst({
        where: {
          id: { not: productId },
          name: { equals: updateProductDto.name, mode: 'insensitive' },
          active: true,
        },
      });

      if (existingByName) {
        throw new Error('Another active product already uses this name');
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: updateProductDto,
    });
  }

  async deactivateProduct(productId: string) {
    await this.getProduct(productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { active: false, availability: false },
    });
  }

  async reactivateProduct(productId: string) {
    await this.getProduct(productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { active: true, availability: true },
    });
  }
}

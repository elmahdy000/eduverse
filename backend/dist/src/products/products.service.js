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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProduct(createProductDto) {
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
    async getProduct(productId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }
    async listProducts(page = 1, limit = 20, filters) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const safePage = Math.max(page, 1);
        const skip = (safePage - 1) * safeLimit;
        const where = {};
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
    async updateProduct(productId, updateProductDto) {
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
    async deactivateProduct(productId) {
        await this.getProduct(productId);
        return this.prisma.product.update({
            where: { id: productId },
            data: { active: false, availability: false },
        });
    }
    async reactivateProduct(productId) {
        await this.getProduct(productId);
        return this.prisma.product.update({
            where: { id: productId },
            data: { active: true, availability: true },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map
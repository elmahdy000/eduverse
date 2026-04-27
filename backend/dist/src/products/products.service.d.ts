import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    createProduct(createProductDto: CreateProductDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        availability: boolean;
    }>;
    getProduct(productId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        availability: boolean;
    }>;
    listProducts(page?: number, limit?: number, filters?: {
        category?: string;
        availability?: boolean;
        active?: boolean;
        q?: string;
    }): Promise<{
        data: {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            active: boolean;
            category: string;
            price: import("@prisma/client/runtime/library").Decimal;
            availability: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    updateProduct(productId: string, updateProductDto: UpdateProductDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        availability: boolean;
    }>;
    deactivateProduct(productId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        availability: boolean;
    }>;
    reactivateProduct(productId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        availability: boolean;
    }>;
}

import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    createProduct(createProductDto: CreateProductDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        active: boolean;
        costPrice: import("@prisma/client/runtime/library").Decimal;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
        availability: boolean;
    }>;
    getProduct(productId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        active: boolean;
        costPrice: import("@prisma/client/runtime/library").Decimal;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            active: boolean;
            costPrice: import("@prisma/client/runtime/library").Decimal;
            category: string;
            price: import("@prisma/client/runtime/library").Decimal;
            imageUrl: string | null;
            availability: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    updateProduct(productId: string, updateProductDto: UpdateProductDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        active: boolean;
        costPrice: import("@prisma/client/runtime/library").Decimal;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
        availability: boolean;
    }>;
    deactivateProduct(productId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        active: boolean;
        costPrice: import("@prisma/client/runtime/library").Decimal;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
        availability: boolean;
    }>;
    reactivateProduct(productId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        active: boolean;
        costPrice: import("@prisma/client/runtime/library").Decimal;
        category: string;
        price: import("@prisma/client/runtime/library").Decimal;
        imageUrl: string | null;
        availability: boolean;
    }>;
}

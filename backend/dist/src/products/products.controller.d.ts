import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    createProduct(createProductDto: CreateProductDto): Promise<{
        success: boolean;
        data: {
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
        timestamp: string;
    }>;
    getProduct(productId: string): Promise<{
        success: boolean;
        data: {
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
        timestamp: string;
    }>;
    listProducts(page?: string, limit?: string, category?: string, availability?: string, active?: string, q?: string): Promise<{
        success: boolean;
        data: {
            data: {
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
            }[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
    updateProduct(productId: string, updateProductDto: UpdateProductDto): Promise<{
        success: boolean;
        data: {
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
        timestamp: string;
    }>;
    deactivateProduct(productId: string): Promise<{
        success: boolean;
        data: {
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
        message: string;
        timestamp: string;
    }>;
    reactivateProduct(productId: string): Promise<{
        success: boolean;
        data: {
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
        message: string;
        timestamp: string;
    }>;
}

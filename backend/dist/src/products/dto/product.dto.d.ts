export declare class CreateProductDto {
    name: string;
    category: string;
    price: number;
    description?: string;
    imageUrl?: string;
    availability?: boolean;
}
export declare class UpdateProductDto {
    name?: string;
    category?: string;
    price?: number;
    description?: string;
    imageUrl?: string;
    availability?: boolean;
    active?: boolean;
}

export declare class CreateProductDto {
    name: string;
    category: string;
    price: number;
    description?: string;
    availability?: boolean;
}
export declare class UpdateProductDto {
    name?: string;
    category?: string;
    price?: number;
    description?: string;
    availability?: boolean;
    active?: boolean;
}

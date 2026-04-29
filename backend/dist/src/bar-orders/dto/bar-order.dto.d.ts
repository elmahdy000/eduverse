export declare class CreateBarOrderItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateBarOrderDto {
    sessionId?: string;
    customerId: string;
    items: CreateBarOrderItemDto[];
    notes?: string;
    guestCode?: string;
}
export declare class UpdateBarOrderStatusDto {
    status: string;
}

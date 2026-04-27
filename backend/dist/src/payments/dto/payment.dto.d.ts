export declare class RecordPaymentDto {
    invoiceId: string;
    paymentMethod: string;
    amount: number;
    notes?: string;
}
export declare class RefundPaymentDto {
    amount?: number;
    reason?: string;
}

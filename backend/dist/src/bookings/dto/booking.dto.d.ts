export declare class CreateBookingDto {
    customerId: string;
    roomId: string;
    bookingType: string;
    startTime: string;
    endTime: string;
    participantCount?: number;
    totalAmount: number;
    depositAmount?: number;
    notes?: string;
}
export declare class UpdateBookingDto {
    roomId?: string;
    startTime?: string;
    endTime?: string;
    participantCount?: number;
    totalAmount?: number;
    depositAmount?: number;
    status?: string;
    notes?: string;
}
export declare class BookingConflictQueryDto {
    roomId: string;
    startTime: string;
    endTime: string;
    excludeBookingId?: string;
}

export declare class CreateSessionDto {
    customerId: string;
    sessionType: 'hourly' | 'daily' | 'package' | 'booking_linked';
    roomId?: string;
    chargeAmount?: number;
    notes?: string;
}
export declare class CloseSessionDto {
    notes?: string;
}
export declare class SessionResponseDto {
    id: string;
    customerId: string;
    sessionType: string;
    roomId?: string;
    startTime: Date;
    endTime?: Date;
    durationMinutes?: number;
    status: string;
    chargeAmount?: number;
    notes?: string;
    createdAt: Date;
}

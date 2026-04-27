export declare class CreateRoomDto {
    name: string;
    roomType: string;
    capacity: number;
    features?: string[];
    hourlyRate?: number;
    dailyRate?: number;
    notes?: string;
}
export declare class UpdateRoomDto {
    name?: string;
    capacity?: number;
    features?: string[];
    hourlyRate?: number;
    dailyRate?: number;
    status?: string;
    notes?: string;
}
export declare class RoomAvailabilityDto {
    startTime: string;
    endTime: string;
}
export declare class RoomResponseDto {
    id: string;
    name: string;
    roomType: string;
    capacity: number;
    features?: string[];
    hourlyRate?: number;
    dailyRate?: number;
    status: string;
    notes?: string;
    createdAt: Date;
}

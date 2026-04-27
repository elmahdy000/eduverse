import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { RoomsService } from './rooms.service';
export declare class RoomsController {
    private roomsService;
    constructor(roomsService: RoomsService);
    createRoom(createRoomDto: CreateRoomDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            roomType: string;
            capacity: number;
            features: string[];
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        };
        timestamp: string;
    }>;
    getAvailability(startTime: string, endTime: string, minCapacity?: string): Promise<{
        success: boolean;
        data: {
            data: {
                id: string;
                name: string;
                createdAt: Date;
                status: string;
                updatedAt: Date;
                notes: string | null;
                roomType: string;
                capacity: number;
                features: string[];
                hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
                dailyRate: import("@prisma/client/runtime/library").Decimal | null;
            }[];
            total: number;
            unavailableRoomIds: string[];
            query: {
                startTime: Date;
                endTime: Date;
                minCapacity: number | null;
            };
        };
        timestamp: string;
    }>;
    getRoom(roomId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            roomType: string;
            capacity: number;
            features: string[];
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        };
        timestamp: string;
    }>;
    listRooms(page?: string, limit?: string, roomType?: string, status?: string, minCapacity?: string, q?: string): Promise<{
        success: boolean;
        data: {
            data: {
                id: string;
                name: string;
                createdAt: Date;
                status: string;
                updatedAt: Date;
                notes: string | null;
                roomType: string;
                capacity: number;
                features: string[];
                hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
                dailyRate: import("@prisma/client/runtime/library").Decimal | null;
            }[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
    updateRoom(roomId: string, updateRoomDto: UpdateRoomDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            roomType: string;
            capacity: number;
            features: string[];
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        };
        timestamp: string;
    }>;
    deactivateRoom(roomId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            roomType: string;
            capacity: number;
            features: string[];
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        };
        message: string;
        timestamp: string;
    }>;
    reactivateRoom(roomId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            notes: string | null;
            roomType: string;
            capacity: number;
            features: string[];
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            dailyRate: import("@prisma/client/runtime/library").Decimal | null;
        };
        message: string;
        timestamp: string;
    }>;
}

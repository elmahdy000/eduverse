import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
export declare class RoomsService {
    private prisma;
    constructor(prisma: PrismaService);
    createRoom(createRoomDto: CreateRoomDto): Promise<{
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
    }>;
    getRoom(roomId: string): Promise<{
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
    }>;
    listRooms(page?: number, limit?: number, filters?: {
        roomType?: string;
        status?: string;
        minCapacity?: number;
        q?: string;
    }): Promise<{
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
    }>;
    updateRoom(roomId: string, updateRoomDto: UpdateRoomDto): Promise<{
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
    }>;
    deactivateRoom(roomId: string): Promise<{
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
    }>;
    reactivateRoom(roomId: string): Promise<{
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
    }>;
    getAvailableRooms(startTime: Date, endTime: Date, minCapacity?: number): Promise<{
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
    }>;
}

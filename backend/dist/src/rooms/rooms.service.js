"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let RoomsService = class RoomsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRoom(createRoomDto) {
        const existingRoom = await this.prisma.room.findFirst({
            where: {
                name: {
                    equals: createRoomDto.name,
                    mode: 'insensitive',
                },
            },
        });
        if (existingRoom) {
            throw new Error('Room with this name already exists');
        }
        return this.prisma.room.create({
            data: {
                ...createRoomDto,
                features: createRoomDto.features ?? [],
            },
        });
    }
    async getRoom(roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
        });
        if (!room) {
            throw new Error('Room not found');
        }
        return room;
    }
    async listRooms(page = 1, limit = 20, filters) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const safePage = Math.max(page, 1);
        const skip = (safePage - 1) * safeLimit;
        const where = {};
        if (filters?.roomType) {
            where.roomType = filters.roomType;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.minCapacity) {
            where.capacity = { gte: filters.minCapacity };
        }
        if (filters?.q) {
            where.OR = [
                { name: { contains: filters.q, mode: 'insensitive' } },
                { notes: { contains: filters.q, mode: 'insensitive' } },
            ];
        }
        const [rooms, total] = await Promise.all([
            this.prisma.room.findMany({
                where,
                skip,
                take: safeLimit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.room.count({ where }),
        ]);
        return {
            data: rooms,
            total,
            page: safePage,
            limit: safeLimit,
            hasMore: skip + rooms.length < total,
        };
    }
    async updateRoom(roomId, updateRoomDto) {
        await this.getRoom(roomId);
        if (updateRoomDto.name) {
            const existingByName = await this.prisma.room.findFirst({
                where: {
                    id: { not: roomId },
                    name: {
                        equals: updateRoomDto.name,
                        mode: 'insensitive',
                    },
                },
            });
            if (existingByName) {
                throw new Error('Another room already uses this name');
            }
        }
        return this.prisma.room.update({
            where: { id: roomId },
            data: updateRoomDto,
        });
    }
    async deactivateRoom(roomId) {
        await this.getRoom(roomId);
        return this.prisma.room.update({
            where: { id: roomId },
            data: { status: 'out_of_service' },
        });
    }
    async reactivateRoom(roomId) {
        await this.getRoom(roomId);
        return this.prisma.room.update({
            where: { id: roomId },
            data: { status: 'available' },
        });
    }
    async getAvailableRooms(startTime, endTime, minCapacity) {
        if (startTime >= endTime) {
            throw new Error('startTime must be before endTime');
        }
        const roomWhere = {
            status: { not: 'out_of_service' },
        };
        if (minCapacity) {
            roomWhere.capacity = { gte: minCapacity };
        }
        const conflictingBookings = await this.prisma.booking.findMany({
            where: {
                status: { in: ['draft', 'confirmed'] },
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
            select: { roomId: true },
        });
        const conflictingSessions = await this.prisma.session.findMany({
            where: {
                status: 'active',
                roomId: { not: null },
                startTime: { lt: endTime },
                OR: [{ endTime: null }, { endTime: { gt: startTime } }],
            },
            select: { roomId: true },
        });
        const unavailableRoomIds = new Set();
        for (const booking of conflictingBookings) {
            unavailableRoomIds.add(booking.roomId);
        }
        for (const session of conflictingSessions) {
            if (session.roomId) {
                unavailableRoomIds.add(session.roomId);
            }
        }
        const rooms = await this.prisma.room.findMany({
            where: roomWhere,
            orderBy: [{ roomType: 'asc' }, { name: 'asc' }],
        });
        const availableRooms = rooms.filter((room) => !unavailableRoomIds.has(room.id));
        return {
            data: availableRooms,
            total: availableRooms.length,
            unavailableRoomIds: Array.from(unavailableRoomIds),
            query: { startTime, endTime, minCapacity: minCapacity ?? null },
        };
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map
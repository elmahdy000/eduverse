import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async createRoom(createRoomDto: CreateRoomDto) {
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

  async getRoom(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    return room;
  }

  async listRooms(
    page: number = 1,
    limit: number = 20,
    filters?: {
      roomType?: string;
      status?: string;
      minCapacity?: number;
      q?: string;
    },
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: any = {};
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

  async updateRoom(roomId: string, updateRoomDto: UpdateRoomDto) {
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

  async deactivateRoom(roomId: string) {
    await this.getRoom(roomId);

    return this.prisma.room.update({
      where: { id: roomId },
      data: { status: 'out_of_service' },
    });
  }

  async reactivateRoom(roomId: string) {
    await this.getRoom(roomId);

    return this.prisma.room.update({
      where: { id: roomId },
      data: { status: 'available' },
    });
  }

  async getAvailableRooms(
    startTime: Date,
    endTime: Date,
    minCapacity?: number,
  ) {
    if (startTime >= endTime) {
      throw new Error('startTime must be before endTime');
    }

    const roomWhere: any = {
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

    const unavailableRoomIds = new Set<string>();
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
}

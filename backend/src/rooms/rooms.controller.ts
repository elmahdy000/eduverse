import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create room' })
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    try {
      const room = await this.roomsService.createRoom(createRoomDto);
      return {
        success: true,
        data: room,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get available rooms for date range' })
  async getAvailability(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('minCapacity') minCapacity?: string,
  ) {
    try {
      if (!startTime || !endTime) {
        throw new Error('startTime and endTime are required');
      }

      const result = await this.roomsService.getAvailableRooms(
        new Date(startTime),
        new Date(endTime),
        minCapacity ? Number(minCapacity) : undefined,
      );
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  async getRoom(@Param('id') roomId: string) {
    try {
      const room = await this.roomsService.getRoom(roomId);
      return {
        success: true,
        data: room,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List rooms with filters' })
  async listRooms(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('roomType') roomType?: string,
    @Query('status') status?: string,
    @Query('minCapacity') minCapacity?: string,
    @Query('q') q?: string,
  ) {
    try {
      const result = await this.roomsService.listRooms(Number(page), Number(limit), {
        roomType,
        status,
        minCapacity: minCapacity ? Number(minCapacity) : undefined,
        q,
      });

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update room' })
  async updateRoom(
    @Param('id') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    try {
      const room = await this.roomsService.updateRoom(roomId, updateRoomDto);
      return {
        success: true,
        data: room,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate room (out of service)' })
  async deactivateRoom(@Param('id') roomId: string) {
    try {
      const room = await this.roomsService.deactivateRoom(roomId);
      return {
        success: true,
        data: room,
        message: 'Room set to out_of_service',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate room (available)' })
  async reactivateRoom(@Param('id') roomId: string) {
    try {
      const room = await this.roomsService.reactivateRoom(roomId);
      return {
        success: true,
        data: room,
        message: 'Room reactivated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

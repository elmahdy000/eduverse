import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import {
  CreateBookingDto,
  UpdateBookingDto,
  BookingConflictQueryDto,
} from './dto/booking.dto';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking with conflict detection' })
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: any,
  ) {
    try {
      const booking = await this.bookingsService.createBooking(
        createBookingDto,
        req.user.userId,
      );
      return {
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Check room conflicts for a time range' })
  async checkConflicts(@Query() query: BookingConflictQueryDto) {
    try {
      const result = await this.bookingsService.checkRoomConflicts(
        query.roomId,
        new Date(query.startTime),
        new Date(query.endTime),
        query.excludeBookingId,
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
  @ApiOperation({ summary: 'Get booking details' })
  async getBooking(@Param('id') bookingId: string) {
    try {
      const booking = await this.bookingsService.getBooking(bookingId);
      return {
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List bookings' })
  async listBookings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('roomId') roomId?: string,
    @Query('customerId') customerId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    try {
      const result = await this.bookingsService.listBookings(Number(page), Number(limit), {
        status,
        roomId,
        customerId,
        fromDate,
        toDate,
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
  @ApiOperation({ summary: 'Update booking details' })
  async updateBooking(
    @Param('id') bookingId: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    try {
      const booking = await this.bookingsService.updateBooking(
        bookingId,
        updateBookingDto,
      );
      return {
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  async cancelBooking(
    @Param('id') bookingId: string,
    @Body('reason') reason?: string,
  ) {
    try {
      const booking = await this.bookingsService.cancelBooking(bookingId, reason);
      return {
        success: true,
        data: booking,
        message: 'Booking cancelled',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark booking as completed' })
  async completeBooking(@Param('id') bookingId: string) {
    try {
      const booking = await this.bookingsService.completeBooking(bookingId);
      return {
        success: true,
        data: booking,
        message: 'Booking completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

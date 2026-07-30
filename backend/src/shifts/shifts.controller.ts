import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OpsManagerGuard, RoleGuard } from '../auth/role.guard';
import { CloseShiftDto, StartShiftDto } from './dto/shift.dto';

@ApiTags('shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new shift' })
  async startShift(@Body() body: StartShiftDto, @Request() req: any) {
    return this.shiftsService.startShift(
      req.user.userId,
      body.startCash,
      body.notes,
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current open shift for logged in user' })
  async getCurrentShift(@Request() req: any) {
    return this.shiftsService.getCurrentShift(req.user.userId);
  }

  @Put(':id/close')
  @ApiOperation({ summary: 'Close a shift' })
  async closeShift(
    @Param('id') shiftId: string,
    @Body() body: CloseShiftDto,
    @Request() req: any,
  ) {
    return this.shiftsService.closeShift(
      shiftId,
      body.actualCash,
      req.user,
      body.notes,
    );
  }

  @Get('summary')
  @UseGuards(OpsManagerGuard)
  @ApiOperation({
    summary: 'Get aggregate shifts summary for reports (Admin/Ops only)',
  })
  async getShiftsSummary(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.shiftsService.getShiftsSummary(fromDate, toDate);
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Get full financial shift report' })
  async getShiftReport(@Param('id') shiftId: string, @Request() req: any) {
    return this.shiftsService.getShiftReport(shiftId, req.user);
  }

  @Get()
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'List all shifts (Admin only)' })
  async listShifts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shiftsService.listShifts(page ? +page : 1, limit ? +limit : 20);
  }
}

import { Controller, Get, Post, Body, Param, UseGuards, Request, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OpsManagerGuard } from '../auth/role.guard';
import { CloseShiftDto, StartShiftDto } from './dto/shift.dto';

@ApiTags('shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new shift' })
  async startShift(@Body() body: StartShiftDto, @Request() req: any) {
    return this.shiftsService.startShift(req.user.userId, body.startCash, body.notes);
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

  @Get(':id/report')
  @ApiOperation({ summary: 'Get full financial shift report' })
  async getShiftReport(@Param('id') shiftId: string, @Request() req: any) {
    return this.shiftsService.getShiftReport(shiftId, req.user);
  }

  @Get()
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'List all shifts (Admin only)' })
  async listShifts() {
    return this.shiftsService.listShifts();
  }
}

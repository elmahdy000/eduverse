import { Controller, Get, Post, Body, Param, UseGuards, Request, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OpsManagerGuard } from '../auth/role.guard';

@ApiTags('shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new shift' })
  async startShift(@Body() body: { startCash: number; notes?: string }, @Request() req: any) {
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
    @Body() body: { actualCash: number; notes?: string }
  ) {
    return this.shiftsService.closeShift(shiftId, body.actualCash, body.notes);
  }

  @Get()
  @UseGuards(OpsManagerGuard)
  @ApiOperation({ summary: 'List all shifts (Admin only)' })
  async listShifts() {
    return this.shiftsService.listShifts();
  }
}

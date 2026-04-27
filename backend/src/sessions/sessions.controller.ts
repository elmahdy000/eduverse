import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, CloseSessionDto } from './dto/session.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Open new session for customer' })
  async openSession(
    @Body() createSessionDto: CreateSessionDto,
    @Request() req: any,
  ) {
    try {
      const session = await this.sessionsService.openSession(
        createSessionDto,
        req.user.userId,
      );
      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session details' })
  async getSession(@Param('id') sessionId: string) {
    try {
      const session = await this.sessionsService.getSession(sessionId);
      return {
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'List active sessions' })
  async listActiveSessions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    try {
      const result = await this.sessionsService.listActiveSessions(page, limit);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close session' })
  async closeSession(
    @Param('id') sessionId: string,
    @Body() closeSessionDto: CloseSessionDto,
    @Request() req: any,
  ) {
    try {
      const session = await this.sessionsService.closeSession(
        sessionId,
        closeSessionDto,
        req.user.userId,
      );
      return {
        success: true,
        data: session,
        message: 'Session closed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel session' })
  async cancelSession(@Param('id') sessionId: string, @Request() req: any) {
    try {
      const session = await this.sessionsService.cancelSession(
        sessionId,
        req.user.userId,
      );
      return {
        success: true,
        data: session,
        message: 'Session cancelled',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

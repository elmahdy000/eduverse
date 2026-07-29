import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException, HttpCode, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OwnerGuard, OpsManagerGuard, RoleGuard } from '../auth/role.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Create new user (Owner only)' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.createUser(createUserDto);
      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('roles')
  @ApiOperation({ summary: 'List all roles' })
  async listRoles() {
    try {
      const roles = await this.usersService.listRoles();
      return {
        success: true,
        data: roles,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@Request() req: any) {
    try {
      const user = await this.usersService.getUser(req.user.userId);
      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Get user by ID (Owner only)' })
  async getUser(@Param('id') userId: string) {
    try {
      const user = await this.usersService.getUser(userId);
      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'List users with pagination' })
  async listUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('email') email?: string,
    @Query('roleId') roleId?: string,
    @Query('status') status?: string,
  ) {
    try {
      const filter = { email, roleId, status };
      const result = await this.usersService.listUsers(page, limit, filter);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: 'Update user (Owner only)' })
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const user = await this.usersService.updateUser(userId, updateUserDto);
      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/change-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Param('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ) {
    const isOwner = req.user.roleName === 'Owner';
    const isSelf = req.user.userId === userId;

    if (!isSelf && !isOwner) {
      throw new BadRequestException('You can only change your own password');
    }

    try {
      const result = await this.usersService.changePassword(
        userId,
        changePasswordDto,
        isOwner,
      );
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @UseGuards(OwnerGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Deactivate user (Owner only)' })
  async deactivateUser(@Param('id') userId: string) {
    try {
      const user = await this.usersService.deactivateUser(userId);
      return {
        success: true,
        data: user,
        message: 'User deactivated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id/hard')
  @UseGuards(OwnerGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Permanently delete user (Owner only)' })
  async deleteUser(@Param('id') userId: string) {
    try {
      const result = await this.usersService.deleteUser(userId);
      return {
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/reactivate')
  @UseGuards(OwnerGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Reactivate user (Owner only)' })
  async reactivateUser(@Param('id') userId: string) {
    try {
      const user = await this.usersService.reactivateUser(userId);
      return {
        success: true,
        data: user,
        message: 'User reactivated',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}

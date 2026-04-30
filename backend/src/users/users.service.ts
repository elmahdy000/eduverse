import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PasswordService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(
      createUserDto.password,
    );

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phoneNumber: createUserDto.phoneNumber,
        roleId: createUserDto.roleId,
        status: 'active',
      },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    return this.formatUserResponse(user);
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.formatUserResponse(user);
  }

  async listUsers(page: any = 1, limit: any = 20, filter?: any) {
    const p = Math.max(1, parseInt(String(page)) || 1);
    const l = Math.max(1, parseInt(String(limit)) || 20);
    const skip = (p - 1) * l;

    const where: any = {};
    if (filter?.email) {
      where.email = { contains: filter.email, mode: 'insensitive' };
    }
    if (filter?.roleId) {
      where.roleId = filter.roleId;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          role: {
            select: { name: true },
          },
        },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const hasMore = skip + users.length < total;

    return {
      data: users.map((user) => this.formatUserResponse(user)),
      total,
      page: p,
      limit: l,
      hasMore,
    };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If roleId is being updated, verify role exists
    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new Error('Role not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    return this.formatUserResponse(updatedUser);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const passwordValid = await this.passwordService.validatePassword(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(
      changePasswordDto.newPassword,
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'inactive' },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    return this.formatUserResponse(updatedUser);
  }

  async reactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'active' },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    return this.formatUserResponse(updatedUser);
  }

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
  }

  private formatUserResponse(user: any) {
    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      isActive: user.status === 'active',
    };
  }
}

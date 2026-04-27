import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class JwtConfigService {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(userId: string, email: string, roleId: string) {
    return this.jwtService.sign(
      { sub: userId, email, roleId },
      { expiresIn: process.env.JWT_EXPIRY || '15m' },
    );
  }

  generateRefreshToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' },
    );
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verify(token);
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token);
  }
}

@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtConfig: JwtConfigService,
    private passwordService: PasswordService,
  ) {}

  async login(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Validate password
    const passwordValid = await this.passwordService.validatePassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('User account is not active');
    }

    // Generate tokens
    const accessToken = this.jwtConfig.generateAccessToken(
      user.id,
      user.email,
      user.roleId,
    );
    const refreshToken = this.jwtConfig.generateRefreshToken(user.id);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          name: user.role.name,
        },
      },
    };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    roleId: string,
  ) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        roleId,
        status: 'active',
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Generate tokens
    const accessToken = this.jwtConfig.generateAccessToken(
      user.id,
      user.email,
      user.roleId,
    );
    const refreshToken = this.jwtConfig.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          name: user.role.name,
        },
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = this.jwtConfig.verifyRefreshToken(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      const accessToken = this.jwtConfig.generateAccessToken(
        user.id,
        user.email,
        user.roleId,
      );

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            name: user.role.name,
          },
        },
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

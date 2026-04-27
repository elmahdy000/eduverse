import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, LoginResponseDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      const data = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register new user (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: LoginResponseDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    try {
      const data = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
        registerDto.roleId,
      );

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  async refresh(@Body('refreshToken') refreshToken: string) {
    try {
      const data = await this.authService.refreshAccessToken(refreshToken);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout() {
    return {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    };
  }
}

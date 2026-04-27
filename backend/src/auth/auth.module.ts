import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthService, JwtConfigService, PasswordService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRY') || '15m',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtConfigService,
    PasswordService,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtConfigService, PasswordService, PassportModule],
})
export class AuthModule {}

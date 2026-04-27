import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class JwtConfigService {
    private jwtService;
    constructor(jwtService: JwtService);
    generateAccessToken(userId: string, email: string, roleId: string): string;
    generateRefreshToken(userId: string): string;
    verifyAccessToken(token: string): any;
    verifyRefreshToken(token: string): any;
}
export declare class PasswordService {
    hashPassword(password: string): Promise<string>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
export declare class AuthService {
    private prisma;
    private jwtConfig;
    private passwordService;
    constructor(prisma: PrismaService, jwtConfig: JwtConfigService, passwordService: PasswordService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: {
                name: string;
            };
        };
    }>;
    register(email: string, password: string, firstName: string, lastName: string, roleId: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: {
                name: string;
            };
        };
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: {
                name: string;
            };
        };
    }>;
}

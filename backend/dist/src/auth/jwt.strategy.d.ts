import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: any): Promise<{
        userId: any;
        email: any;
        roleId: any;
        roleName: string | undefined;
    }>;
}
export {};

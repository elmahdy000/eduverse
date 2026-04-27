import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class RoleGuard implements CanActivate {
    private prisma;
    constructor(prisma: PrismaService);
    private resolveModule;
    private resolveAction;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class OwnerGuard implements CanActivate {
    private prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class OpsManagerGuard implements CanActivate {
    private prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class ReceptionistGuard implements CanActivate {
    private prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class BaristaGuard implements CanActivate {
    private prisma;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}

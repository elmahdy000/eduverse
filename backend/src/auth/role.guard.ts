import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  private resolveModule(request: any): string | null {
    const normalizeSegments = (value: unknown) =>
      String(value || '')
        .replace(/\?.*$/, '')
        .replace(/^\/+/, '')
        .split('/')
        .filter(Boolean);

    const pickModuleSegment = (segments: string[]) => {
      if (!segments.length) return null;
      // Routes are mounted under /api/*, so module is the next segment.
      if (segments[0] === 'api') {
        return segments[1] ?? null;
      }
      return segments[0];
    };

    const moduleName =
      pickModuleSegment(normalizeSegments(request.baseUrl)) ||
      pickModuleSegment(normalizeSegments(request.originalUrl));

    if (!moduleName) {
      return null;
    }

    return moduleName.replace(/-/g, '_');
  }

  private resolveAction(request: any, moduleName: string): string {
    const method = String(request.method || 'GET').toUpperCase();
    const routePath = String(request.route?.path || '').toLowerCase();
    const lastSegment = routePath.split('/').filter(Boolean).pop();

    if (moduleName === 'users') {
      return 'manage';
    }

    if (moduleName === 'dashboards') {
      if (routePath.includes('owner')) return 'view_owner';
      if (routePath.includes('operations-manager')) return 'view_ops_manager';
      if (routePath.includes('reception')) return 'view_reception';
      if (routePath.includes('barista')) return 'view_barista';
      return 'read';
    }

    if (lastSegment === 'cancel') return 'cancel';
    if (lastSegment === 'close') return 'close';
    if (lastSegment === 'refund') return moduleName === 'payments' ? 'record' : 'refund';

    if (method === 'GET') {
      return 'read';
    }

    if (method === 'POST') {
      if (moduleName === 'payments') return 'record';
      if (moduleName === 'invoices') return 'generate';
      return 'create';
    }

    if (method === 'PUT' || method === 'PATCH') {
      return 'update';
    }

    if (method === 'DELETE') {
      return 'delete';
    }

    return 'read';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Verify role exists and is active
    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
    });

    if (!role) {
      throw new ForbiddenException('User role not found');
    }

    if (role.name === 'Owner') {
      return true;
    }

    const moduleName = this.resolveModule(request);
    if (!moduleName) {
      return true;
    }

    const action = this.resolveAction(request, moduleName);
    const permission = await this.prisma.permission.findUnique({
      where: {
        module_action: {
          module: moduleName,
          action,
        },
      },
      select: { id: true },
    });

    if (!permission) {
      throw new ForbiddenException(
        `No permission mapping found for ${moduleName}:${action}`,
      );
    }

    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      select: {
        roleId: true,
      },
    });

    if (!rolePermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User not authenticated');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
    });

    if (!role || role.name !== 'Owner') {
      throw new ForbiddenException('Only Owner can access this resource');
    }

    return true;
  }
}

@Injectable()
export class OpsManagerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User not authenticated');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
    });

    if (!role || (role.name !== 'Owner' && role.name !== 'Operations Manager')) {
      throw new ForbiddenException(
        'Only Owner or Operations Manager can access this resource',
      );
    }

    return true;
  }
}

@Injectable()
export class ReceptionistGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User not authenticated');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
    });

    if (!role || role.name !== 'Receptionist') {
      throw new ForbiddenException(
        'Only Receptionist can access this resource',
      );
    }

    return true;
  }
}

@Injectable()
export class BaristaGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User not authenticated');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: user.roleId },
    });

    if (!role || role.name !== 'Barista') {
      throw new ForbiddenException('Only Barista can access this resource');
    }

    return true;
  }
}

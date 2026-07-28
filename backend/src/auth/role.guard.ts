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



    const actions = ['cancel', 'close', 'refund', 'complete', 'no-show', 'deactivate', 'blacklist', 'reactivate', 'items'];
    if (lastSegment && actions.includes(lastSegment)) {
      return lastSegment.replace(/-/g, '_');
    }



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

      // رفض افتراضي: لو مقدرناش نحدد الموديول، مانسمحش (deny by default)
      // بدل ما نفتح الباب لأي راوت غير متوقع.

      throw new ForbiddenException('Unable to resolve permission scope for this route');

    }



    const action = this.resolveAction(request, moduleName);



    // Receptionist: precise action-level bypass (matches roles_permissions.md)
    if (role.name === 'Receptionist') {
      const receptionist: Record<string, string[]> = {
        sessions:   ['read', 'create', 'update', 'close', 'cancel'],
        bookings:   ['read', 'create', 'update', 'cancel', 'complete', 'no_show'],
        customers:  ['read', 'create', 'update', 'deactivate', 'blacklist', 'reactivate'],
        rooms:      ['read'],
        products:   ['read', 'create', 'update', 'deactivate'],
        bar_orders: ['read', 'create', 'update', 'cancel', 'items'],
        // الريسبشن يصدر فواتير ويسجّل مدفوعات فقط — الـ refund والحذف للمالك (طبقاً للتصميم)
        invoices:   ['read', 'generate'],
        payments:   ['read', 'record'],
        expenses:   ['read', 'create', 'update', 'delete'],
        users:      ['read', 'manage'],
        dashboards: ['view_reception'],
      };
      const normalizedModule = moduleName.endsWith('s') ? moduleName : moduleName + 's';
      const allowed = receptionist[moduleName] ?? receptionist[normalizedModule];
      if (allowed && allowed.includes(action)) return true;
      throw new ForbiddenException('Insufficient permissions');
    }

    if (role.name === 'Barista') {
      const barista: Record<string, string[]> = {
        bar_orders: ['read', 'create', 'update', 'cancel', 'items'],
        products:   ['read'],
        customers:  ['read'],
        sessions:   ['read'],
        dashboards: ['view_barista'],
      };
      const normalizedModule = moduleName.endsWith('s') ? moduleName : moduleName + 's';
      const allowed = barista[moduleName] ?? barista[normalizedModule];
      if (allowed && allowed.includes(action)) return true;
      throw new ForbiddenException('Insufficient permissions');
    }

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
      throw new ForbiddenException(
        'Only Barista can access this resource',
      );
    }

    return true;
  }
}

// بوابة خاصة لبوابة أصحاب المشروع (Owner Portal)
// - منفصلة تماماً عن Owner العادي
// - تسمح فقط لمستخدمين role.name === 'OwnerPortal'
@Injectable()
export class OwnerPortalGuard implements CanActivate {
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

    if (!role || role.name !== 'OwnerPortal') {
      throw new ForbiddenException(
        'Only Owner Portal accounts can access this resource',
      );
    }

    return true;
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaristaGuard = exports.ReceptionistGuard = exports.OpsManagerGuard = exports.OwnerGuard = exports.RoleGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let RoleGuard = class RoleGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    resolveModule(request) {
        const normalizeSegments = (value) => String(value || '')
            .replace(/\?.*$/, '')
            .replace(/^\/+/, '')
            .split('/')
            .filter(Boolean);
        const pickModuleSegment = (segments) => {
            if (!segments.length)
                return null;
            if (segments[0] === 'api') {
                return segments[1] ?? null;
            }
            return segments[0];
        };
        const moduleName = pickModuleSegment(normalizeSegments(request.baseUrl)) ||
            pickModuleSegment(normalizeSegments(request.originalUrl));
        if (!moduleName) {
            return null;
        }
        return moduleName.replace(/-/g, '_');
    }
    resolveAction(request, moduleName) {
        const method = String(request.method || 'GET').toUpperCase();
        const routePath = String(request.route?.path || '').toLowerCase();
        const lastSegment = routePath.split('/').filter(Boolean).pop();
        if (moduleName === 'users') {
            return 'manage';
        }
        if (moduleName === 'dashboards') {
            if (routePath.includes('owner'))
                return 'view_owner';
            if (routePath.includes('operations-manager'))
                return 'view_ops_manager';
            if (routePath.includes('reception'))
                return 'view_reception';
            if (routePath.includes('barista'))
                return 'view_barista';
            return 'read';
        }
        if (lastSegment === 'cancel')
            return 'cancel';
        if (lastSegment === 'close')
            return 'close';
        if (lastSegment === 'refund')
            return moduleName === 'payments' ? 'record' : 'refund';
        if (method === 'GET') {
            return 'read';
        }
        if (method === 'POST') {
            if (moduleName === 'payments')
                return 'record';
            if (moduleName === 'invoices')
                return 'generate';
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
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roleId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const role = await this.prisma.role.findUnique({
            where: { id: user.roleId },
        });
        if (!role) {
            throw new common_1.ForbiddenException('User role not found');
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
            throw new common_1.ForbiddenException(`No permission mapping found for ${moduleName}:${action}`);
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
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return true;
    }
};
exports.RoleGuard = RoleGuard;
exports.RoleGuard = RoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoleGuard);
let OwnerGuard = class OwnerGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roleId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const role = await this.prisma.role.findUnique({
            where: { id: user.roleId },
        });
        if (!role || role.name !== 'Owner') {
            throw new common_1.ForbiddenException('Only Owner can access this resource');
        }
        return true;
    }
};
exports.OwnerGuard = OwnerGuard;
exports.OwnerGuard = OwnerGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OwnerGuard);
let OpsManagerGuard = class OpsManagerGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roleId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const role = await this.prisma.role.findUnique({
            where: { id: user.roleId },
        });
        if (!role || (role.name !== 'Owner' && role.name !== 'Operations Manager')) {
            throw new common_1.ForbiddenException('Only Owner or Operations Manager can access this resource');
        }
        return true;
    }
};
exports.OpsManagerGuard = OpsManagerGuard;
exports.OpsManagerGuard = OpsManagerGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OpsManagerGuard);
let ReceptionistGuard = class ReceptionistGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roleId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const role = await this.prisma.role.findUnique({
            where: { id: user.roleId },
        });
        if (!role || role.name !== 'Receptionist') {
            throw new common_1.ForbiddenException('Only Receptionist can access this resource');
        }
        return true;
    }
};
exports.ReceptionistGuard = ReceptionistGuard;
exports.ReceptionistGuard = ReceptionistGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReceptionistGuard);
let BaristaGuard = class BaristaGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roleId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const role = await this.prisma.role.findUnique({
            where: { id: user.roleId },
        });
        if (!role || role.name !== 'Barista') {
            throw new common_1.ForbiddenException('Only Barista can access this resource');
        }
        return true;
    }
};
exports.BaristaGuard = BaristaGuard;
exports.BaristaGuard = BaristaGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BaristaGuard);
//# sourceMappingURL=role.guard.js.map
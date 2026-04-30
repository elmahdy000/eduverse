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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
let UsersService = class UsersService {
    prisma;
    passwordService;
    constructor(prisma, passwordService) {
        this.prisma = prisma;
        this.passwordService = passwordService;
    }
    async createUser(createUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const role = await this.prisma.role.findUnique({
            where: { id: createUserDto.roleId },
        });
        if (!role) {
            throw new Error('Role not found');
        }
        const passwordHash = await this.passwordService.hashPassword(createUserDto.password);
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
    async getUser(userId) {
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
    async listUsers(page = 1, limit = 20, filter) {
        const p = Math.max(1, parseInt(String(page)) || 1);
        const l = Math.max(1, parseInt(String(limit)) || 20);
        const skip = (p - 1) * l;
        const where = {};
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
    async updateUser(userId, updateUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
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
    async changePassword(userId, changePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const passwordValid = await this.passwordService.validatePassword(changePasswordDto.currentPassword, user.passwordHash);
        if (!passwordValid) {
            throw new Error('Current password is incorrect');
        }
        const newPasswordHash = await this.passwordService.hashPassword(changePasswordDto.newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });
        return { message: 'Password changed successfully' };
    }
    async deactivateUser(userId) {
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
    async reactivateUser(userId) {
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
    formatUserResponse(user) {
        const { passwordHash, ...rest } = user;
        return {
            ...rest,
            isActive: user.status === 'active',
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.PasswordService])
], UsersService);
//# sourceMappingURL=users.service.js.map
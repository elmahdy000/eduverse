"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.PasswordService = exports.JwtConfigService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../common/prisma/prisma.service");
let JwtConfigService = class JwtConfigService {
    jwtService;
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    generateAccessToken(userId, email, roleId) {
        return this.jwtService.sign({ sub: userId, email, roleId }, { expiresIn: process.env.JWT_EXPIRY || '15m' });
    }
    generateRefreshToken(userId) {
        return this.jwtService.sign({ sub: userId, type: 'refresh' }, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' });
    }
    verifyAccessToken(token) {
        return this.jwtService.verify(token);
    }
    verifyRefreshToken(token) {
        return this.jwtService.verify(token);
    }
};
exports.JwtConfigService = JwtConfigService;
exports.JwtConfigService = JwtConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], JwtConfigService);
let PasswordService = class PasswordService {
    async hashPassword(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }
    async validatePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
};
exports.PasswordService = PasswordService;
exports.PasswordService = PasswordService = __decorate([
    (0, common_1.Injectable)()
], PasswordService);
let AuthService = class AuthService {
    prisma;
    jwtConfig;
    passwordService;
    constructor(prisma, jwtConfig, passwordService) {
        this.prisma = prisma;
        this.jwtConfig = jwtConfig;
        this.passwordService = passwordService;
    }
    async login(email, password) {
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
        const passwordValid = await this.passwordService.validatePassword(password, user.passwordHash);
        if (!passwordValid) {
            throw new Error('Invalid email or password');
        }
        if (user.status !== 'active') {
            throw new Error('User account is not active');
        }
        const accessToken = this.jwtConfig.generateAccessToken(user.id, user.email, user.roleId);
        const refreshToken = this.jwtConfig.generateRefreshToken(user.id);
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
    async register(email, password, firstName, lastName, roleId) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const passwordHash = await this.passwordService.hashPassword(password);
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
        const accessToken = this.jwtConfig.generateAccessToken(user.id, user.email, user.roleId);
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
    async refreshAccessToken(refreshToken) {
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
            const accessToken = this.jwtConfig.generateAccessToken(user.id, user.email, user.roleId);
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
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        JwtConfigService,
        PasswordService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
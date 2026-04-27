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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sessions_service_1 = require("./sessions.service");
const session_dto_1 = require("./dto/session.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
let SessionsController = class SessionsController {
    sessionsService;
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async openSession(createSessionDto, req) {
        try {
            const session = await this.sessionsService.openSession(createSessionDto, req.user.userId);
            return {
                success: true,
                data: session,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getSession(sessionId) {
        try {
            const session = await this.sessionsService.getSession(sessionId);
            return {
                success: true,
                data: session,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listActiveSessions(page = 1, limit = 20) {
        try {
            const result = await this.sessionsService.listActiveSessions(page, limit);
            return {
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async closeSession(sessionId, closeSessionDto, req) {
        try {
            const session = await this.sessionsService.closeSession(sessionId, closeSessionDto, req.user.userId);
            return {
                success: true,
                data: session,
                message: 'Session closed',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async cancelSession(sessionId, req) {
        try {
            const session = await this.sessionsService.cancelSession(sessionId, req.user.userId);
            return {
                success: true,
                data: session,
                message: 'Session cancelled',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Open new session for customer' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_dto_1.CreateSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "openSession", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List active sessions' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "listActiveSessions", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, swagger_1.ApiOperation)({ summary: 'Close session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, session_dto_1.CloseSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "closeSession", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "cancelSession", null);
exports.SessionsController = SessionsController = __decorate([
    (0, swagger_1.ApiTags)('sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map
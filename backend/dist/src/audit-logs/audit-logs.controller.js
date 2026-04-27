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
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
const audit_logs_service_1 = require("./audit-logs.service");
let AuditLogsController = class AuditLogsController {
    auditLogsService;
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    async getAuditLog(logId) {
        try {
            const log = await this.auditLogsService.getAuditLog(logId);
            return {
                success: true,
                data: log,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listAuditLogs(page = '1', limit = '20', entityType, entityId, userId, action, fromDate, toDate) {
        try {
            const result = await this.auditLogsService.listAuditLogs(Number(page), Number(limit), {
                entityType,
                entityId,
                userId,
                action,
                fromDate,
                toDate,
            });
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
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit log entry by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditLogsController.prototype, "getAuditLog", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs with filters' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('entityType')),
    __param(3, (0, common_1.Query)('entityId')),
    __param(4, (0, common_1.Query)('userId')),
    __param(5, (0, common_1.Query)('action')),
    __param(6, (0, common_1.Query)('fromDate')),
    __param(7, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuditLogsController.prototype, "listAuditLogs", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, swagger_1.ApiTags)('audit-logs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('audit-logs'),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map
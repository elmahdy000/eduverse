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
exports.AuditLogsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const audit_logs_service_1 = require("./audit-logs.service");
let AuditLogsInterceptor = class AuditLogsInterceptor {
    auditLogsService;
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    isMutation(method) {
        return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    }
    isUuid(value) {
        if (!value) {
            return false;
        }
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }
    resolveEntityType(baseUrl) {
        const segments = String(baseUrl || '')
            .replace(/^\/+/, '')
            .split('/')
            .filter(Boolean);
        if (!segments.length)
            return null;
        const moduleSegment = segments[0] === 'api' ? segments[1] : segments[0];
        return moduleSegment ? moduleSegment.replace(/-/g, '_') : null;
    }
    resolveEntityTypeFromUrl(url) {
        const clean = String(url || '')
            .replace(/\?.*$/, '')
            .replace(/^\/+/, '');
        const segments = clean.split('/').filter(Boolean);
        if (!segments.length)
            return null;
        const moduleSegment = segments[0] === 'api' ? segments[1] : segments[0];
        return moduleSegment ? moduleSegment.replace(/-/g, '_') : null;
    }
    resolveEntityId(request, responseBody) {
        const pathId = request?.params?.id;
        if (this.isUuid(pathId)) {
            return pathId;
        }
        const bodyId = responseBody?.data?.id;
        if (this.isUuid(bodyId)) {
            return bodyId;
        }
        return null;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = String(request?.method || 'GET');
        if (!this.isMutation(method)) {
            return next.handle();
        }
        const userId = request?.user?.userId;
        if (!this.isUuid(userId)) {
            return next.handle();
        }
        const entityType = this.resolveEntityType(request?.baseUrl) ||
            this.resolveEntityTypeFromUrl(request?.originalUrl);
        if (!entityType || entityType === 'audit_logs') {
            return next.handle();
        }
        const action = `${method.toUpperCase()} ${String(request?.originalUrl || '')}`;
        return next.handle().pipe((0, rxjs_1.tap)((responseBody) => {
            const entityId = this.resolveEntityId(request, responseBody);
            if (!entityId) {
                return;
            }
            void this.auditLogsService.createAuditLog({
                userId,
                action,
                entityType,
                entityId,
                newValue: responseBody?.data ?? null,
                ipAddress: request?.ip || null,
                userAgent: request?.headers?.['user-agent'] || null,
            });
        }));
    }
};
exports.AuditLogsInterceptor = AuditLogsInterceptor;
exports.AuditLogsInterceptor = AuditLogsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogsInterceptor);
//# sourceMappingURL=audit-logs.interceptor.js.map
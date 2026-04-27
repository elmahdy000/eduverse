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
exports.DashboardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
const dashboards_service_1 = require("./dashboards.service");
let DashboardsController = class DashboardsController {
    dashboardsService;
    constructor(dashboardsService) {
        this.dashboardsService = dashboardsService;
    }
    async getOwnerDashboard() {
        try {
            const data = await this.dashboardsService.getOwnerDashboard();
            return {
                success: true,
                data,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getOperationsDashboard() {
        try {
            const data = await this.dashboardsService.getOperationsDashboard();
            return {
                success: true,
                data,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getReceptionDashboard() {
        try {
            const data = await this.dashboardsService.getReceptionDashboard();
            return {
                success: true,
                data,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getBaristaDashboard() {
        try {
            const data = await this.dashboardsService.getBaristaDashboard();
            return {
                success: true,
                data,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.DashboardsController = DashboardsController;
__decorate([
    (0, common_1.Get)('owner'),
    (0, swagger_1.ApiOperation)({ summary: 'Owner dashboard summary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardsController.prototype, "getOwnerDashboard", null);
__decorate([
    (0, common_1.Get)('operations-manager'),
    (0, swagger_1.ApiOperation)({ summary: 'Operations manager dashboard' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardsController.prototype, "getOperationsDashboard", null);
__decorate([
    (0, common_1.Get)('reception'),
    (0, swagger_1.ApiOperation)({ summary: 'Reception dashboard context' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardsController.prototype, "getReceptionDashboard", null);
__decorate([
    (0, common_1.Get)('barista'),
    (0, swagger_1.ApiOperation)({ summary: 'Barista dashboard queue' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardsController.prototype, "getBaristaDashboard", null);
exports.DashboardsController = DashboardsController = __decorate([
    (0, swagger_1.ApiTags)('dashboards'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('dashboards'),
    __metadata("design:paramtypes", [dashboards_service_1.DashboardsService])
], DashboardsController);
//# sourceMappingURL=dashboards.controller.js.map
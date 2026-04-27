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
exports.BarOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
const bar_order_dto_1 = require("./dto/bar-order.dto");
const bar_orders_service_1 = require("./bar-orders.service");
let BarOrdersController = class BarOrdersController {
    barOrdersService;
    constructor(barOrdersService) {
        this.barOrdersService = barOrdersService;
    }
    async createOrder(createBarOrderDto, req) {
        try {
            const order = await this.barOrdersService.createOrder(createBarOrderDto, req.user.userId);
            return {
                success: true,
                data: order,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getOrder(orderId) {
        try {
            const order = await this.barOrdersService.getOrder(orderId);
            return {
                success: true,
                data: order,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listOrders(page = '1', limit = '20', status, sessionId, customerId) {
        try {
            const result = await this.barOrdersService.listOrders(Number(page), Number(limit), {
                status,
                sessionId,
                customerId,
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
    async updateStatus(orderId, updateStatusDto) {
        try {
            const order = await this.barOrdersService.updateOrderStatus(orderId, updateStatusDto);
            return {
                success: true,
                data: order,
                message: 'Order status updated',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async cancelOrder(orderId, reason) {
        try {
            const order = await this.barOrdersService.cancelOrder(orderId, reason);
            return {
                success: true,
                data: order,
                message: 'Order cancelled',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.BarOrdersController = BarOrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new bar order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bar_order_dto_1.CreateBarOrderDto, Object]),
    __metadata("design:returntype", Promise)
], BarOrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bar order details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BarOrdersController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List bar orders' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('sessionId')),
    __param(4, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BarOrdersController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bar order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bar_order_dto_1.UpdateBarOrderStatusDto]),
    __metadata("design:returntype", Promise)
], BarOrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel bar order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BarOrdersController.prototype, "cancelOrder", null);
exports.BarOrdersController = BarOrdersController = __decorate([
    (0, swagger_1.ApiTags)('bar-orders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('bar-orders'),
    __metadata("design:paramtypes", [bar_orders_service_1.BarOrdersService])
], BarOrdersController);
//# sourceMappingURL=bar-orders.controller.js.map
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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
const payment_dto_1 = require("./dto/payment.dto");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async recordPayment(recordPaymentDto, req) {
        try {
            const payment = await this.paymentsService.recordPayment(recordPaymentDto, req.user.userId);
            return {
                success: true,
                data: payment,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listPayments(page = '1', limit = '20', invoiceId, paymentMethod, fromDate, toDate) {
        try {
            const result = await this.paymentsService.listPayments(Number(page), Number(limit), {
                invoiceId,
                paymentMethod,
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
    async refundPayment(paymentId, refundDto, req) {
        try {
            const refundPayment = await this.paymentsService.refundPayment(paymentId, refundDto, req.user.userId);
            return {
                success: true,
                data: refundPayment,
                message: 'Payment refunded',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Record payment for invoice' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.RecordPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List payments' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('invoiceId')),
    __param(3, (0, common_1.Query)('paymentMethod')),
    __param(4, (0, common_1.Query)('fromDate')),
    __param(5, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Post)(':id/refund'),
    (0, swagger_1.ApiOperation)({ summary: 'Refund a payment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.RefundPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "refundPayment", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map
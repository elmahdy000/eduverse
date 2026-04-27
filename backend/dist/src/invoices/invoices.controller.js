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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
const invoice_dto_1 = require("./dto/invoice.dto");
const invoices_service_1 = require("./invoices.service");
let InvoicesController = class InvoicesController {
    invoicesService;
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    async generateInvoice(createInvoiceDto, req) {
        try {
            const invoice = await this.invoicesService.generateInvoice(createInvoiceDto, req.user.userId);
            return {
                success: true,
                data: invoice,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getInvoice(invoiceId) {
        try {
            const invoice = await this.invoicesService.getInvoice(invoiceId);
            return {
                success: true,
                data: invoice,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getPrintableInvoice(invoiceId) {
        try {
            const payload = await this.invoicesService.getInvoicePrintPayload(invoiceId);
            return {
                success: true,
                data: payload,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getInvoicePayments(invoiceId) {
        try {
            const payments = await this.invoicesService.getInvoicePayments(invoiceId);
            return {
                success: true,
                data: payments,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listInvoices(page = '1', limit = '20', customerId, paymentStatus, sessionId, fromDate, toDate) {
        try {
            const result = await this.invoicesService.listInvoices(Number(page), Number(limit), {
                customerId,
                paymentStatus,
                sessionId,
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
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate invoice for session' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invoice_dto_1.CreateInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "generateInvoice", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoice details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Get)(':id/print'),
    (0, swagger_1.ApiOperation)({ summary: 'Get printable invoice payload' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "getPrintableInvoice", null);
__decorate([
    (0, common_1.Get)(':id/payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments for an invoice' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "getInvoicePayments", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List invoices' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('customerId')),
    __param(3, (0, common_1.Query)('paymentStatus')),
    __param(4, (0, common_1.Query)('sessionId')),
    __param(5, (0, common_1.Query)('fromDate')),
    __param(6, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "listInvoices", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, swagger_1.ApiTags)('invoices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('invoices'),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map
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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customers_service_1 = require("./customers.service");
const customer_dto_1 = require("./dto/customer.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
let CustomersController = class CustomersController {
    customersService;
    constructor(customersService) {
        this.customersService = customersService;
    }
    async createCustomer(createCustomerDto, req) {
        try {
            const customer = await this.customersService.createCustomer(createCustomerDto, req.user.userId);
            return {
                success: true,
                data: customer,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getCustomer(customerId) {
        try {
            const customer = await this.customersService.getCustomer(customerId);
            return {
                success: true,
                data: customer,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async searchCustomers(page = 1, limit = 20, name, phone, email, customerType, college, employerName) {
        try {
            const search = {
                name,
                phone,
                email,
                customerType,
                college,
                employerName,
            };
            const result = await this.customersService.searchCustomers(page, limit, search);
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
    async updateCustomer(customerId, updateCustomerDto) {
        try {
            const customer = await this.customersService.updateCustomer(customerId, updateCustomerDto);
            return {
                success: true,
                data: customer,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getCustomerHistory(customerId) {
        try {
            const history = await this.customersService.getCustomerHistory(customerId);
            return {
                success: true,
                data: history,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getActiveSession(customerId) {
        try {
            const session = await this.customersService.getActiveSession(customerId);
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
    async deactivateCustomer(customerId) {
        try {
            const customer = await this.customersService.deactivateCustomer(customerId);
            return {
                success: true,
                data: customer,
                message: 'Customer deactivated',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async blacklistCustomer(customerId, reason) {
        try {
            const customer = await this.customersService.blacklistCustomer(customerId, reason);
            return {
                success: true,
                data: customer,
                message: 'Customer blacklisted',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async reactivateCustomer(customerId) {
        try {
            const customer = await this.customersService.reactivateCustomer(customerId);
            return {
                success: true,
                data: customer,
                message: 'Customer reactivated',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register new customer' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_dto_1.CreateCustomerDto, Object]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "createCustomer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getCustomer", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search customers with filters' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('name')),
    __param(3, (0, common_1.Query)('phone')),
    __param(4, (0, common_1.Query)('email')),
    __param(5, (0, common_1.Query)('customerType')),
    __param(6, (0, common_1.Query)('college')),
    __param(7, (0, common_1.Query)('employerName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "searchCustomers", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update customer information' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_dto_1.UpdateCustomerDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "updateCustomer", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer visit and transaction history' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getCustomerHistory", null);
__decorate([
    (0, common_1.Get)(':id/active-session'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active session for customer' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "getActiveSession", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate customer' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "deactivateCustomer", null);
__decorate([
    (0, common_1.Post)(':id/blacklist'),
    (0, swagger_1.ApiOperation)({ summary: 'Blacklist customer' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "blacklistCustomer", null);
__decorate([
    (0, common_1.Post)(':id/reactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Reactivate customer' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "reactivateCustomer", null);
exports.CustomersController = CustomersController = __decorate([
    (0, swagger_1.ApiTags)('customers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map
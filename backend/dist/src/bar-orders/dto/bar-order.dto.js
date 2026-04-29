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
exports.UpdateBarOrderStatusDto = exports.CreateBarOrderDto = exports.CreateBarOrderItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateBarOrderItemDto {
    productId;
    quantity;
}
exports.CreateBarOrderItemDto = CreateBarOrderItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBarOrderItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateBarOrderItemDto.prototype, "quantity", void 0);
class CreateBarOrderDto {
    sessionId;
    customerId;
    items;
    notes;
    guestCode;
}
exports.CreateBarOrderDto = CreateBarOrderDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBarOrderDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBarOrderDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateBarOrderItemDto),
    __metadata("design:type", Array)
], CreateBarOrderDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBarOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBarOrderDto.prototype, "guestCode", void 0);
class UpdateBarOrderStatusDto {
    status;
}
exports.UpdateBarOrderStatusDto = UpdateBarOrderStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['new', 'in_preparation', 'ready', 'delivered', 'cancelled']),
    __metadata("design:type", String)
], UpdateBarOrderStatusDto.prototype, "status", void 0);
//# sourceMappingURL=bar-order.dto.js.map
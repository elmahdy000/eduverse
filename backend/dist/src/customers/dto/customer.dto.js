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
exports.CustomersListResponseDto = exports.CustomerResponseDto = exports.SearchCustomerDto = exports.UpdateCustomerDto = exports.CreateCustomerDto = void 0;
const class_validator_1 = require("class-validator");
class CreateCustomerDto {
    fullName;
    phoneNumber;
    phoneNumberSecondary;
    email;
    address;
    customerType;
    college;
    studyLevel;
    specialization;
    employerName;
    jobTitle;
    notes;
}
exports.CreateCustomerDto = CreateCustomerDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "phoneNumberSecondary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['student', 'employee', 'trainer', 'parent', 'visitor']),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "college", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "studyLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "specialization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "employerName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "jobTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "notes", void 0);
class UpdateCustomerDto {
    fullName;
    phoneNumber;
    phoneNumberSecondary;
    email;
    address;
    college;
    studyLevel;
    specialization;
    employerName;
    jobTitle;
    notes;
    status;
}
exports.UpdateCustomerDto = UpdateCustomerDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "phoneNumberSecondary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "college", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "studyLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "specialization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "employerName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "jobTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['active', 'inactive', 'blacklisted']),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "status", void 0);
class SearchCustomerDto {
    name;
    phone;
    email;
    customerType;
    college;
    employerName;
}
exports.SearchCustomerDto = SearchCustomerDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "college", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchCustomerDto.prototype, "employerName", void 0);
class CustomerResponseDto {
    id;
    fullName;
    phoneNumber;
    phoneNumberSecondary;
    email;
    address;
    customerType;
    college;
    studyLevel;
    specialization;
    employerName;
    jobTitle;
    notes;
    status;
    firstVisitAt;
    lastVisitAt;
    createdAt;
    updatedAt;
}
exports.CustomerResponseDto = CustomerResponseDto;
class CustomersListResponseDto {
    data;
    total;
    page;
    limit;
    hasMore;
}
exports.CustomersListResponseDto = CustomersListResponseDto;
//# sourceMappingURL=customer.dto.js.map
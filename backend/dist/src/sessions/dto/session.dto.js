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
exports.SessionResponseDto = exports.CloseSessionDto = exports.CreateSessionDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSessionDto {
    customerId;
    sessionType;
    roomId;
    chargeAmount;
    notes;
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "sessionType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSessionDto.prototype, "chargeAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "notes", void 0);
class CloseSessionDto {
    notes;
}
exports.CloseSessionDto = CloseSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CloseSessionDto.prototype, "notes", void 0);
class SessionResponseDto {
    id;
    customerId;
    sessionType;
    roomId;
    startTime;
    endTime;
    durationMinutes;
    status;
    chargeAmount;
    notes;
    createdAt;
}
exports.SessionResponseDto = SessionResponseDto;
//# sourceMappingURL=session.dto.js.map
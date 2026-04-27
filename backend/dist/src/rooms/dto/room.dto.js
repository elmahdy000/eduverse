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
exports.RoomResponseDto = exports.RoomAvailabilityDto = exports.UpdateRoomDto = exports.CreateRoomDto = void 0;
const class_validator_1 = require("class-validator");
class CreateRoomDto {
    name;
    roomType;
    capacity;
    features;
    hourlyRate;
    dailyRate;
    notes;
}
exports.CreateRoomDto = CreateRoomDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['coworking', 'study', 'meeting', 'hall']),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "roomType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "capacity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateRoomDto.prototype, "features", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "hourlyRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "dailyRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "notes", void 0);
class UpdateRoomDto {
    name;
    capacity;
    features;
    hourlyRate;
    dailyRate;
    status;
    notes;
}
exports.UpdateRoomDto = UpdateRoomDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "capacity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateRoomDto.prototype, "features", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "hourlyRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "dailyRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['available', 'occupied', 'booked_soon', 'under_prep', 'out_of_service']),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "notes", void 0);
class RoomAvailabilityDto {
    startTime;
    endTime;
}
exports.RoomAvailabilityDto = RoomAvailabilityDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RoomAvailabilityDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RoomAvailabilityDto.prototype, "endTime", void 0);
class RoomResponseDto {
    id;
    name;
    roomType;
    capacity;
    features;
    hourlyRate;
    dailyRate;
    status;
    notes;
    createdAt;
}
exports.RoomResponseDto = RoomResponseDto;
//# sourceMappingURL=room.dto.js.map
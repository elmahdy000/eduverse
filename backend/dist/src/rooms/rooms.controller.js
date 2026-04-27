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
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../auth/jwt.guard");
const role_guard_1 = require("../auth/role.guard");
const room_dto_1 = require("./dto/room.dto");
const rooms_service_1 = require("./rooms.service");
let RoomsController = class RoomsController {
    roomsService;
    constructor(roomsService) {
        this.roomsService = roomsService;
    }
    async createRoom(createRoomDto) {
        try {
            const room = await this.roomsService.createRoom(createRoomDto);
            return {
                success: true,
                data: room,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getAvailability(startTime, endTime, minCapacity) {
        try {
            if (!startTime || !endTime) {
                throw new Error('startTime and endTime are required');
            }
            const result = await this.roomsService.getAvailableRooms(new Date(startTime), new Date(endTime), minCapacity ? Number(minCapacity) : undefined);
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
    async getRoom(roomId) {
        try {
            const room = await this.roomsService.getRoom(roomId);
            return {
                success: true,
                data: room,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listRooms(page = '1', limit = '20', roomType, status, minCapacity, q) {
        try {
            const result = await this.roomsService.listRooms(Number(page), Number(limit), {
                roomType,
                status,
                minCapacity: minCapacity ? Number(minCapacity) : undefined,
                q,
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
    async updateRoom(roomId, updateRoomDto) {
        try {
            const room = await this.roomsService.updateRoom(roomId, updateRoomDto);
            return {
                success: true,
                data: room,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async deactivateRoom(roomId) {
        try {
            const room = await this.roomsService.deactivateRoom(roomId);
            return {
                success: true,
                data: room,
                message: 'Room set to out_of_service',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async reactivateRoom(roomId) {
        try {
            const room = await this.roomsService.reactivateRoom(roomId);
            return {
                success: true,
                data: room,
                message: 'Room reactivated',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create room' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [room_dto_1.CreateRoomDto]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available rooms for date range' }),
    __param(0, (0, common_1.Query)('startTime')),
    __param(1, (0, common_1.Query)('endTime')),
    __param(2, (0, common_1.Query)('minCapacity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get room by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List rooms with filters' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('roomType')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('minCapacity')),
    __param(5, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "listRooms", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update room' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, room_dto_1.UpdateRoomDto]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "updateRoom", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate room (out of service)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "deactivateRoom", null);
__decorate([
    (0, common_1.Post)(':id/reactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Reactivate room (available)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "reactivateRoom", null);
exports.RoomsController = RoomsController = __decorate([
    (0, swagger_1.ApiTags)('rooms'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('rooms'),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarOrdersModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../common/prisma/prisma.module");
const bar_orders_service_1 = require("./bar-orders.service");
const bar_orders_controller_1 = require("./bar-orders.controller");
const guest_orders_controller_1 = require("./guest-orders.controller");
const products_module_1 = require("../products/products.module");
const bar_orders_gateway_1 = require("./bar-orders.gateway");
let BarOrdersModule = class BarOrdersModule {
};
exports.BarOrdersModule = BarOrdersModule;
exports.BarOrdersModule = BarOrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, products_module_1.ProductsModule],
        controllers: [bar_orders_controller_1.BarOrdersController, guest_orders_controller_1.GuestOrdersController],
        providers: [bar_orders_service_1.BarOrdersService, bar_orders_gateway_1.BarOrdersGateway],
        exports: [bar_orders_service_1.BarOrdersService, bar_orders_gateway_1.BarOrdersGateway],
    })
], BarOrdersModule);
//# sourceMappingURL=bar-orders.module.js.map
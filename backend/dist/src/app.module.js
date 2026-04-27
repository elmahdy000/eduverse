"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./common/prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const customers_module_1 = require("./customers/customers.module");
const sessions_module_1 = require("./sessions/sessions.module");
const rooms_module_1 = require("./rooms/rooms.module");
const bookings_module_1 = require("./bookings/bookings.module");
const products_module_1 = require("./products/products.module");
const bar_orders_module_1 = require("./bar-orders/bar-orders.module");
const invoices_module_1 = require("./invoices/invoices.module");
const payments_module_1 = require("./payments/payments.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const audit_logs_interceptor_1 = require("./audit-logs/audit-logs.interceptor");
const dashboards_module_1 = require("./dashboards/dashboards.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60_000,
                    limit: 1000,
                },
                {
                    name: 'auth',
                    ttl: 60_000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            customers_module_1.CustomersModule,
            sessions_module_1.SessionsModule,
            rooms_module_1.RoomsModule,
            bookings_module_1.BookingsModule,
            products_module_1.ProductsModule,
            bar_orders_module_1.BarOrdersModule,
            invoices_module_1.InvoicesModule,
            payments_module_1.PaymentsModule,
            audit_logs_module_1.AuditLogsModule,
            dashboards_module_1.DashboardsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: audit_logs_interceptor_1.AuditLogsInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
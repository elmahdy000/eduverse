"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
function readAllowedOrigins() {
    const raw = process.env.FRONTEND_ORIGINS || 'http://localhost:3000,http://localhost:3002';
    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}
function validateEnvironment() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const jwtSecret = process.env.JWT_SECRET || '';
    const databaseUrl = process.env.DATABASE_URL || '';
    if (!databaseUrl) {
        throw new Error('Missing DATABASE_URL environment variable');
    }
    if (!jwtSecret) {
        throw new Error('Missing JWT_SECRET environment variable');
    }
    if (nodeEnv === 'production' &&
        (jwtSecret === 'your_jwt_secret_change_in_production' || jwtSecret.length < 24)) {
        throw new Error('Unsafe JWT_SECRET for production. Use a strong secret with at least 24 characters.');
    }
}
async function bootstrap() {
    validateEnvironment();
    process.env.SKIP_MIGRATION = 'true';
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const allowedOrigins = readAllowedOrigins();
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('CORS origin not allowed'), false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Eduverse API')
        .setDescription('Venue Operations Platform - Phase 1')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap().catch((err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
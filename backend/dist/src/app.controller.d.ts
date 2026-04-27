import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        success: boolean;
        data: {
            status: string;
            timestamp: string;
            uptimeSeconds: number;
        };
        timestamp: string;
    };
}

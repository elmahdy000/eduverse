import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, LoginResponseDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    register(registerDto: RegisterDto): Promise<LoginResponseDto>;
    refresh(refreshToken: string): Promise<{
        success: boolean;
        data: {
            accessToken: string;
            user: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
                role: {
                    name: string;
                };
            };
        };
        timestamp: string;
    }>;
    logout(): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
}

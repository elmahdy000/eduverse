export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken?: string;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: {
            name: string;
        };
    };
}
export declare class LoginResponseDto {
    success: boolean;
    data: AuthResponseDto;
    timestamp: string;
}

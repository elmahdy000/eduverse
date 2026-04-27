export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
    phoneNumber?: string;
}
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    roleId?: string;
    phoneNumber?: string;
    status?: 'active' | 'inactive' | 'suspended';
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    status: string;
    lastLoginAt?: Date;
    createdAt: Date;
    role: {
        name: string;
    };
}
export declare class UsersListResponseDto {
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

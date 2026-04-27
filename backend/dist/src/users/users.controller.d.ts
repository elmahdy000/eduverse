import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    createUser(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    listRoles(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
        }[];
        timestamp: string;
    }>;
    getCurrentUser(req: any): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    getUser(userId: string): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    listUsers(page?: number, limit?: number, email?: string, roleId?: string, status?: string): Promise<{
        success: boolean;
        data: {
            data: any[];
            total: number;
            page: number;
            limit: number;
            hasMore: boolean;
        };
        timestamp: string;
    }>;
    updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto, req: any): Promise<{
        success: boolean;
        data: {
            message: string;
        };
        timestamp: string;
    }>;
    deactivateUser(userId: string): Promise<{
        success: boolean;
        data: any;
        message: string;
        timestamp: string;
    }>;
    reactivateUser(userId: string): Promise<{
        success: boolean;
        data: any;
        message: string;
        timestamp: string;
    }>;
}

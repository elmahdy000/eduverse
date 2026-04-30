import { PrismaService } from '../common/prisma/prisma.service';
import { PasswordService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersService {
    private prisma;
    private passwordService;
    constructor(prisma: PrismaService, passwordService: PasswordService);
    createUser(createUserDto: CreateUserDto): Promise<any>;
    getUser(userId: string): Promise<any>;
    listUsers(page?: any, limit?: any, filter?: any): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>;
    updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<any>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    deactivateUser(userId: string): Promise<any>;
    reactivateUser(userId: string): Promise<any>;
    listRoles(): Promise<{
        id: string;
        name: string;
        description: string | null;
    }[]>;
    private formatUserResponse;
}

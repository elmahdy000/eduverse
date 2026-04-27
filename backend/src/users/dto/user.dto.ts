import { IsEmail, IsNotEmpty, IsUUID, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsUUID()
  roleId: string;

  @IsOptional()
  phoneNumber?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  status?: 'active' | 'inactive' | 'suspended';
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @MinLength(6)
  currentPassword: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class UserResponseDto {
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

export class UsersListResponseDto {
  data: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

import { IsEmail, IsNotEmpty, MinLength, IsUUID } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
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
}

export class AuthResponseDto {
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

export class LoginResponseDto {
  success: boolean;
  data: AuthResponseDto;
  timestamp: string;
}

import { IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  phoneNumberSecondary?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  address?: string;

  @IsEnum(['student', 'employee', 'trainer', 'parent', 'visitor'])
  customerType: string;

  // Conditional fields for students
  @IsOptional()
  college?: string;

  @IsOptional()
  studyLevel?: string;

  @IsOptional()
  specialization?: string;

  // Conditional fields for employees
  @IsOptional()
  employerName?: string;

  @IsOptional()
  jobTitle?: string;

  @IsOptional()
  notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  @IsNotEmpty()
  phoneNumber?: string;

  @IsOptional()
  phoneNumberSecondary?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  college?: string;

  @IsOptional()
  studyLevel?: string;

  @IsOptional()
  specialization?: string;

  @IsOptional()
  employerName?: string;

  @IsOptional()
  jobTitle?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'blacklisted'])
  status?: string;
}

export class SearchCustomerDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  customerType?: string;

  @IsOptional()
  college?: string;

  @IsOptional()
  employerName?: string;
}

export class CustomerResponseDto {
  id: string;
  fullName: string;
  phoneNumber: string;
  phoneNumberSecondary?: string;
  email?: string;
  address?: string;
  customerType: string;
  college?: string;
  studyLevel?: string;
  specialization?: string;
  employerName?: string;
  jobTitle?: string;
  notes?: string;
  status: string;
  firstVisitAt?: Date;
  lastVisitAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomersListResponseDto {
  data: CustomerResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, IsDateString, IsEnum, IsBoolean } from 'class-validator';

export class CreateExpenseDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // cash, bank_transfer, card, wallet

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsUUID()
  @IsOptional()
  linkedUserId?: string; // For salaries

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  frequency?: string; // monthly, weekly, yearly

  @IsString()
  @IsOptional()
  status?: string; // paid, pending
}

export class UpdateExpenseDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsUUID()
  @IsOptional()
  linkedUserId?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  category?: string;
}

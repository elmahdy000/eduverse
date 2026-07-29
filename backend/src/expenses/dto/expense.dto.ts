import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, IsDateString, IsEnum, IsBoolean, Min } from 'class-validator';

// ── Expenses ──

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
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

  @IsEnum(['cash', 'bank_transfer', 'card', 'wallet'])
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsUUID()
  @IsOptional()
  linkedUserId?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsEnum(['weekly', 'monthly', 'yearly'])
  @IsOptional()
  frequency?: string;

  @IsEnum(['paid', 'pending', 'cancelled'])
  @IsOptional()
  status?: string;
}

export class UpdateExpenseDto {
  @IsNumber()
  @Min(0.01)
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

  @IsEnum(['cash', 'bank_transfer', 'card', 'wallet'])
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

  @IsEnum(['weekly', 'monthly', 'yearly'])
  @IsOptional()
  frequency?: string;

  @IsEnum(['paid', 'pending', 'cancelled'])
  @IsOptional()
  status?: string;
}

// ── Categories ──

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

// ── Vendors ──

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

export class UpdateVendorDto {
  @IsString()
  @IsOptional()
  name?: string;

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

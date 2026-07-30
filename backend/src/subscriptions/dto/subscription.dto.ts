import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString,
  Min,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';

// ── Subscription Plans (الباقات) ──

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; // "باقة يومية", "باقة أسبوعية", "باقة شهرية"

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'packageType must contain lowercase letters, numbers and hyphens only',
  })
  packageType: string; // daily, weekly, monthly

  @IsNumber()
  @Min(1)
  durationDays: number; // 1, 7, 30

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ── Customer Subscriptions (اشتراكات العملاء) ──

export class CreateSubscriptionDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  planId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string; // defaults to now

  @IsOptional()
  @IsEnum(['cash', 'bank_transfer', 'card', 'mixed'])
  paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'mixed';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(['active', 'expired'])
  status?: 'active' | 'expired';

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

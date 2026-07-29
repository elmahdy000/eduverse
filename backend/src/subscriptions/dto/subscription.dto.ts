import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, IsDateString, Min } from 'class-validator';

// ── Subscription Plans (الباقات) ──

export class CreatePlanDto {
  @IsString()
  name: string; // "باقة يومية", "باقة أسبوعية", "باقة شهرية"

  @IsString()
  packageType: string; // daily, weekly, monthly

  @IsNumber()
  @Min(1)
  durationDays: number; // 1, 7, 30

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
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
  @IsNumber()
  @Min(0)
  pricePaid?: number; // override plan price if needed

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  status?: string; // active, expired, cancelled

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

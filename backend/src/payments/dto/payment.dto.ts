import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsUUID()
  invoiceId: string;

  @IsEnum(['cash', 'bank_transfer', 'card', 'mixed'])
  paymentMethod: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RefundPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

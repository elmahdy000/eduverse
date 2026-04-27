import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StartShiftDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  startCash: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseShiftDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualCash: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

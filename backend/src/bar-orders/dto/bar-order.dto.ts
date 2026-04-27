import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBarOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateBarOrderDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBarOrderItemDto)
  items: CreateBarOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBarOrderStatusDto {
  @IsEnum(['new', 'in_preparation', 'ready', 'delivered', 'cancelled'])
  status: string;
}

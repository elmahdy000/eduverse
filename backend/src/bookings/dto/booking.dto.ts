import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  roomId: string;

  @IsEnum(['meeting', 'training', 'event', 'private'])
  bookingType: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  participantCount?: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  participantCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BookingConflictQueryDto {
  @IsUUID()
  roomId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsUUID()
  excludeBookingId?: string;
}

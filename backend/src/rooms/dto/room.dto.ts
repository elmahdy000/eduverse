import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsEnum(['coworking', 'study', 'meeting', 'hall'])
  roomType: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  dailyRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  dailyRate?: number;

  @IsOptional()
  @IsEnum(['available', 'occupied', 'booked_soon', 'under_prep', 'out_of_service'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RoomAvailabilityDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}

export class RoomResponseDto {
  id: string;
  name: string;
  roomType: string;
  capacity: number;
  features?: string[];
  hourlyRate?: number;
  dailyRate?: number;
  status: string;
  notes?: string;
  createdAt: Date;
}

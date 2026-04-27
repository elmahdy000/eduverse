import { IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  customerId: string;

  @IsNotEmpty()
  sessionType: 'hourly' | 'daily' | 'package' | 'booking_linked';

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsNumber()
  chargeAmount?: number;

  @IsOptional()
  notes?: string;
}

export class CloseSessionDto {
  @IsOptional()
  notes?: string;
}

export class SessionResponseDto {
  id: string;
  customerId: string;
  sessionType: string;
  roomId?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  status: string;
  chargeAmount?: number;
  notes?: string;
  createdAt: Date;
}

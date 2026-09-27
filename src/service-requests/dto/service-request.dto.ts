import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ServiceRequestStatus } from '../enums/service-request-status.enum';

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'uuid-of-professional' })
  @IsUUID()
  @IsNotEmpty()
  professionalId: string;

  @ApiProperty({ example: 'Prise électrique défectueuse dans le salon.' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({ example: 'Rue 12, Cadjehoun, Cotonou' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '2025-04-15T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateServiceRequestStatusDto {
  @ApiProperty({ enum: ServiceRequestStatus })
  @IsEnum(ServiceRequestStatus)
  status: ServiceRequestStatus;
}

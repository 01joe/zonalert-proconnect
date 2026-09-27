import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentType } from '../enums/incident-type.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentType, example: IncidentType.ELECTRICITY })
  @IsEnum(IncidentType)
  type: IncidentType;

  @ApiProperty({ example: 'Quartier Alaga, rue 3, Cotonou' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiProperty({ example: 'Panne totale depuis 3h du matin dans tout le quartier.' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 6.3703 })
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: 2.3912 })
  @IsNumber()
  @Type(() => Number)
  longitude: number;
}

export class QueryIncidentsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: IncidentType })
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ description: 'Latitude centre de recherche' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude centre de recherche' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Rayon en km', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;
}

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  status: IncidentStatus;
}

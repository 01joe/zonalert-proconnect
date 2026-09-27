import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProfessionalSpecialty } from '../enums/professional-specialty.enum';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Séraphin' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Dossou' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+22997111222', description: 'Numéro de téléphone' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: '+22997111222', description: 'Numéro WhatsApp (si différent)' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ enum: ProfessionalSpecialty, example: ProfessionalSpecialty.ELECTRICIAN })
  @IsEnum(ProfessionalSpecialty)
  specialty: ProfessionalSpecialty;

  @ApiPropertyOptional({ example: "Électricien certifié, 10 ans d'expérience à Cotonou." })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'Cotonou' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Cadjehoun' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ example: 6.3703 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 2.3912 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}

export class QueryProfessionalsDto {
  @ApiPropertyOptional({ enum: ProfessionalSpecialty })
  @IsOptional()
  @IsEnum(ProfessionalSpecialty)
  specialty?: ProfessionalSpecialty;

  @ApiPropertyOptional({ example: 'Cotonou' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: true, description: 'Filtrer par disponibilité' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  available?: boolean;

  @ApiPropertyOptional({ description: 'Latitude centre de recherche géo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude centre de recherche géo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'uuid-of-incident' })
  @IsUUID()
  @IsNotEmpty()
  incidentId: string;

  @ApiPropertyOptional({ example: 'Contenu inapproprié' })
  @IsOptional()
  @IsString()
  reason?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateConfirmationDto {
  @ApiProperty({ example: 'uuid-of-incident' })
  @IsUUID()
  @IsNotEmpty()
  incidentId: string;
}

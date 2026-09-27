import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'uuid-of-incident' })
  @IsUUID()
  @IsNotEmpty()
  incidentId: string;

  @ApiProperty({ example: 'La panne affecte aussi la rue voisine.' })
  @IsString()
  @MinLength(2)
  content: string;
}

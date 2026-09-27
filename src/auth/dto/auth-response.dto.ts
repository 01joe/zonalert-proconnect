import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';

/**
 * Correspond exactement à l'interface User du frontend :
 * export interface User {
 *   id: string; firstName: string; lastName: string;
 *   email: string; phone: string; city?: string;
 *   role: UserRole; createdAt: string;
 * }
 */
export class UserResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @ApiProperty({ example: 'Koffi' })
  firstName: string;

  @ApiProperty({ example: 'Akplogan' })
  lastName: string;

  @ApiProperty({ example: 'koffi@example.com' })
  email: string;

  @ApiProperty({ example: '+22997000000' })
  phone: string;

  @ApiPropertyOptional({ example: 'Cotonou', nullable: true })
  city: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.CITIZEN })
  role: UserRole;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}

/**
 * Réponse login/register — correspond à AuthTokens du frontend :
 * export interface AuthTokens {
 *   access_token: string;
 *   user: User;
 * }
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (15min)' })
  access_token: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

/**
 * Réponse refresh token
 */
export class RefreshResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;
}

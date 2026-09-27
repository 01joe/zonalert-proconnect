import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'koffi@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Koffi' })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Akplogan' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'koffi@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @ApiProperty({ example: '+22997000000', description: 'Numéro de téléphone (max 50 chars)' })
  @IsString()
  @IsNotEmpty({ message: 'Le téléphone est requis' })
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ example: 'Cotonou' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

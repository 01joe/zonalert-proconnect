import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthResponseDto, RefreshResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Inscription ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Vérifier email en doublon (insensible à la casse)
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

      const user = this.userRepo.create({
        firstName: dto.firstName.trim(),
        lastName:  dto.lastName.trim(),
        email,
        phone:     dto.phone.trim(),
        city:      dto.city?.trim() ?? null,
        password:  hashedPassword,
        role:      UserRole.CITIZEN,
        isActive:  true,
      });

      const saved = await this.userRepo.save(user);
      this.logger.log(`✅ Nouveau compte : ${saved.email} (${saved.id})`);

      const tokens = await this.generateTokens(saved);
      await this.saveRefreshToken(saved.id, tokens.refresh_token);

      return {
        access_token: tokens.access_token,
        user: this.toUserResponse(saved),
      };
    } catch (err: any) {
      // Contrainte unique PostgreSQL (code 23505)
      if (err?.code === '23505') {
        throw new ConflictException('Un compte avec cet email existe déjà');
      }
      this.logger.error('Erreur inscription :', err?.message, err?.stack);
      throw new InternalServerErrorException('Erreur lors de la création du compte');
    }
  }

  // ─── Connexion ────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refresh_token);

    this.logger.log(`Connexion : ${user.email}`);
    return {
      access_token: tokens.access_token,
      user: this.toUserResponse(user),
    };
  }

  // ─── Refresh token ────────────────────────────────────────────────────────

  async refresh(userId: string, refreshToken: string): Promise<RefreshResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user?.refreshToken) throw new UnauthorizedException('Session expirée');

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException('Refresh token invalide');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  // ─── Déconnexion ──────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: null });
    this.logger.log(`Déconnexion : userId=${userId}`);
  }

  // ─── Profil courant ───────────────────────────────────────────────────────

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return this.toUserResponse(user);
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  private async generateTokens(user: User): Promise<RefreshResponseDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessSecret  = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:    accessSecret,
        expiresIn: this.configService.get<string>('jwt.accessExpiration') ?? '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret:    refreshSecret,
        expiresIn: this.configService.get<string>('jwt.refreshExpiration') ?? '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const hashed = await bcrypt.hash(token, this.SALT_ROUNDS);
    await this.userRepo.update(userId, { refreshToken: hashed });
  }

  /**
   * Retourne exactement les champs attendus par le frontend :
   * { id, firstName, lastName, email, phone, city, role, createdAt }
   */
  toUserResponse(user: User): UserResponseDto {
    return {
      id:        user.id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      phone:     user.phone,
      city:      user.city ?? null,
      role:      user.role,
      createdAt: user.createdAt,
    };
  }
}

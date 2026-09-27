import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professional } from './entities/professional.entity';
import { CreateProfessionalDto, QueryProfessionalsDto } from './dto/professional.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
    @InjectRepository(Professional)
    private readonly proRepo: Repository<Professional>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Liste les professionnels avec filtres.
   * Le frontend calcule la distance côté client via Haversine.
   * Les champs phone + whatsapp permettent appel & WhatsApp depuis l'app.
   */
  async findAll(query: QueryProfessionalsDto): Promise<Professional[]> {
    const qb = this.proRepo
      .createQueryBuilder('pro')
      .orderBy('pro.isAvailable', 'DESC')
      .addOrderBy('pro.rating', 'DESC');

    if (query.specialty) {
      qb.andWhere('pro.specialty = :specialty', { specialty: query.specialty });
    }
    if (query.city) {
      qb.andWhere('LOWER(pro.city) LIKE LOWER(:city)', { city: `%${query.city}%` });
    }
    if (query.available !== undefined) {
      qb.andWhere('pro.isAvailable = :available', { available: query.available });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Professional> {
    const pro = await this.proRepo.findOne({ where: { id }, relations: ['user'] });
    if (!pro) throw new NotFoundException(`Professionnel #${id} introuvable`);
    return pro;
  }

  async findByUserId(userId: string): Promise<Professional | null> {
    return this.proRepo.findOne({ where: { userId } });
  }

  async create(dto: CreateProfessionalDto, userId: string): Promise<Professional> {
    // Vérifier doublon
    const existing = await this.proRepo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Vous avez déjà un profil professionnel');
    }

    // Si whatsapp non renseigné, utiliser le téléphone par défaut
    const pro = this.proRepo.create({
      ...dto,
      userId,
      whatsapp: dto.whatsapp ?? dto.phone,
    });
    const saved = await this.proRepo.save(pro);

    // Mettre à jour le rôle user → PROFESSIONAL
    await this.userRepo.update(userId, { role: UserRole.PROFESSIONAL });

    this.logger.log(`Professionnel créé : ${saved.id} (${dto.specialty}) — user ${userId}`);
    return saved;
  }
}

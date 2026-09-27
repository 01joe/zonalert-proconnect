import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Confirmation } from './entities/confirmation.entity';
import { CreateConfirmationDto } from './dto/confirmation.dto';
import { Incident } from '../incidents/entities/incident.entity';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class ConfirmationsService {
  private readonly logger = new Logger(ConfirmationsService.name);

  constructor(
    @InjectRepository(Confirmation)
    private readonly confirmationRepository: Repository<Confirmation>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly incidentsService: IncidentsService,
  ) {}

  async create(dto: CreateConfirmationDto, userId: string): Promise<Confirmation> {
    const incident = await this.incidentRepository.findOne({
      where: { id: dto.incidentId },
    });
    if (!incident) {
      throw new NotFoundException(`Incident #${dto.incidentId} introuvable`);
    }

    const existing = await this.confirmationRepository.findOne({
      where: { userId, incidentId: dto.incidentId },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà confirmé cet incident');
    }

    const confirmation = this.confirmationRepository.create({
      userId,
      incidentId: dto.incidentId,
    });
    const saved = await this.confirmationRepository.save(confirmation);

    // Mise à jour du compteur et statut incident
    await this.incidentsService.incrementConfirmation(dto.incidentId);

    this.logger.log(`Confirmation créée : incident ${dto.incidentId} par user ${userId}`);
    return saved;
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Intervention } from './entities/intervention.entity';
import { InterventionStatus } from './enums/intervention-status.enum';

export interface CreateInterventionDto {
  incidentId: string;
  professionalId: string;
  notes?: string;
}

export interface UpdateInterventionDto {
  status?: InterventionStatus;
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class InterventionsService {
  private readonly logger = new Logger(InterventionsService.name);

  constructor(
    @InjectRepository(Intervention)
    private readonly interventionRepository: Repository<Intervention>,
  ) {}

  async create(dto: CreateInterventionDto): Promise<Intervention> {
    const intervention = this.interventionRepository.create(dto);
    const saved = await this.interventionRepository.save(intervention);
    this.logger.log(`Intervention créée : ${saved.id}`);
    return saved;
  }

  async findByIncident(incidentId: string): Promise<Intervention[]> {
    return this.interventionRepository.find({
      where: { incidentId },
      relations: ['professional'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProfessional(professionalId: string): Promise<Intervention[]> {
    return this.interventionRepository.find({
      where: { professionalId },
      relations: ['incident'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateInterventionDto): Promise<Intervention> {
    const intervention = await this.interventionRepository.findOne({
      where: { id },
    });
    if (!intervention) {
      throw new NotFoundException(`Intervention #${id} introuvable`);
    }
    Object.assign(intervention, dto);
    return this.interventionRepository.save(intervention);
  }
}

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/report.dto';
import { Incident } from '../incidents/entities/incident.entity';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly incidentsService: IncidentsService,
  ) {}

  async create(dto: CreateReportDto, userId: string): Promise<Report> {
    const incident = await this.incidentRepository.findOne({
      where: { id: dto.incidentId },
    });
    if (!incident) {
      throw new NotFoundException(`Incident #${dto.incidentId} introuvable`);
    }

    const existing = await this.reportRepository.findOne({
      where: { userId, incidentId: dto.incidentId },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà signalé cet incident');
    }

    const report = this.reportRepository.create({
      userId,
      incidentId: dto.incidentId,
      reason: dto.reason,
    });
    const saved = await this.reportRepository.save(report);

    await this.incidentsService.incrementReport(dto.incidentId);

    this.logger.log(`Report créé : incident ${dto.incidentId} par user ${userId}`);
    return saved;
  }
}

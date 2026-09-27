import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import {
  CreateIncidentDto,
  QueryIncidentsDto,
  UpdateIncidentStatusDto,
} from './dto/incident.dto';
import { IncidentStatus } from './enums/incident-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Shape exacte attendue par le frontend pour les commentaires
export interface CommentShape {
  id: string;
  content: string;
  userId: string;
  userName: string;
  incidentId: string;
  createdAt: Date;
}

export interface IncidentWithComments extends Omit<Incident, 'comments'> {
  comments: CommentShape[];
}

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: QueryIncidentsDto): Promise<PaginatedResponse<Incident>> {
    const { page = 1, limit = 20, type, status, lat, lng, radius } = query;

    const qb = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoin('incident.user', 'user')
      .addSelect(['user.id', 'user.firstName', 'user.lastName'])
      .orderBy('incident.priorityScore', 'DESC')
      .addOrderBy('incident.createdAt', 'DESC');

    if (type) qb.andWhere('incident.type = :type', { type });
    if (status) qb.andWhere('incident.status = :status', { status });

    // Géo-recherche par rayon (formule Haversine)
    if (lat !== undefined && lng !== undefined && radius) {
      qb.andWhere(
        `(6371 * acos(
          cos(radians(:lat)) * cos(radians(CAST(incident.latitude AS float))) *
          cos(radians(CAST(incident.longitude AS float)) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(CAST(incident.latitude AS float)))
        )) <= :radius`,
        { lat, lng, radius },
      );
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: string): Promise<IncidentWithComments> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['user', 'comments', 'comments.user'],
    });
    if (!incident) {
      throw new NotFoundException(`Incident #${id} introuvable`);
    }

    // Mapper les commentaires avec userName pour correspondre au frontend
    const comments: CommentShape[] = (incident.comments ?? []).map((c) => ({
      id: c.id,
      content: c.content,
      userId: c.userId,
      userName: c.user
        ? `${c.user.firstName} ${c.user.lastName}`.trim()
        : 'Citoyen',
      incidentId: c.incidentId,
      createdAt: c.createdAt,
    }));

    return { ...incident, comments };
  }

  async create(dto: CreateIncidentDto, userId: string): Promise<Incident> {
    const incident = this.incidentRepository.create({ ...dto, userId });
    const saved = await this.incidentRepository.save(incident);

    this.logger.log(`Incident créé : ${saved.id} par user ${userId}`);

    // Notification asynchrone non bloquante
    this.notificationsService
      .notifyNearbyUsers(saved, NotificationType.INCIDENT_NEW)
      .catch((err) => this.logger.error('Erreur notification incident_new', err));

    return saved;
  }

  async updateStatus(
    id: string,
    dto: UpdateIncidentStatusDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException(`Incident #${id} introuvable`);

    if (userRole !== UserRole.ADMIN && incident.userId !== userId) {
      throw new ForbiddenException('Action non autorisée');
    }

    incident.status = dto.status;
    if (dto.status === IncidentStatus.CRITICAL) {
      incident.priorityScore = 100;
    }

    const updated = await this.incidentRepository.save(incident);

    this.notificationsService
      .createForUser(incident.userId, {
        title: 'Statut mis à jour',
        body: `Votre incident est maintenant : ${dto.status}`,
        type: NotificationType.STATUS_UPDATE,
        metadata: { incidentId: id, status: dto.status },
        incidentId: id,
      })
      .catch((err) => this.logger.error('Erreur notification status_update', err));

    return updated;
  }

  async incrementConfirmation(incidentId: string): Promise<void> {
    await this.incidentRepository.increment({ id: incidentId }, 'confirmationCount', 1);
    const incident = await this.incidentRepository.findOne({ where: { id: incidentId } });
    if (
      incident &&
      incident.confirmationCount >= 3 &&
      incident.status === IncidentStatus.NEW
    ) {
      incident.status = IncidentStatus.CONFIRMED;
      incident.priorityScore = Math.min(incident.priorityScore + 10, 100);
      await this.incidentRepository.save(incident);
    }
  }

  async incrementReport(incidentId: string): Promise<void> {
    await this.incidentRepository.increment({ id: incidentId }, 'reportCount', 1);
  }
}

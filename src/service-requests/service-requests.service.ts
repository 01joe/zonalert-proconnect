import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestStatusDto,
} from './dto/service-request.dto';
import { Professional } from '../professionals/entities/professional.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Professional)
    private readonly professionalRepository: Repository<Professional>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateServiceRequestDto, userId: string): Promise<ServiceRequest> {
    const professional = await this.professionalRepository.findOne({
      where: { id: dto.professionalId },
    });
    if (!professional) {
      throw new NotFoundException(`Professionnel #${dto.professionalId} introuvable`);
    }

    const sr = this.serviceRequestRepository.create({
      ...dto,
      userId,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
    const saved = await this.serviceRequestRepository.save(sr);

    this.logger.log(`Demande d'intervention créée : ${saved.id} → pro ${dto.professionalId}`);

    // Notifier le professionnel
    this.notificationsService
      .createForUser(professional.userId, {
        title: "📋 Nouvelle demande d'intervention",
        body: `Un client sollicite votre service : ${dto.description.substring(0, 80)}`,
        type: NotificationType.SERVICE_REQUEST,
        metadata: { serviceRequestId: saved.id, userId },
      })
      .catch((err) => this.logger.error('Erreur notification service_request', err));

    return this.findOneWithRelations(saved.id);
  }

  /**
   * Retourne les demandes d'un citoyen avec les infos du professionnel
   * Le frontend (profile.page.ts) affiche :
   *   sr.professional?.firstName, sr.professional?.lastName
   *   sr.professional?.specialty, sr.professional?.phone
   */
  async findByUser(userId: string): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      where: { userId },
      relations: ['professional'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retourne les demandes reçues par un professionnel avec infos du demandeur
   */
  async findByProfessional(professionalId: string): Promise<ServiceRequest[]> {
    return this.serviceRequestRepository.find({
      where: { professionalId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mise à jour du statut
   * Autorisé : le professionnel concerné, le demandeur (annulation), ou admin
   */
  async updateStatus(
    id: string,
    dto: UpdateServiceRequestStatusDto,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<ServiceRequest> {
    const sr = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['professional'],
    });
    if (!sr) throw new NotFoundException(`Demande #${id} introuvable`);

    const isProfessionalOwner = sr.professional?.userId === requesterId;
    const isRequester = sr.userId === requesterId;
    const isAdmin = requesterRole === UserRole.ADMIN;

    if (!isProfessionalOwner && !isRequester && !isAdmin) {
      throw new ForbiddenException('Action non autorisée sur cette demande');
    }

    sr.status = dto.status;
    const updated = await this.serviceRequestRepository.save(sr);

    // Notifier le demandeur
    this.notificationsService
      .createForUser(sr.userId, {
        title: 'Statut de votre demande mis à jour',
        body: `Votre demande est maintenant : ${dto.status}`,
        type: NotificationType.STATUS_UPDATE,
        metadata: { serviceRequestId: id, status: dto.status },
      })
      .catch((err) => this.logger.error('Erreur notification status_update sr', err));

    return updated;
  }

  private async findOneWithRelations(id: string): Promise<ServiceRequest> {
    return this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['professional'],
    });
  }
}

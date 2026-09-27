import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './enums/notification-type.enum';
import { Incident } from '../incidents/entities/incident.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
  incidentId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ─── CRUD Notifications ───────────────────────────────────────────────────

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string): Promise<void> {
    const notif = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notif) throw new NotFoundException(`Notification #${id} introuvable`);
    await this.notificationRepository.update(id, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    this.logger.log(`Toutes les notifications marquées lues pour user ${userId}`);
  }

  async createForUser(
    userId: string,
    payload: CreateNotificationPayload,
  ): Promise<Notification> {
    const notif = this.notificationRepository.create({ userId, ...payload });
    const saved = await this.notificationRepository.save(notif);

    // Envoi temps-réel via WebSocket (app ouverte)
    this.gateway.sendToUser(userId, saved);

    return saved;
  }

  // ─── FCM Token ────────────────────────────────────────────────────────────

  /**
   * Enregistre ou met à jour le token FCM d'un appareil.
   * Gère plusieurs appareils par utilisateur (fcmTokens est un tableau JSON).
   */
  async saveFcmToken(
    userId: string,
    token: string,
    platform: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const tokens = user.fcmTokens ?? [];
    const existingIndex = tokens.findIndex((t) => t.token === token);

    if (existingIndex >= 0) {
      // Mettre à jour la date si le token existe déjà
      tokens[existingIndex].updatedAt = new Date().toISOString();
    } else {
      // Ajouter le nouveau token (max 5 appareils par utilisateur)
      tokens.push({ token, platform, updatedAt: new Date().toISOString() });
      if (tokens.length > 5) tokens.splice(0, tokens.length - 5);
    }

    await this.userRepository.update(userId, { fcmTokens: tokens });
    this.logger.log(`Token FCM enregistré (${platform}) pour user ${userId}`);
  }

  /**
   * Récupère tous les tokens FCM actifs d'un utilisateur.
   * Utilisé par FirebaseAdminService pour envoyer les push notifications.
   */
  async getFcmTokensForUser(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['fcmTokens'],
    });
    return (user?.fcmTokens ?? []).map((t) => t.token);
  }

  /**
   * Récupère les tokens FCM de plusieurs utilisateurs.
   * Utilisé pour notifyNearbyUsers().
   */
  async getFcmTokensForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const users = await this.userRepository.findByIds(userIds);
    return users.flatMap((u) => (u.fcmTokens ?? []).map((t) => t.token));
  }

  // ─── Notifications géo-broadcast ─────────────────────────────────────────

  /**
   * Notifie tous les utilisateurs actifs d'un nouvel incident / mise à jour.
   * En production : remplacer par une query géo (rayon Haversine).
   */
  async notifyNearbyUsers(
    incident: Incident,
    type: NotificationType,
  ): Promise<void> {
    const typeLabel = incident.type === 'electricity' ? 'électricité' : 'eau';
    const title =
      type === NotificationType.INCIDENT_NEW
        ? `⚠️ Panne ${typeLabel} signalée`
        : `Incident mis à jour`;
    const body = `${incident.address} — ${incident.description.substring(0, 80)}`;

    const users = await this.userRepository.find({
      where: { isActive: true },
      select: ['id', 'fcmTokens'],
    });

    const targetUsers = users.filter((u) => u.id !== incident.userId);

    // 1. Créer les notifications en base
    const notifications = targetUsers.map((u) =>
      this.notificationRepository.create({
        userId: u.id,
        title,
        body,
        type,
        incidentId: incident.id,
        metadata: { incidentId: incident.id, incidentType: incident.type },
      }),
    );

    if (notifications.length > 0) {
      const saved = await this.notificationRepository.save(notifications);

      // 2. Broadcast WebSocket (app ouverte)
      saved.forEach((n) => this.gateway.sendToUser(n.userId, n));

      // 3. Tokens FCM pour notifications push (app fermée)
      const fcmData = {
        type,
        incidentId: incident.id,
        incidentType: incident.type,
      };

      this.logger.log(
        `${saved.length} notifications WebSocket envoyées pour incident ${incident.id}`,
      );
    }
  }
}

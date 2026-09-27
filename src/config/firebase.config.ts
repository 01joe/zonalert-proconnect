import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * FirebaseAdminService
 *
 * Initialise Firebase Admin SDK au démarrage du backend.
 * Utilisé par NotificationsService pour envoyer des push notifications FCM.
 *
 * ─── Configuration requise dans .env ───────────────────────────────────────
 * FIREBASE_PROJECT_ID=votre-project-id
 * FIREBASE_PRIVATE_KEY=<contenu_du_champ_private_key_du_fichier_json>
 * FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@votre-project.iam.gserviceaccount.com
 * ───────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private messaging: any = null;
  private initialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeFirebase();
  }

  private async initializeFirebase(): Promise<void> {
    const projectId   = this.configService.get<string>('firebase.projectId');
    const privateKey  = this.configService.get<string>('firebase.privateKey');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');

    // Si les variables ne sont pas configurées, Firebase est désactivé silencieusement
    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn(
        'Firebase Admin SDK non configuré — notifications push désactivées.\n' +
        'Renseigner FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL dans .env'
      );
      return;
    }

    try {
      const admin = await import('firebase-admin');

      // Éviter la double initialisation (hot reload NestJS)
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
      }

      this.messaging = admin.messaging();
      this.initialized = true;
      this.logger.log('✅ Firebase Admin SDK initialisé');
    } catch (err) {
      this.logger.error('❌ Erreur initialisation Firebase Admin:', err);
    }
  }

  /**
   * Envoie une notification push à un appareil via son token FCM.
   * @param token   Token FCM de l'appareil cible
   * @param title   Titre de la notification
   * @param body    Corps du message
   * @param data    Données supplémentaires (pour la navigation dans l'app)
   */
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.initialized || !this.messaging) {
      this.logger.debug('Firebase non configuré — notification push ignorée');
      return false;
    }

    try {
      await this.messaging.send({
        token,
        notification: { title, body },
        data: data ?? {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'zonalert_notifications',
            icon: 'ic_notification',
            color: '#f97316',
          },
        },
      });
      this.logger.debug(`Push envoyé → ${token.substring(0, 20)}...`);
      return true;
    } catch (err) {
      this.logger.error('Erreur envoi push:', err);
      return false;
    }
  }

  /**
   * Envoie une notification push à plusieurs appareils (multicast).
   * @param tokens  Liste des tokens FCM
   * @param title   Titre
   * @param body    Corps
   * @param data    Données supplémentaires
   */
  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized || !this.messaging || tokens.length === 0) return;

    // Firebase accepte max 500 tokens par batch
    const chunks = this.chunkArray(tokens, 500);

    for (const chunk of chunks) {
      try {
        const response = await this.messaging.sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
          data: data ?? {},
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'zonalert_notifications',
              color: '#f97316',
            },
          },
        });
        this.logger.log(
          `Push multicast: ${response.successCount} succès, ${response.failureCount} échecs`
        );
      } catch (err) {
        this.logger.error('Erreur envoi multicast:', err);
      }
    }
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

export class RegisterFcmTokenDto {
  @ApiProperty({ description: 'Token FCM de l\'appareil Android/Web', example: 'f7xK9...' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Plateforme de l\'appareil', example: 'android', enum: ['android', 'web', 'ios'] })
  @IsString()
  @IsNotEmpty()
  platform: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer mes notifications (50 dernières)' })
  @ApiResponse({ status: 200, type: [Notification] })
  findAll(@CurrentUser() user: User): Promise<Notification[]> {
    return this.notificationsService.findAllForUser(user.id);
  }

  /**
   * POST /notifications/fcm-token
   * Enregistre le token FCM de l'appareil de l'utilisateur.
   * Appelé par FirebaseMessagingService du frontend après initialisation.
   *
   * ⚠️ IMPORTANT : Cette route DOIT être déclarée AVANT 'read-all' et ':id/read'
   * pour éviter les conflits de paramètres NestJS.
   */
  @Post('fcm-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enregistrer le token FCM pour les notifications push' })
  @ApiResponse({ status: 204, description: 'Token enregistré' })
  async registerFcmToken(
    @Body() dto: RegisterFcmTokenDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.notificationsService.saveFcmToken(user.id, dto.token, dto.platform);
  }

  // ⚠️ IMPORTANT: 'read-all' DOIT être avant ':id/read'
  // sinon NestJS interpréterait 'read-all' comme un UUID param
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiResponse({ status: 204 })
  markAllRead(@CurrentUser() user: User): Promise<void> {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiResponse({ status: 204 })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.notificationsService.markRead(id, user.id);
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfirmationsService } from './confirmations.service';
import { CreateConfirmationDto } from './dto/confirmation.dto';
import { Confirmation } from './entities/confirmation.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Confirmations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('confirmations')
export class ConfirmationsController {
  constructor(private readonly confirmationsService: ConfirmationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Confirmer un incident (validation communautaire)' })
  @ApiResponse({ status: 201, type: Confirmation })
  @ApiResponse({ status: 409, description: 'Déjà confirmé' })
  create(
    @Body() dto: CreateConfirmationDto,
    @CurrentUser() user: User,
  ): Promise<Confirmation> {
    return this.confirmationsService.create(dto, user.id);
  }
}

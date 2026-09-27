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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestStatusDto,
} from './dto/service-request.dto';
import { ServiceRequest } from './entities/service-request.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Service Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une demande d\'intervention auprès d\'un professionnel' })
  @ApiResponse({ status: 201, type: ServiceRequest })
  create(
    @Body() dto: CreateServiceRequestDto,
    @CurrentUser() user: User,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.create(dto, user.id);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Lister les demandes d\'un citoyen' })
  @ApiResponse({ status: 200, type: [ServiceRequest] })
  findByUser(@Param('id', ParseUUIDPipe) id: string): Promise<ServiceRequest[]> {
    return this.serviceRequestsService.findByUser(id);
  }

  @Get('professional/:id')
  @ApiOperation({ summary: 'Lister les demandes reçues par un professionnel' })
  @ApiResponse({ status: 200, type: [ServiceRequest] })
  findByProfessional(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceRequest[]> {
    return this.serviceRequestsService.findByProfessional(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une demande d\'intervention' })
  @ApiResponse({ status: 200, type: ServiceRequest })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
    @CurrentUser() user: User,
  ): Promise<ServiceRequest> {
    return this.serviceRequestsService.updateStatus(id, dto, user.id, user.role);
  }
}

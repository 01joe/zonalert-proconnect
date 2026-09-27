import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  IncidentsService,
  PaginatedResponse,
  IncidentWithComments,
} from './incidents.service';
import {
  CreateIncidentDto,
  QueryIncidentsDto,
  UpdateIncidentStatusDto,
} from './dto/incident.dto';
import { Incident } from './entities/incident.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les incidents (paginé, filtrable, géo-search)' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query() query: QueryIncidentsDto,
  ): Promise<PaginatedResponse<Incident>> {
    return this.incidentsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Signaler un nouvel incident' })
  @ApiResponse({ status: 201 })
  create(
    @Body() dto: CreateIncidentDto,
    @CurrentUser() user: User,
  ): Promise<Incident> {
    return this.incidentsService.create(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un incident avec commentaires (userName inclus)" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Incident introuvable' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IncidentWithComments> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "[ADMIN] Changer le statut d'un incident" })
  @ApiResponse({ status: 200 })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentStatusDto,
    @CurrentUser() user: User,
  ): Promise<Incident> {
    return this.incidentsService.updateStatus(id, dto, user.id, user.role);
  }
}

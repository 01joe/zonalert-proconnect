import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfessionalsService } from './professionals.service';
import {
  CreateProfessionalDto,
  QueryProfessionalsDto,
} from './dto/professional.dto';
import { Professional } from './entities/professional.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Professionals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les professionnels (filtrable par spécialité, ville, dispo)' })
  @ApiResponse({ status: 200, type: [Professional] })
  findAll(@Query() query: QueryProfessionalsDto): Promise<Professional[]> {
    return this.professionalsService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'S\'inscrire comme professionnel (artisan)' })
  @ApiResponse({ status: 201, type: Professional })
  @ApiResponse({ status: 409, description: 'Profil professionnel déjà existant' })
  create(
    @Body() dto: CreateProfessionalDto,
    @CurrentUser() user: User,
  ): Promise<Professional> {
    return this.professionalsService.create(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un professionnel' })
  @ApiResponse({ status: 200, type: Professional })
  @ApiResponse({ status: 404, description: 'Professionnel introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Professional> {
    return this.professionalsService.findOne(id);
  }
}

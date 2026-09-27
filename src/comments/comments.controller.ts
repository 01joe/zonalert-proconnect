import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommentsService, CommentResponse } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter un commentaire à un incident' })
  @ApiResponse({ status: 201 })
  create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ): Promise<CommentResponse> {
    return this.commentsService.create(dto, user.id);
  }

  @Get(':incidentId')
  @ApiOperation({ summary: "Lister les commentaires d'un incident" })
  @ApiResponse({ status: 200 })
  findByIncident(
    @Param('incidentId', ParseUUIDPipe) incidentId: string,
  ): Promise<CommentResponse[]> {
    return this.commentsService.findByIncident(incidentId);
  }
}

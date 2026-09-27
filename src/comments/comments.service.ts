import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/comment.dto';
import { Incident } from '../incidents/entities/incident.entity';

export interface CommentResponse {
  id: string;
  content: string;
  userId: string;
  userName: string;
  incidentId: string;
  createdAt: Date;
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async create(dto: CreateCommentDto, userId: string): Promise<CommentResponse> {
    const incident = await this.incidentRepository.findOne({
      where: { id: dto.incidentId },
    });
    if (!incident) {
      throw new NotFoundException(`Incident #${dto.incidentId} introuvable`);
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      userId,
      incidentId: dto.incidentId,
    });
    const saved = await this.commentRepository.save(comment);

    // Recharger avec le user pour avoir le nom
    const withUser = await this.commentRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    this.logger.log(`Commentaire ajouté sur incident ${dto.incidentId}`);
    return this.toResponse(withUser);
  }

  async findByIncident(incidentId: string): Promise<CommentResponse[]> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
    });
    if (!incident) {
      throw new NotFoundException(`Incident #${incidentId} introuvable`);
    }

    const comments = await this.commentRepository.find({
      where: { incidentId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return comments.map((c) => this.toResponse(c));
  }

  private toResponse(comment: Comment): CommentResponse {
    return {
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      userName: comment.user
        ? `${comment.user.firstName} ${comment.user.lastName}`.trim()
        : 'Citoyen',
      incidentId: comment.incidentId,
      createdAt: comment.createdAt,
    };
  }
}

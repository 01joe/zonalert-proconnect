import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { IncidentType } from '../enums/incident-type.enum';
import { IncidentStatus } from '../enums/incident-status.enum';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Confirmation } from '../../confirmations/entities/confirmation.entity';
import { Report } from '../../reports/entities/report.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.NEW })
  status: IncidentStatus;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 255 })
  address: string;

  /**
   * IMPORTANT: PostgreSQL retourne les DECIMAL/NUMERIC en string.
   * @Transform force le cast en number pour correspondre à l'interface frontend :
   *   latitude: number; longitude: number;
   */
  @Index()
  @Transform(({ value }) => (value !== null && value !== undefined ? parseFloat(value) : null))
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Index()
  @Transform(({ value }) => (value !== null && value !== undefined ? parseFloat(value) : null))
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ default: 0 })
  priorityScore: number;

  @Column({ default: 0 })
  reportCount: number;

  @Column({ default: 0 })
  confirmationCount: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.incidents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.incident, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Confirmation, (confirmation) => confirmation.incident, { cascade: true })
  confirmations: Confirmation[];

  @OneToMany(() => Report, (report) => report.incident, { cascade: true })
  reports: Report[];

  @OneToMany(() => Notification, (notification) => notification.incident)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

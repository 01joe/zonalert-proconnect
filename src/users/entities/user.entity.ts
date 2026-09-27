import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';
import { Incident } from '../../incidents/entities/incident.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Confirmation } from '../../confirmations/entities/confirmation.entity';
import { Report } from '../../reports/entities/report.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Professional } from '../../professionals/entities/professional.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  // ← length 50 pour accepter tous les formats (+229 97 00 00 00, etc.)
  @Column({ length: 50 })
  phone: string;

  @Column({ nullable: true, length: 100 })
  city: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CITIZEN })
  role: UserRole;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true, type: 'text' })
  @Exclude()
  refreshToken: string;

  // Tokens FCM pour notifications push multi-appareils
  @Column({ type: 'jsonb', nullable: true, default: null })
  @Exclude()
  fcmTokens: Array<{ token: string; platform: string; updatedAt: string }> | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ─── Relations ────────────────────────────────────────────────────────────
  @OneToMany(() => Incident, (i) => i.user)
  incidents: Incident[];

  @OneToMany(() => Comment, (c) => c.user)
  comments: Comment[];

  @OneToMany(() => Confirmation, (c) => c.user)
  confirmations: Confirmation[];

  @OneToMany(() => Report, (r) => r.user)
  reports: Report[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  @OneToMany(() => ServiceRequest, (sr) => sr.user)
  serviceRequests: ServiceRequest[];

  @OneToOne(() => Professional, (p) => p.user)
  professional: Professional;
}

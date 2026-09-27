import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceRequestStatus } from '../enums/service-request-status.enum';
import { User } from '../../users/entities/user.entity';
import { Professional } from '../../professionals/entities/professional.entity';

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  professionalId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.PENDING,
  })
  status: ServiceRequestStatus;

  @Column({ nullable: true, length: 255 })
  address: string;

  @Column({ nullable: true, type: 'timestamptz' })
  scheduledAt: Date;

  @ManyToOne(() => User, (user) => user.serviceRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Professional, (professional) => professional.serviceRequests, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'professionalId' })
  professional: Professional;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

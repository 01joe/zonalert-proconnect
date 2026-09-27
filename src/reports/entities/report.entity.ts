import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Incident } from '../../incidents/entities/incident.entity';

@Entity('reports')
@Unique(['userId', 'incidentId'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  incidentId: string;

  @Column({ nullable: true, length: 255 })
  reason: string;

  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Incident, (incident) => incident.reports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incidentId' })
  incident: Incident;

  @CreateDateColumn()
  createdAt: Date;
}

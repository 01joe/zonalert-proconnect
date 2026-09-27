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

@Entity('confirmations')
@Unique(['userId', 'incidentId'])
export class Confirmation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  incidentId: string;

  @ManyToOne(() => User, (user) => user.confirmations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Incident, (incident) => incident.confirmations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incidentId' })
  incident: Incident;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  AfterLoad,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Incident } from '../../incidents/entities/incident.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  userId: string;

  @Column()
  incidentId: string;

  // Champ virtuel attendu par le frontend : c.userName
  userName?: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Incident, (incident) => incident.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incidentId' })
  incident: Incident;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  computeUserName(): void {
    if (this.user) {
      this.userName = `${this.user.firstName} ${this.user.lastName}`.trim();
    }
  }
}

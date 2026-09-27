import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { ProfessionalSpecialty } from '../enums/professional-specialty.enum';
import { User } from '../../users/entities/user.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';

@Entity('professionals')
@Unique(['userId'])  // ← contrainte DB : 1 profil pro par user
export class Professional {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  // ← length 50 cohérent avec users
  @Column({ length: 50 })
  phone: string;

  @Column({ type: 'enum', enum: ProfessionalSpecialty })
  specialty: ProfessionalSpecialty;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true, length: 512 })
  photoUrl: string;

  @Column({ length: 100 })
  city: string;

  @Column({ nullable: true, length: 100 })
  zone: string;

  // PostgreSQL retourne DECIMAL en string → @Transform force number
  @Index()
  @Transform(({ value }) => value != null ? parseFloat(value) : null)
  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Index()
  @Transform(({ value }) => value != null ? parseFloat(value) : null)
  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ default: true })
  isAvailable: boolean;

  // Numéro WhatsApp (peut différer du téléphone principal)
  @Column({ nullable: true, length: 50 })
  whatsapp: string;

  @Transform(({ value }) => value != null ? parseFloat(value) : 0)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @OneToOne(() => User, (user) => user.professional, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ServiceRequest, (sr) => sr.professional)
  serviceRequests: ServiceRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

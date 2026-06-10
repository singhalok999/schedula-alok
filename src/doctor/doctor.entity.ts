import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class DoctorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  fullName: string;

  @Column()
  specialization: string;

  @Column()
  qualification: string;

  @Column({ type: 'int' })
  experience: number;

  @Column({ type: 'decimal' })
  consultationFee: number;

  @Column()
  availabilityHours: string;

  @Column({ nullable: true })
  bio: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
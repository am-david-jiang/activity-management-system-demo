import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Activity } from '../../activity/entities/activity.entity';

export enum PosterGenStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('poster_generation_logs')
export class PosterGenerationLog {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Index('IDX_poster_generation_logs_activity_id')
  @Column({ name: 'activity_id', type: 'int', unsigned: true })
  activityId: number;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'varchar', length: 2048, name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({
    type: 'enum',
    enum: PosterGenStatus,
    default: PosterGenStatus.PENDING,
  })
  status: PosterGenStatus;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ type: 'datetime', precision: 6, name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id', referencedColumnName: 'id' })
  activity: Activity;
}

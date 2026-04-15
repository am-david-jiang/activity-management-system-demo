import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum PosterGenStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('poster_generation_logs')
export class PosterGenerationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'activity_id' })
  activityId: number;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({
    type: 'enum',
    enum: PosterGenStatus,
    default: PosterGenStatus.PENDING,
  })
  status: PosterGenStatus;

  @Column({ default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true, name: 'completed_at' })
  completedAt?: Date;
}

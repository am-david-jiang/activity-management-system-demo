import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 140 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'datetime', precision: 6, name: 'start_date' })
  startDate: Date;

  @Column({ type: 'datetime', precision: 6, name: 'end_date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @ManyToOne(() => Activity, (activity) => activity.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Index('IDX_events_activity_id')
  @Column({ name: 'activity_id', type: 'int', unsigned: true })
  activityId: number;
}

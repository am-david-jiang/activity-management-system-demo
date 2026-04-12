import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 140 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'datetime', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'datetime', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @ManyToOne(() => Activity, (activity) => activity.events)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'activity_id' })
  activityId: number;
}

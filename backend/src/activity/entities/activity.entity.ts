import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Participant } from './participant.entity';
import { Event } from './event.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'activity_name' })
  activityName: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  budget: number;

  @Column({ type: 'date', name: 'apply_end_date' })
  applyEndDate: Date;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Participant, (participant) => participant.activities)
  participants: Participant[];

  @OneToMany(() => Event, (event) => event.activity)
  events: Event[];
}

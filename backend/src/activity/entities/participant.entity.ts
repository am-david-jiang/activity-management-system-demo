import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Activity } from './activity.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 11, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'varchar', nullable: true, name: 'weixin_account' })
  weixinAccount?: string;

  @Column({ type: 'varchar', nullable: true, name: 'qq_account' })
  qqAccount?: string;

  @ManyToMany(() => Activity, (activity) => activity.participants)
  @JoinTable({
    name: 'activity_participants',
    joinColumn: { name: 'participant_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'activity_id', referencedColumnName: 'id' },
  })
  activities: Activity[];
}

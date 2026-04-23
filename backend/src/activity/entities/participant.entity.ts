import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Activity } from './activity.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Index('IDX_participants_user_id', { unique: true })
  @Column({ type: 'char', length: 36, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 32 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 11, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'weixin_account' })
  weixinAccount?: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'qq_account' })
  qqAccount?: string;

  @ManyToMany(() => Activity, (activity) => activity.participants)
  @JoinTable({
    name: 'activity_participants',
    joinColumn: { name: 'participant_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'activity_id', referencedColumnName: 'id' },
  })
  activities: Activity[];

  @BeforeInsert()
  generateUserId() {
    if (!this.userId) {
      this.userId = randomUUID();
    }
  }
}

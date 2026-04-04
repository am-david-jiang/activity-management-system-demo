import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum RoleType {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.USER, unique: true })
  name: RoleType;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}

import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './user/entities/user.entity';
import { Credential } from './auth/entities/credential.entity';
import { Role } from './auth/entities/role.entity';
import { Activity } from './activity/entities/activity.entity';
import { Event } from './activity/entities/event.entity';
import { Participant } from './activity/entities/participant.entity';
import { PosterGenerationLog } from './poster-gen/entities/poster-generation-log.entity';

const options: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: true,
  entities: [
    User,
    Credential,
    Role,
    Activity,
    Event,
    Participant,
    PosterGenerationLog,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
};

export const AppDataSource = new DataSource(options);

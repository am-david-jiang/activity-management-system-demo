import { DataSourceOptions } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { User } from '../user/entities/user.entity';
import { Credential } from '../auth/entities/credential.entity';
import { Role } from '../auth/entities/role.entity';
import { Activity } from '../activity/entities/activity.entity';
import { Event } from '../activity/entities/event.entity';
import { Participant } from '../activity/entities/participant.entity';
import { PosterGenerationLog } from '../poster-gen/entities/poster-generation-log.entity';

const entities = [
  User,
  Credential,
  Role,
  Activity,
  Event,
  Participant,
  PosterGenerationLog,
];

const migrations = ['migrations/*.{ts,js}'];

function getMysqlOptions(): MysqlConnectionOptions {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL;

  if (databaseUrl) {
    return {
      type: 'mysql',
      url: databaseUrl,
      charset: 'utf8mb4',
      entities,
      migrations,
      synchronize: false,
    };
  }

  return {
    type: 'mysql',
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    username: process.env.MYSQL_USER ?? 'root',
    password: String(process.env.MYSQL_PASSWORD ?? ''),
    database: process.env.MYSQL_DATABASE ?? 'activity_management_system',
    charset: 'utf8mb4',
    entities,
    migrations,
    synchronize: false,
  };
}

export function getTypeOrmConfig(): DataSourceOptions {
  return getMysqlOptions();
}

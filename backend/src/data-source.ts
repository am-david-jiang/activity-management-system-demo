import 'dotenv/config';
import { DataSource } from 'typeorm';
import { getTypeOrmConfig } from './database/typeorm.config';

export const AppDataSource = new DataSource(getTypeOrmConfig());

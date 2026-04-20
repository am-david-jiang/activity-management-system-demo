import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ActivityModule } from './activity/activity.module';
import { PosterGenModule } from './poster-gen/poster-gen.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: true,
      autoLoadEntities: true,
      synchronize: false,
      migrations: ['src/migrations/*.ts'],
    }),
    UserModule,
    AuthModule,
    ActivityModule,
    HealthModule,
    PosterGenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosterGenGateway } from './gateway/poster-gen.gateway';
import { PosterGenService } from './service/poster-gen.service';
import { PosterGenerationLog } from './entities/poster-generation-log.entity';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [TypeOrmModule.forFeature([PosterGenerationLog]), ActivityModule],
  providers: [PosterGenGateway, PosterGenService],
  exports: [PosterGenService],
})
export class PosterGenModule {}

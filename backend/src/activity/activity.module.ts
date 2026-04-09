import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Participant } from './entities/participant.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Participant])],
  controllers: [ActivityController, ParticipantController],
  providers: [ActivityService, ParticipantService],
  exports: [ActivityService, ParticipantService],
})
export class ActivityModule {}

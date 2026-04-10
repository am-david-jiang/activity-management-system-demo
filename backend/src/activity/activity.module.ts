import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Participant } from './entities/participant.entity';
import { Event } from './entities/event.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { EventService } from './event.service';
import { EventController } from './event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Participant, Event])],
  controllers: [ActivityController, ParticipantController, EventController],
  providers: [ActivityService, ParticipantService, EventService],
  exports: [ActivityService, ParticipantService],
})
export class ActivityModule {}

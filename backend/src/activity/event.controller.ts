import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('activities/:activityId/events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  create(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventService.create(activityId, createEventDto);
  }

  @Get()
  findAll(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.eventService.findAllByActivity(activityId);
  }

  @Get(':eventId')
  findOne(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.eventService.findOne(activityId, eventId);
  }

  @Patch(':eventId')
  update(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.update(activityId, eventId, updateEventDto);
  }

  @Delete(':eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.eventService.remove(activityId, eventId);
  }
}

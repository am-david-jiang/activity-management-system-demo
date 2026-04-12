import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { Activity } from './entities/activity.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  private hasDateOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }

  async create(
    activityId: number,
    createEventDto: CreateEventDto,
  ): Promise<Event> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    const eventStartDate = new Date(createEventDto.startDate);
    const eventEndDate = new Date(createEventDto.endDate);

    const existingEvents = await this.eventRepository.find({
      where: { activityId },
    });
    for (const existing of existingEvents) {
      if (
        this.hasDateOverlap(
          eventStartDate,
          eventEndDate,
          existing.startDate,
          existing.endDate,
        )
      ) {
        throw new BadRequestException(
          'Event date range overlaps with existing event',
        );
      }
    }

    const event = this.eventRepository.create({
      ...createEventDto,
      startDate: eventStartDate,
      endDate: eventEndDate,
      activityId,
    });

    return this.eventRepository.save(event);
  }

  async findAllByActivity(activityId: number): Promise<Event[]> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    return this.eventRepository.find({
      where: { activityId },
      order: { startDate: 'ASC' },
    });
  }

  async findOne(activityId: number, eventId: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, activityId },
    });
    if (!event) {
      throw new NotFoundException(
        `Event with ID ${eventId} not found for activity ${activityId}`,
      );
    }
    return event;
  }

  async update(
    activityId: number,
    eventId: number,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.findOne(activityId, eventId);

    const updateData = { ...updateEventDto } as Partial<Event>;
    if (updateEventDto.startDate) {
      updateData.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate) {
      updateData.endDate = new Date(updateEventDto.endDate);
    }

    const newStartDate = updateData.startDate ?? event.startDate;
    const newEndDate = updateData.endDate ?? event.endDate;

    const existingEvents = await this.eventRepository.find({
      where: { activityId },
    });
    for (const existing of existingEvents) {
      if (existing.id === eventId) continue;
      if (
        this.hasDateOverlap(
          newStartDate,
          newEndDate,
          existing.startDate,
          existing.endDate,
        )
      ) {
        throw new BadRequestException(
          'Event date range overlaps with existing event',
        );
      }
    }

    Object.assign(event, updateData);
    return this.eventRepository.save(event);
  }

  async remove(activityId: number, eventId: number): Promise<void> {
    const event = await this.findOne(activityId, eventId);
    await this.eventRepository.remove(event);
  }
}

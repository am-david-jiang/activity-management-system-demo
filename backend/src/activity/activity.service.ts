import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const activity = this.activityRepository.create({
      ...createActivityDto,
      startDate: new Date(createActivityDto.startDate),
      endDate: new Date(createActivityDto.endDate),
      applyEndDate: new Date(createActivityDto.applyEndDate),
    });
    return this.activityRepository.save(activity);
  }

  async findAll(): Promise<Activity[]> {
    return this.activityRepository.find();
  }

  async findOne(id: number): Promise<Activity> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }
    return activity;
  }

  async update(
    id: number,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity> {
    const activity = await this.findOne(id);
    const updateData = { ...updateActivityDto } as Partial<Activity>;
    if (updateActivityDto.startDate) {
      updateData.startDate = new Date(updateActivityDto.startDate);
    }
    if (updateActivityDto.endDate) {
      updateData.endDate = new Date(updateActivityDto.endDate);
    }
    if (updateActivityDto.applyEndDate) {
      updateData.applyEndDate = new Date(updateActivityDto.applyEndDate);
    }
    Object.assign(activity, updateData);
    return this.activityRepository.save(activity);
  }

  async finish(id: number): Promise<Activity> {
    const activity = await this.findOne(id);
    activity.status = 'finished';
    return this.activityRepository.save(activity);
  }

  async remove(id: number): Promise<void> {
    const activity = await this.findOne(id);
    if (activity.status === 'finished') {
      throw new BadRequestException('Cannot remove a finished activity');
    }
    await this.activityRepository.remove(activity);
  }
}

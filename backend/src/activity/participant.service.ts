import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from './entities/participant.entity';
import { Activity } from './entities/activity.entity';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { SearchParticipantDto } from './dto/search-participant.dto';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async create(
    createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    const { activityIds, ...rest } = createParticipantDto;
    const participant = this.participantRepository.create(rest as Participant);

    if (activityIds && activityIds.length > 0) {
      const activities = await this.activityRepository.findByIds(activityIds);
      participant.activities = activities;
    }

    return this.participantRepository.save(participant);
  }

  async findAll(): Promise<Participant[]> {
    return this.participantRepository.find({ relations: ['activities'] });
  }

  async findOne(userId: string): Promise<Participant> {
    const participant = await this.participantRepository.findOne({
      where: { userId },
      relations: ['activities'],
    });
    if (!participant) {
      throw new NotFoundException(
        `Participant with user_id ${userId} not found`,
      );
    }
    return participant;
  }

  async update(
    userId: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const participant = await this.findOne(userId);
    const { activityIds, ...rest } = updateParticipantDto;

    Object.assign(participant, rest);

    if (activityIds !== undefined) {
      const activities = await this.activityRepository.findByIds(activityIds);
      participant.activities = activities;
    }

    return this.participantRepository.save(participant);
  }

  async remove(userId: string): Promise<void> {
    const participant = await this.findOne(userId);
    await this.participantRepository.remove(participant);
  }

  async search(dto: SearchParticipantDto): Promise<{
    data: Participant[];
    total: number;
    page: number;
    size: number;
  }> {
    const { keyword, email, phoneNumber, page = 1, size = 10 } = dto;
    const query = this.participantRepository.createQueryBuilder('p');

    if (keyword) {
      query.andWhere('p.name LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (email) {
      query.andWhere('p.email = :email', { email });
    }
    if (phoneNumber) {
      query.andWhere('p.phoneNumber = :phoneNumber', { phoneNumber });
    }

    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * size)
      .take(size)
      .leftJoinAndSelect('p.activities', 'activities')
      .getMany();

    return { data, total, page, size };
  }
}

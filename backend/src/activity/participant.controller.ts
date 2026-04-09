import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { SearchParticipantDto } from './dto/search-participant.dto';

@Controller('participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Post()
  create(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantService.create(createParticipantDto);
  }

  @Get()
  findAll() {
    return this.participantService.findAll();
  }

  @Get('search')
  search(@Query() searchDto: SearchParticipantDto) {
    return this.participantService.search(searchDto);
  }

  @Get(':user_id')
  findOne(@Param('user_id') userId: string) {
    return this.participantService.findOne(userId);
  }

  @Patch(':user_id')
  update(
    @Param('user_id') userId: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ) {
    return this.participantService.update(userId, updateParticipantDto);
  }

  @Delete(':user_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('user_id') userId: string) {
    return this.participantService.remove(userId);
  }
}

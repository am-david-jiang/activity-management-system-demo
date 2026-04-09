import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  Length,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateParticipantDto {
  @IsString()
  @MaxLength(32)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @Length(11, 11)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  weixinAccount?: string;

  @IsString()
  @IsOptional()
  qqAccount?: string;

  @IsNumber({}, { each: true })
  @IsArray()
  @IsOptional()
  activityIds?: number[];
}

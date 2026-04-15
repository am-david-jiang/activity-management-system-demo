import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GeneratePosterDto {
  @IsNumber()
  @IsNotEmpty()
  activityId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Requirements must be at least 10 characters' })
  @MaxLength(500, { message: 'Requirements cannot exceed 500 characters' })
  requirements: string;
}

export class ColorPaletteDto {
  @IsString()
  @IsNotEmpty()
  primary: string;

  @IsString()
  @IsNotEmpty()
  secondary: string;

  @IsString()
  @IsNotEmpty()
  accent: string;
}

export class ConceptDirectionDto {
  @IsString()
  @IsNotEmpty()
  direction_id: string;

  @IsString()
  @IsNotEmpty()
  style: string;

  @ValidateNested()
  @Type(() => ColorPaletteDto)
  color_palette: ColorPaletteDto;

  @IsArray()
  @IsString({ each: true })
  visual_elements: string[];

  @IsString()
  @IsNotEmpty()
  layout_hints: string;

  @IsString()
  @IsNotEmpty()
  title_concept: string;

  @IsString()
  @IsNotEmpty()
  image_prompt: string;
}

export class UserSelectDecisionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  directionId: string;
}

export class UserEditDecisionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ValidateNested()
  @Type(() => ConceptDirectionDto)
  direction: ConceptDirectionDto;
}

export class UserRequestNewDecisionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  document?: string | null;

  @IsOptional()
  @IsNumber()
  documentSize?: number | null;

  @IsNumber()
  version: number;

  @IsOptional()
  @IsBoolean()
  snapshot?: boolean;
}

import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
}

class RecipientDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(Permission)
  permission?: Permission;
}

export class BulkAddSharesDto {
  @IsString()
  noteId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];
}

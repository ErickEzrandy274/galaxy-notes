import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
}

class RecipientDto {
  @ApiProperty({ example: 'collaborator@example.com', description: 'Recipient email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'READ', description: 'Permission level', enum: Permission })
  @IsOptional()
  @IsEnum(Permission)
  permission?: Permission;
}

export class BulkAddSharesDto {
  @ApiProperty({ description: 'ID of the note to share' })
  @IsString()
  noteId: string;

  @ApiProperty({ type: [RecipientDto], description: 'List of recipients to share with' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];
}

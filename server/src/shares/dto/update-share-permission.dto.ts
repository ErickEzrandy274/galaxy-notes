import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
}

export class UpdateSharePermissionDto {
  @ApiProperty({ example: 'WRITE', description: 'New permission level', enum: Permission })
  @IsEnum(Permission)
  permission: Permission;
}

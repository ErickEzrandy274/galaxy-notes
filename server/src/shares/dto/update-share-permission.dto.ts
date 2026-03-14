import { IsEnum } from 'class-validator';

enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
}

export class UpdateSharePermissionDto {
  @IsEnum(Permission)
  permission: Permission;
}

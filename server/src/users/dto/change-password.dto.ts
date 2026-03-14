import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain a number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Password must contain a special character',
  })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmNewPassword: string;
}

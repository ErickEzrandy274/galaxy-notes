import { IsOptional, IsIn } from 'class-validator';

export class MuteUserDto {
  @IsOptional()
  @IsIn(['1h', '1d', '1w', 'forever'])
  duration?: '1h' | '1d' | '1w' | 'forever';
}

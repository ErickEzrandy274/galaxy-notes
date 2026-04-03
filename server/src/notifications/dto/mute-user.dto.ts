import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MuteUserDto {
  @ApiPropertyOptional({
    example: '1d',
    description: 'Mute duration',
    enum: ['1h', '1d', '1w', 'forever'],
  })
  @IsOptional()
  @IsIn(['1h', '1d', '1w', 'forever'])
  duration?: '1h' | '1d' | '1w' | 'forever';
}

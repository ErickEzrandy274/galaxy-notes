import { IsOptional, IsString, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetVersionsDto {
  @ApiPropertyOptional({ description: 'Cursor for pagination (version ID)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of versions per page',
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

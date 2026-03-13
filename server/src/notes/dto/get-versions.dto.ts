import { IsOptional, IsString, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetVersionsDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

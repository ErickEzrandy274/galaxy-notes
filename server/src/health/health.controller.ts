import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'),
) as { name: string; version: string };

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('ping')
  @ApiOperation({ summary: 'Health check ping' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  ping() {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }

  @Get('version')
  @ApiOperation({ summary: 'Get application version and environment' })
  @ApiResponse({ status: 200, description: 'Version information' })
  getVersion() {
    return {
      name: pkg.name,
      version: pkg.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

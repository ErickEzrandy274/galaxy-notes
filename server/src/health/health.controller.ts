import { Controller, Get } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'),
);

@Controller()
export class HealthController {
  @Get('ping')
  ping() {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }

  @Get('version')
  getVersion() {
    return {
      name: pkg.name,
      version: pkg.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

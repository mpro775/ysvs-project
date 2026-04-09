import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Version(VERSION_NEUTRAL)
@Controller('health')
export class HealthController {
  private buildHealthPayload() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ysvs-backend',
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  checkHealth() {
    return this.buildHealthPayload();
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  checkLiveness() {
    return this.buildHealthPayload();
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  checkReadiness() {
    return this.buildHealthPayload();
  }
}

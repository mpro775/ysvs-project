import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
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
  @Version(VERSION_NEUTRAL)
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  checkHealth() {
    return this.buildHealthPayload();
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  checkLiveness() {
    return this.buildHealthPayload();
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  checkReadiness() {
    return this.buildHealthPayload();
  }
}

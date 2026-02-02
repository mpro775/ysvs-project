import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StreamingService } from './streaming.service';
import { CreateStreamConfigDto, UpdateStreamConfigDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Streaming')
@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Public()
  @Get('status')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
  @ApiOperation({ summary: 'Get current stream status (Public)' })
  @ApiResponse({ status: 200, description: 'Current stream status' })
  getStatus() {
    return this.streamingService.getStatus();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('config')
  @ApiOperation({ summary: 'Create stream configuration (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Configuration created successfully',
  })
  createConfig(@Body() createStreamConfigDto: CreateStreamConfigDto) {
    return this.streamingService.createConfig(createStreamConfigDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('config/:id')
  @ApiOperation({ summary: 'Update stream configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  updateConfig(
    @Param('id') id: string,
    @Body() updateStreamConfigDto: UpdateStreamConfigDto,
  ) {
    return this.streamingService.updateConfig(id, updateStreamConfigDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('config')
  @ApiOperation({ summary: 'Get current stream configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Current configuration' })
  getCurrentConfig() {
    return this.streamingService.getCurrentConfig();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('start/:configId')
  @ApiOperation({ summary: 'Start live stream (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stream started successfully' })
  @ApiResponse({
    status: 400,
    description: 'Stream already active or invalid config',
  })
  startStream(
    @Param('configId') configId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.streamingService.startStream(configId, userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('stop')
  @ApiOperation({ summary: 'Stop live stream (Admin only)' })
  @ApiResponse({ status: 200, description: 'Stream stopped successfully' })
  stopStream(@Query('configId') configId?: string) {
    return this.streamingService.stopStream(configId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('history')
  @ApiOperation({ summary: 'Get stream history (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Stream history' })
  getHistory(@Query('limit') limit?: number) {
    return this.streamingService.getHistory(limit);
  }

  @Public()
  @Get('viewers')
  @ApiOperation({ summary: 'Get current viewer count (Public)' })
  @ApiResponse({ status: 200, description: 'Current viewer count' })
  getViewerCount() {
    return this.streamingService.getViewerCount();
  }
}

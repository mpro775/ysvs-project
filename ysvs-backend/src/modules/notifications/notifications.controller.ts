import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { NotificationsPublisherService } from './notifications.publisher.service';
import { SendTestNotificationDto } from './dto/send-test-notification.dto';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsPublisherService: NotificationsPublisherService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List admin notifications' })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully' })
  findAll(@CurrentUser('id') userId: string, @Query() queryDto: NotificationsQueryDto) {
    return this.notificationsService.listForAdmin(userId, queryDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current admin' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test admin websocket notification' })
  @ApiResponse({ status: 201, description: 'Notification emitted successfully' })
  async emitTestNotification(@Body() dto: SendTestNotificationDto) {
    const title = dto.title?.trim() || 'اختبار الإشعارات';
    const message = dto.message?.trim() || 'تم إرسال إشعار تجريبي إلى لوحة التحكم';

    const event = await this.notificationsPublisherService.publishToAdmins({
      type: 'system.test',
      title,
      message,
      severity: 'info',
      entityType: 'system',
      actionUrl: '/admin',
    });

    return {
      data: event,
      message: 'تم إرسال الإشعار التجريبي بنجاح',
    };
  }
}

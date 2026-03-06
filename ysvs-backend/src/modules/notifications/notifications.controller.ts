import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsPublisherService: NotificationsPublisherService,
  ) {}

  @Post('test')
  @ApiOperation({ summary: 'Send a test admin websocket notification' })
  @ApiResponse({ status: 201, description: 'Notification emitted successfully' })
  emitTestNotification(@Body() dto: SendTestNotificationDto) {
    const title = dto.title?.trim() || 'اختبار الإشعارات';
    const message = dto.message?.trim() || 'تم إرسال إشعار تجريبي إلى لوحة التحكم';

    const event = this.notificationsPublisherService.publishToAdmins({
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

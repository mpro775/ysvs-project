import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { NewsletterService } from './newsletter.service';
import {
  NewsletterQueryDto,
  SubscribeNewsletterDto,
  UnsubscribeNewsletterDto,
  UpdateSubscriberStatusDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiResponse({ status: 201, description: 'Subscription request accepted' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  subscribe(@Body() dto: SubscribeNewsletterDto, @Req() req: Request) {
    return this.newsletterService.subscribe(
      dto,
      this.extractIp(req),
      req.headers['user-agent'] || 'unknown',
    );
  }

  @Public()
  @Get('confirm')
  @ApiOperation({ summary: 'Confirm newsletter subscription' })
  @ApiResponse({ status: 200, description: 'Subscription confirmed' })
  @ApiResponse({ status: 404, description: 'Invalid or expired confirmation token' })
  confirm(@Query('token') token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('رمز التأكيد مطلوب');
    }

    return this.newsletterService.confirmSubscription(token);
  }

  @Public()
  @Post('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  @ApiResponse({ status: 200, description: 'Unsubscribe request accepted' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  unsubscribe(@Body() dto: UnsubscribeNewsletterDto, @Req() req: Request) {
    return this.newsletterService.unsubscribe(dto, this.extractIp(req));
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('subscribers')
  @ApiOperation({ summary: 'List newsletter subscribers (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of subscribers' })
  findAll(@Query() queryDto: NewsletterQueryDto) {
    return this.newsletterService.findAll(queryDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('subscribers/:id/status')
  @ApiOperation({ summary: 'Update subscriber status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Subscriber status updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscriber not found' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSubscriberStatusDto) {
    return this.newsletterService.updateStatus(id, dto);
  }

  private extractIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim();
    }

    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}

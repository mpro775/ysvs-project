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
import { ContactService } from './contact.service';
import {
  ContactQueryDto,
  CreateContactMessageDto,
  ReplyContactMessageDto,
  UpdateContactReadDto,
  UpdateContactStatusDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post('messages')
  @ApiOperation({ summary: 'Submit a contact message' })
  @ApiResponse({ status: 201, description: 'Message submitted successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  createMessage(@Body() dto: CreateContactMessageDto, @Req() req: Request) {
    return this.contactService.createMessage(
      dto,
      this.extractIp(req),
      req.headers['user-agent'] || 'unknown',
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('messages')
  @ApiOperation({ summary: 'List contact messages (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of contact messages' })
  findAll(@Query() queryDto: ContactQueryDto) {
    return this.contactService.findAll(queryDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('messages/:id')
  @ApiOperation({ summary: 'Get contact message details (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contact message details' })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('messages/:id/status')
  @ApiOperation({ summary: 'Update contact message status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Contact message updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) {
    return this.contactService.updateStatus(id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Update contact message read state (Admin only)' })
  @ApiResponse({ status: 200, description: 'Read state updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  updateReadStatus(@Param('id') id: string, @Body() dto: UpdateContactReadDto) {
    return this.contactService.updateReadStatus(id, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('messages/:id/reply')
  @ApiOperation({ summary: 'Reply to contact message via email (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reply sent successfully' })
  @ApiResponse({ status: 400, description: 'Failed to send reply email' })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  reply(
    @Param('id') id: string,
    @Body() dto: ReplyContactMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!userId?.trim()) {
      throw new BadRequestException('تعذر تحديد المستخدم الحالي');
    }

    return this.contactService.reply(id, dto, userId);
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

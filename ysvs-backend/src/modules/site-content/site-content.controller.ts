import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SiteContentService } from './site-content.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import {
  UpdateHomepageContentDto,
  UpdateFooterContentDto,
  UpdateLegalPageDto,
  UpdateSiteContentDto,
} from './dto';

@ApiTags('Site Content')
@Controller('site-content')
export class SiteContentController {
  constructor(private readonly siteContentService: SiteContentService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public site content including footer and legal metadata' })
  @ApiResponse({ status: 200, description: 'Public site content loaded successfully' })
  findPublic() {
    return this.siteContentService.findPublic();
  }

  @Public()
  @Get('homepage/countdown-event')
  @ApiOperation({ summary: 'Get configured homepage countdown event' })
  @ApiResponse({ status: 200, description: 'Homepage countdown event loaded successfully' })
  findHomepageCountdownEvent() {
    return this.siteContentService.findHomepageCountdownEvent();
  }

  @Public()
  @Get('legal/privacy')
  @ApiOperation({ summary: 'Get published privacy policy page' })
  @ApiResponse({ status: 200, description: 'Privacy policy loaded successfully' })
  @ApiResponse({ status: 404, description: 'Privacy policy is not published' })
  findPrivacyPolicy() {
    return this.siteContentService.findPublicLegalPage('privacy');
  }

  @Public()
  @Get('legal/terms')
  @ApiOperation({ summary: 'Get published terms and conditions page' })
  @ApiResponse({ status: 200, description: 'Terms and conditions loaded successfully' })
  @ApiResponse({ status: 404, description: 'Terms and conditions are not published' })
  findTermsAndConditions() {
    return this.siteContentService.findPublicLegalPage('terms');
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Get full site content data for admin' })
  @ApiResponse({ status: 200, description: 'Site content loaded for admin' })
  findAdmin() {
    return this.siteContentService.findAdmin();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch()
  @ApiOperation({ summary: 'Update full site content (Admin only)' })
  @ApiResponse({ status: 200, description: 'Site content updated successfully' })
  update(@Body() updateDto: UpdateSiteContentDto) {
    return this.siteContentService.update(updateDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('footer')
  @ApiOperation({ summary: 'Update footer content (Admin only)' })
  @ApiResponse({ status: 200, description: 'Footer content updated successfully' })
  updateFooter(@Body() updateDto: UpdateFooterContentDto) {
    return this.siteContentService.updateFooter(updateDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('homepage')
  @ApiOperation({ summary: 'Update homepage content (Admin only)' })
  @ApiResponse({ status: 200, description: 'Homepage content updated successfully' })
  updateHomepage(@Body() updateDto: UpdateHomepageContentDto) {
    return this.siteContentService.updateHomepage(updateDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('legal/privacy')
  @ApiOperation({ summary: 'Update privacy policy draft (Admin only)' })
  @ApiResponse({ status: 200, description: 'Privacy policy updated successfully' })
  updatePrivacyPolicy(@Body() updateDto: UpdateLegalPageDto) {
    return this.siteContentService.updateLegalPage('privacy', updateDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('legal/terms')
  @ApiOperation({ summary: 'Update terms and conditions draft (Admin only)' })
  @ApiResponse({ status: 200, description: 'Terms and conditions updated successfully' })
  updateTermsAndConditions(@Body() updateDto: UpdateLegalPageDto) {
    return this.siteContentService.updateLegalPage('terms', updateDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('legal/privacy/publish')
  @ApiOperation({ summary: 'Publish privacy policy and create next version (Admin only)' })
  @ApiResponse({ status: 201, description: 'Privacy policy published successfully' })
  publishPrivacyPolicy() {
    return this.siteContentService.publishLegalPage('privacy');
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('legal/terms/publish')
  @ApiOperation({ summary: 'Publish terms and conditions and create next version (Admin only)' })
  @ApiResponse({ status: 201, description: 'Terms and conditions published successfully' })
  publishTermsAndConditions() {
    return this.siteContentService.publishLegalPage('terms');
  }
}

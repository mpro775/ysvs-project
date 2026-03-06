import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AboutService } from './about.service';
import { UpdateAboutContentDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';

@ApiTags('About')
@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get public about page content' })
  @ApiResponse({ status: 200, description: 'About page content' })
  findPublic() {
    return this.aboutService.findPublic();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Get about page content for admin' })
  @ApiResponse({ status: 200, description: 'About page content (admin)' })
  findAdmin() {
    return this.aboutService.findAdmin();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch()
  @ApiOperation({ summary: 'Update about page content (Admin only)' })
  @ApiResponse({ status: 200, description: 'About page content updated successfully' })
  update(@Body() updateAboutContentDto: UpdateAboutContentDto) {
    return this.aboutService.update(updateAboutContentDto);
  }
}

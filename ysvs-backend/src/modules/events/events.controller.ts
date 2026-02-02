import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { RegistrationService } from './registration.service';
import {
  CreateEventDto,
  EventsQueryDto,
  UpdateEventDto,
  UpdateFormSchemaDto,
  CreateTicketTypeDto,
  CreateRegistrationDto,
} from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegistrationStatus } from './schemas/registration.schema';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly registrationService: RegistrationService,
  ) {}

  // ============= EVENTS =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new event (Admin only)' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.create(createEventDto, userId);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get published events' })
  @ApiResponse({ status: 200, description: 'List of events' })
  findPublished(@Query() query: EventsQueryDto) {
    return this.eventsService.findPublished(query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('all')
  @ApiOperation({ summary: 'Get all events (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all events' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.eventsService.findAll(paginationDto);
  }

  @Public()
  @Get('upcoming')
  @ApiOperation({ summary: 'Get next upcoming event (for countdown)' })
  @ApiResponse({ status: 200, description: 'Upcoming event' })
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-registrations')
  @ApiOperation({ summary: 'Get current user event registrations' })
  @ApiResponse({ status: 200, description: 'List of user registrations' })
  getMyRegistrations(@CurrentUser('id') userId: string) {
    return this.registrationService.findByUser(userId);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get event by slug' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete event (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  // ============= FORM SCHEMA =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id/form-schema')
  @ApiOperation({ summary: 'Update event registration form schema (Admin only)' })
  @ApiResponse({ status: 200, description: 'Form schema updated successfully' })
  updateFormSchema(
    @Param('id') id: string,
    @Body() updateFormSchemaDto: UpdateFormSchemaDto,
  ) {
    return this.eventsService.updateFormSchema(id, updateFormSchemaDto);
  }

  @Public()
  @Get(':id/form-schema')
  @ApiOperation({ summary: 'Get event registration form schema' })
  @ApiResponse({ status: 200, description: 'Form schema' })
  getFormSchema(@Param('id') id: string) {
    return this.eventsService.getFormSchema(id);
  }

  // ============= TICKET TYPES =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('ticket-types')
  @ApiOperation({ summary: 'Create ticket type for event (Admin only)' })
  @ApiResponse({ status: 201, description: 'Ticket type created successfully' })
  createTicketType(@Body() createTicketTypeDto: CreateTicketTypeDto) {
    return this.eventsService.createTicketType(createTicketTypeDto);
  }

  @Public()
  @Get(':id/ticket-types')
  @ApiOperation({ summary: 'Get ticket types for event' })
  @ApiResponse({ status: 200, description: 'List of ticket types' })
  getTicketTypes(@Param('id') id: string) {
    return this.eventsService.findTicketTypesByEvent(id);
  }

  // ============= REGISTRATIONS =============

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  @ApiOperation({ summary: 'Register for an event' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Registration closed or validation error' })
  @ApiResponse({ status: 409, description: 'Already registered' })
  register(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() createRegistrationDto: CreateRegistrationDto,
  ) {
    return this.registrationService.register(
      eventId,
      userId,
      createRegistrationDto,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id/registrations')
  @ApiOperation({ summary: 'Get event registrations (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of registrations' })
  getRegistrations(
    @Param('id') eventId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.registrationService.findByEvent(eventId, paginationDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id/my-registration')
  @ApiOperation({ summary: 'Get current user registration for event' })
  @ApiResponse({ status: 200, description: 'User registration' })
  getMyRegistration(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationService.findUserRegistrationForEvent(eventId, userId);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('registrations/:id/status')
  @ApiOperation({ summary: 'Update registration status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  updateRegistrationStatus(
    @Param('id') id: string,
    @Body('status') status: RegistrationStatus,
  ) {
    return this.registrationService.updateStatus(id, status);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('registrations/:id/attendance')
  @ApiOperation({ summary: 'Mark attendance (Admin only)' })
  @ApiResponse({ status: 200, description: 'Attendance marked successfully' })
  markAttendance(@Param('id') id: string) {
    return this.registrationService.markAttendance(id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete('registrations/:id')
  @ApiOperation({ summary: 'Cancel own registration' })
  @ApiResponse({ status: 200, description: 'Registration cancelled successfully' })
  cancelRegistration(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationService.cancelRegistration(id, userId);
  }
}

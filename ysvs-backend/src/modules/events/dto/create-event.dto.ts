import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDate,
  IsNumber,
  ValidateNested,
  Min,
  IsArray,
  ArrayMinSize,
  IsUrl,
  ValidateIf,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventStatus,
  RegistrationAccess,
  GuestEmailMode,
  SessionType,
  EventMode,
  EventStreamProvider,
} from '../schemas/event.schema';
import { FormFieldDto } from './form-schema.dto';

class CoordinatesDto {
  @ApiProperty({ example: 15.3694 })
  @IsLatitude({ message: 'خط العرض غير صالح' })
  lat: number;

  @ApiProperty({ example: 44.191 })
  @IsLongitude({ message: 'خط الطول غير صالح' })
  lng: number;
}

class LocationDto {
  @ApiProperty({ example: 'فندق موفنبيك' })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiPropertyOptional({ example: 'Movenpick Hotel' })
  @IsOptional()
  @IsString()
  venueEn?: string;

  @ApiProperty({ example: 'شارع الزبيري' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Al-Zubairi Street' })
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiProperty({ example: 'صنعاء' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: "Sana'a" })
  @IsOptional()
  @IsString()
  cityEn?: string;

  @ApiPropertyOptional({
    example: { lat: 15.3694, lng: 44.191 },
    description: 'Selected map coordinates using web map picker',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

class EventSpeakerDto {
  @ApiProperty({ example: 'spk-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'د. محمد أحمد' })
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiPropertyOptional({ example: 'Dr. Mohammed Ahmed' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiProperty({ example: 'استشاري جراحة الأوعية الدموية' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiPropertyOptional({ example: 'Vascular Surgery Consultant' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ example: 'مستشفى الكويت الجامعي' })
  @IsOptional()
  @IsString()
  organizationAr?: string;

  @ApiPropertyOptional({ example: 'Kuwait University Hospital' })
  @IsOptional()
  @IsString()
  organizationEn?: string;

  @ApiPropertyOptional({ description: 'Biography in Arabic' })
  @IsOptional()
  @IsString()
  bioAr?: string;

  @ApiPropertyOptional({ description: 'Biography in English' })
  @IsOptional()
  @IsString()
  bioEn?: string;

  @ApiPropertyOptional({ description: 'Media library file id for speaker image' })
  @IsOptional()
  @IsString()
  imageMediaId?: string;

  @ApiPropertyOptional({ description: 'Resolved speaker image URL from media library' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class EventScheduleItemDto {
  @ApiProperty({ example: 'session-1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'الكلمة الافتتاحية' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiPropertyOptional({ example: 'Opening Remarks' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ description: 'Session description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Session description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  @IsDate({ message: 'وقت بداية الجلسة غير صالح' })
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ example: '2026-03-15T09:30:00.000Z' })
  @IsDate({ message: 'وقت نهاية الجلسة غير صالح' })
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({ enum: SessionType, example: SessionType.OPENING })
  @IsEnum(SessionType, { message: 'نوع الجلسة غير صالح' })
  sessionType: SessionType;

  @ApiPropertyOptional({
    type: [String],
    description: 'Speaker IDs linked to this session when needed',
  })
  @ValidateIf(
    (item: EventScheduleItemDto) =>
      ![
        SessionType.BREAK,
        SessionType.NETWORKING,
        SessionType.OPENING,
        SessionType.CLOSING,
      ].includes(item.sessionType),
  )
  @IsArray({ message: 'المتحدثون يجب أن يكونوا قائمة' })
  @ArrayMinSize(1, { message: 'هذه الجلسة تتطلب متحدثاً واحداً على الأقل' })
  @IsString({ each: true, message: 'معرف المتحدث غير صالح' })
  speakerIds?: string[];
}

class EventDayDto {
  @ApiProperty({ example: '2026-03-15T00:00:00.000Z' })
  @IsDate({ message: 'تاريخ اليوم غير صالح' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z' })
  @IsDate({ message: 'وقت بداية اليوم غير صالح' })
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ example: '2026-03-15T15:00:00.000Z' })
  @IsDate({ message: 'وقت نهاية اليوم غير صالح' })
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({ example: 6, description: 'اعتمادات CME لهذا اليوم' })
  @IsNumber({}, { message: 'ساعات CME اليومية يجب أن تكون رقماً' })
  @Min(0, { message: 'ساعات CME اليومية لا يمكن أن تكون سالبة' })
  cmeHours: number;
}

class EventLiveStreamDto {
  @ApiPropertyOptional({
    enum: EventStreamProvider,
    default: EventStreamProvider.YOUTUBE,
  })
  @IsOptional()
  @IsEnum(EventStreamProvider, { message: 'مزود البث غير صالح' })
  provider?: EventStreamProvider;

  @ApiPropertyOptional({
    description: 'Embed URL for inline player',
    example: 'https://www.youtube.com/embed/VIDEO_ID',
  })
  @IsOptional()
  @IsString()
  embedUrl?: string;

  @ApiPropertyOptional({
    description: 'External join URL for attendees',
    example: 'https://zoom.us/j/123456789',
  })
  @IsOptional()
  @IsUrl()
  joinUrl?: string;

  @ApiPropertyOptional({ description: 'Meeting ID for live session' })
  @IsOptional()
  @IsString()
  meetingId?: string;

  @ApiPropertyOptional({ description: 'Meeting passcode' })
  @IsOptional()
  @IsString()
  passcode?: string;

  @ApiPropertyOptional({ description: 'Joining instructions in Arabic' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Technical support contact details' })
  @IsOptional()
  @IsString()
  supportContact?: string;

  @ApiPropertyOptional({
    description: 'Minutes before start when joining is allowed',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  joinWindowMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recordingAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Recording URL after event ends' })
  @IsOptional()
  @IsUrl()
  recordingUrl?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'المؤتمر السنوي الخامس', description: 'Title in Arabic' })
  @IsString({ message: 'العنوان بالعربي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالعربي مطلوب' })
  titleAr: string;

  @ApiProperty({ example: 'Fifth Annual Conference', description: 'Title in English' })
  @IsString({ message: 'العنوان بالإنجليزي يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'العنوان بالإنجليزي مطلوب' })
  titleEn: string;

  @ApiProperty({ example: 'fifth-annual-conference', description: 'URL slug' })
  @IsString({ message: 'الرابط المختصر يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'الرابط المختصر مطلوب' })
  slug: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ example: '2026-03-15T09:00:00.000Z', description: 'Start date and time' })
  @IsDate({ message: 'تاريخ البداية غير صالح' })
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2026-03-17T18:00:00.000Z', description: 'End date and time' })
  @IsDate({ message: 'تاريخ النهاية غير صالح' })
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ enum: EventMode, default: EventMode.IN_PERSON })
  @IsOptional()
  @IsEnum(EventMode, { message: 'نوع المؤتمر غير صالح' })
  eventMode?: EventMode;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasLiveStream?: boolean;

  @ApiPropertyOptional({
    type: EventLiveStreamDto,
    description: 'Live stream settings linked to the event',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventLiveStreamDto)
  liveStream?: EventLiveStreamDto;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.UPCOMING })
  @IsOptional()
  @IsEnum(EventStatus, { message: 'حالة المؤتمر غير صالحة' })
  status?: EventStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  registrationOpen?: boolean;

  @ApiPropertyOptional({
    enum: RegistrationAccess,
    default: RegistrationAccess.AUTHENTICATED_ONLY,
    description: 'Who can register for this event',
  })
  @IsOptional()
  @IsEnum(RegistrationAccess, { message: 'سياسة التسجيل غير صالحة' })
  registrationAccess?: RegistrationAccess;

  @ApiPropertyOptional({
    enum: GuestEmailMode,
    default: GuestEmailMode.REQUIRED,
    description: 'Whether guest email is required when guest registration is allowed',
  })
  @IsOptional()
  @IsEnum(GuestEmailMode, { message: 'سياسة البريد للضيف غير صالحة' })
  guestEmailMode?: GuestEmailMode;

  @ApiPropertyOptional({ description: 'Registration deadline' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registrationDeadline?: Date;

  @ApiPropertyOptional({ default: 0, description: 'Maximum attendees (0 = unlimited)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAttendees?: number;

  @ApiPropertyOptional({ default: 0, description: 'CME credit hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cmeHours?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'What attendees will gain from this event',
    example: ['تحديثات عملية في جراحة الأوعية', 'ساعات CME معتمدة'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  outcomes?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Event objectives',
    example: ['رفع المعرفة بالتقنيات الحديثة', 'مناقشة أحدث الأدلة الإكلينيكية'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Target audience groups',
    example: ['جراحو الأوعية الدموية', 'أطباء الامتياز', 'المقيمون'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];

  @ApiPropertyOptional({
    type: [EventSpeakerDto],
    description: 'Event speakers metadata',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventSpeakerDto)
  speakers?: EventSpeakerDto[];

  @ApiPropertyOptional({
    type: [EventScheduleItemDto],
    description: 'Event timeline/schedule items',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventScheduleItemDto)
  schedule?: EventScheduleItemDto[];

  @ApiPropertyOptional({
    type: [EventDayDto],
    description: 'Conference days with daily timing and CME credits',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDayDto)
  eventDays?: EventDayDto[];

  @ApiPropertyOptional({
    type: [FormFieldDto],
    description: 'Dynamic registration form schema',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  formSchema?: FormFieldDto[];
}

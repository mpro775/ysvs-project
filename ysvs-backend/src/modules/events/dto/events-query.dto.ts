import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EventStatus } from '../schemas/event.schema';

export class EventsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by event status',
    enum: EventStatus,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

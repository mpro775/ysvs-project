import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  CreateFooterContentDto,
  CreateFooterQuickLinkDto,
  CreateFooterSocialLinkDto,
  CreateLegalPageDto,
} from './create-site-content.dto';

export class UpdateFooterQuickLinkDto extends PartialType(CreateFooterQuickLinkDto) {}

export class UpdateFooterSocialLinkDto extends PartialType(CreateFooterSocialLinkDto) {}

export class UpdateFooterContentDto extends PartialType(CreateFooterContentDto) {}

export class UpdateLegalPageDto extends PartialType(CreateLegalPageDto) {}

export class UpdateLegalPagesDto {
  @ApiPropertyOptional({ type: UpdateLegalPageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLegalPageDto)
  privacy?: UpdateLegalPageDto;

  @ApiPropertyOptional({ type: UpdateLegalPageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLegalPageDto)
  terms?: UpdateLegalPageDto;
}

export class UpdateSiteContentDto {
  @ApiPropertyOptional({ type: UpdateFooterContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateFooterContentDto)
  footer?: UpdateFooterContentDto;

  @ApiPropertyOptional({ type: UpdateLegalPagesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLegalPagesDto)
  legalPages?: UpdateLegalPagesDto;
}

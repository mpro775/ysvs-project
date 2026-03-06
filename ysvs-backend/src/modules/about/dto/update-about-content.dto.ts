import { PartialType } from '@nestjs/swagger';
import { CreateAboutContentDto } from './create-about-content.dto';

export class UpdateAboutContentDto extends PartialType(CreateAboutContentDto) {}

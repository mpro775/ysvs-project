import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderBoardMembersDto {
  @ApiProperty({
    type: [String],
    description: 'Array of member IDs in the new order',
    example: ['id1', 'id2', 'id3'],
  })
  @IsArray({ message: 'يجب أن تكون مصفوفة من المعرفات' })
  @ArrayMinSize(1, { message: 'يجب أن تحتوي المصفوفة على عنصر واحد على الأقل' })
  @IsString({ each: true, message: 'كل معرف يجب أن يكون نصاً' })
  memberIds: string[];
}

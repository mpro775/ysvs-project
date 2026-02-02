import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BoardService } from './board.service';
import {
  CreateBoardMemberDto,
  UpdateBoardMemberDto,
  ReorderBoardMembersDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Board')
@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('members')
  @ApiOperation({ summary: 'Add a new board member (Admin only)' })
  @ApiResponse({ status: 201, description: 'Board member added successfully' })
  create(@Body() createBoardMemberDto: CreateBoardMemberDto) {
    return this.boardService.create(createBoardMemberDto);
  }

  @Public()
  @Get('members')
  @ApiOperation({ summary: 'Get all active board members' })
  @ApiResponse({ status: 200, description: 'List of board members' })
  findAll() {
    return this.boardService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('members/all')
  @ApiOperation({ summary: 'Get all board members including inactive (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all board members' })
  findAllAdmin() {
    return this.boardService.findAllAdmin();
  }

  @Public()
  @Get('members/:id')
  @ApiOperation({ summary: 'Get board member by ID' })
  @ApiResponse({ status: 200, description: 'Board member details' })
  @ApiResponse({ status: 404, description: 'Board member not found' })
  findOne(@Param('id') id: string) {
    return this.boardService.findOne(id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('members/reorder')
  @ApiOperation({ summary: 'Reorder board members (Admin only)' })
  @ApiResponse({ status: 200, description: 'Board members reordered successfully' })
  reorder(@Body() reorderDto: ReorderBoardMembersDto) {
    return this.boardService.reorder(reorderDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('members/:id')
  @ApiOperation({ summary: 'Update board member (Admin only)' })
  @ApiResponse({ status: 200, description: 'Board member updated successfully' })
  @ApiResponse({ status: 404, description: 'Board member not found' })
  update(
    @Param('id') id: string,
    @Body() updateBoardMemberDto: UpdateBoardMemberDto,
  ) {
    return this.boardService.update(id, updateBoardMemberDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete('members/:id')
  @ApiOperation({ summary: 'Delete board member (Admin only)' })
  @ApiResponse({ status: 200, description: 'Board member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Board member not found' })
  remove(@Param('id') id: string) {
    return this.boardService.remove(id);
  }
}

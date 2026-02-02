import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { BoardMember, BoardMemberDocument } from './schemas/board-member.schema';
import {
  CreateBoardMemberDto,
  UpdateBoardMemberDto,
  ReorderBoardMembersDto,
} from './dto';

@Injectable()
export class BoardService {
  private readonly CACHE_KEY = 'board:members';
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    @InjectModel(BoardMember.name)
    private boardMemberModel: Model<BoardMemberDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createBoardMemberDto: CreateBoardMemberDto): Promise<BoardMember> {
    // Get the highest order number and add 1
    const lastMember = await this.boardMemberModel
      .findOne()
      .sort({ order: -1 })
      .exec();

    const order = createBoardMemberDto.order ?? (lastMember ? lastMember.order + 1 : 0);

    const member = new this.boardMemberModel({
      ...createBoardMemberDto,
      order,
    });

    const savedMember = await member.save();
    await this.invalidateCache();
    return savedMember;
  }

  async findAll(): Promise<BoardMember[]> {
    const cached = await this.cacheManager.get<BoardMember[]>(this.CACHE_KEY);

    if (cached) {
      return cached;
    }

    const members = await this.boardMemberModel
      .find({ isActive: true })
      .sort({ order: 1 })
      .exec();

    await this.cacheManager.set(this.CACHE_KEY, members, this.CACHE_TTL);
    return members;
  }

  async findAllAdmin(): Promise<BoardMember[]> {
    return this.boardMemberModel.find().sort({ order: 1 }).exec();
  }

  async findOne(id: string): Promise<BoardMember> {
    const member = await this.boardMemberModel.findById(id).exec();

    if (!member) {
      throw new NotFoundException('عضو مجلس الإدارة غير موجود');
    }

    return member;
  }

  async update(
    id: string,
    updateBoardMemberDto: UpdateBoardMemberDto,
  ): Promise<BoardMember> {
    const member = await this.boardMemberModel
      .findByIdAndUpdate(id, updateBoardMemberDto, { new: true })
      .exec();

    if (!member) {
      throw new NotFoundException('عضو مجلس الإدارة غير موجود');
    }

    await this.invalidateCache();
    return member;
  }

  async remove(id: string): Promise<void> {
    const result = await this.boardMemberModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('عضو مجلس الإدارة غير موجود');
    }

    await this.invalidateCache();
  }

  async reorder(reorderDto: ReorderBoardMembersDto): Promise<BoardMember[]> {
    const { memberIds } = reorderDto;

    // Update order for each member
    const updateOperations = memberIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await this.boardMemberModel.bulkWrite(updateOperations);
    await this.invalidateCache();

    return this.findAllAdmin();
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
  }
}

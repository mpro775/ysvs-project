import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import {
  ProfessionalVerificationStatus,
  User,
  UserDocument,
} from './schemas/user.schema';
import {
  CreateUserDto,
  ProfessionalVerificationQueryDto,
  ProfessionalVerificationReviewDto,
  UpdateUserDto,
} from './dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/decorators/roles.decorator';
import { NotificationsPublisherService } from '../notifications/notifications.publisher.service';
import { MediaService } from '../media/media.service';
import { MediaType } from '../media/dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsPublisherService: NotificationsPublisherService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      throw new ConflictException('هذا البريد الإلكتروني مسجل مسبقاً');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      membershipDate: new Date(),
    });
    const savedUser = await user.save();

    if (savedUser.role === UserRole.MEMBER) {
      this.notificationsPublisherService.publishToAdmins({
        type: 'member.created',
        title: 'عضو جديد',
        message: `تم إنشاء حساب عضو جديد: ${savedUser.fullNameAr}`,
        entityId: savedUser._id.toString(),
        entityType: 'user',
        severity: 'info',
        actionUrl: '/admin/members',
        meta: {
          email: savedUser.email,
          source: 'admin_create',
        },
      });
    }

    return savedUser;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .select('-password -refreshToken -passwordResetToken -verificationToken')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(),
    ]);

    return new PaginatedResult(users, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('-password -refreshToken -passwordResetToken -verificationToken')
      .exec();

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();
  }

  async findByEmailWithRefreshToken(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+refreshToken')
      .exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userModel
      .findById(id)
      .select('isActive role fullNameAr')
      .exec();

    if (!existingUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password -refreshToken -passwordResetToken -verificationToken')
      .exec();

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const becameActiveMember =
      existingUser.role === UserRole.MEMBER &&
      existingUser.isActive === false &&
      user.isActive === true;

    if (becameActiveMember) {
      this.notificationsPublisherService.publishToAdmins({
        type: 'member.activated',
        title: 'تفعيل عضو',
        message: `تم تفعيل العضو: ${user.fullNameAr}`,
        entityId: user._id.toString(),
        entityType: 'user',
        severity: 'info',
        actionUrl: '/admin/members',
      });
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('المستخدم غير موجود');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 12)
      : null;

    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });
  }

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
  }

  async verifyUser(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
      professionalVerification: {
        status: ProfessionalVerificationStatus.APPROVED,
      },
    });
  }

  async uploadProfessionalVerificationDocument(
    userId: string,
    file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken -passwordResetToken -verificationToken')
      .exec();

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const uploadedFile = await this.mediaService.uploadFile(
      file,
      MediaType.DOCUMENT,
      `member-verification/${userId}`,
    );

    user.professionalVerification = {
      status: ProfessionalVerificationStatus.PENDING,
      document: {
        key: uploadedFile.path,
        url: uploadedFile.url,
        originalName: uploadedFile.originalName,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size,
        uploadedAt: new Date(),
      },
      reviewedAt: undefined,
      reviewedBy: undefined,
      rejectionReason: undefined,
      lastSubmittedAt: new Date(),
    };
    user.isVerified = false;

    await user.save();

    this.notificationsPublisherService.publishToAdmins({
      type: 'member.verification_submitted',
      title: 'طلب توثيق عضو',
      message: `رفع العضو ${user.fullNameAr} بطاقة مزاولة جديدة`,
      entityId: user._id.toString(),
      entityType: 'user',
      severity: 'warning',
      actionUrl: '/admin/members',
      meta: {
        verificationStatus: ProfessionalVerificationStatus.PENDING,
      },
    });

    return user;
  }

  async getProfessionalVerification(userId: string): Promise<{
    status: ProfessionalVerificationStatus;
    document?: User['professionalVerification']['document'];
    rejectionReason?: string;
    reviewedAt?: Date;
    reviewedBy?: string;
    lastSubmittedAt?: Date;
  }> {
    const user = await this.userModel
      .findById(userId)
      .select('professionalVerification')
      .exec();

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return {
      status:
        user.professionalVerification?.status ||
        ProfessionalVerificationStatus.NOT_SUBMITTED,
      document: user.professionalVerification?.document,
      rejectionReason: user.professionalVerification?.rejectionReason,
      reviewedAt: user.professionalVerification?.reviewedAt,
      reviewedBy: user.professionalVerification?.reviewedBy,
      lastSubmittedAt: user.professionalVerification?.lastSubmittedAt,
    };
  }

  async findProfessionalVerifications(
    queryDto: ProfessionalVerificationQueryDto,
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, status, search } = queryDto;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      role: UserRole.MEMBER,
    };

    if (status) {
      query['professionalVerification.status'] = status;
    }

    if (search?.trim()) {
      const trimmedSearch = search.trim();
      query.$or = [
        { fullNameAr: { $regex: trimmedSearch, $options: 'i' } },
        { fullNameEn: { $regex: trimmedSearch, $options: 'i' } },
        { email: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select(
          '-password -refreshToken -passwordResetToken -verificationToken -verificationExpires',
        )
        .sort({ 'professionalVerification.lastSubmittedAt': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return new PaginatedResult(users, total, page, limit);
  }

  async reviewProfessionalVerification(
    targetUserId: string,
    reviewDto: ProfessionalVerificationReviewDto,
    reviewerUserId: string,
  ): Promise<User> {
    const user = await this.userModel
      .findById(targetUserId)
      .select('-password -refreshToken -passwordResetToken -verificationToken')
      .exec();

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.professionalVerification?.document?.url) {
      throw new BadRequestException('لا يوجد ملف مزاولة مرفوع لهذا العضو');
    }

    if (reviewDto.decision === 'rejected') {
      const reason = reviewDto.rejectionReason?.trim();
      if (!reason) {
        throw new BadRequestException('سبب الرفض مطلوب عند رفض الطلب');
      }

      user.professionalVerification = {
        ...(user.professionalVerification || {}),
        status: ProfessionalVerificationStatus.REJECTED,
        rejectionReason: reason,
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
      };
      user.isVerified = false;
    } else {
      user.professionalVerification = {
        ...(user.professionalVerification || {}),
        status: ProfessionalVerificationStatus.APPROVED,
        rejectionReason: undefined,
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
      };
      user.isVerified = true;
    }

    await user.save();

    this.notificationsPublisherService.publishToAdmins({
      type: 'member.verification_reviewed',
      title: 'مراجعة توثيق عضو',
      message:
        reviewDto.decision === 'approved'
          ? `تم اعتماد توثيق العضو ${user.fullNameAr}`
          : `تم رفض توثيق العضو ${user.fullNameAr}`,
      entityId: user._id.toString(),
      entityType: 'user',
      severity: reviewDto.decision === 'approved' ? 'success' : 'warning',
      actionUrl: '/admin/members',
    });

    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    });
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.userModel
      .findById(userId)
      .select('+refreshToken')
      .exec();

    if (!user || !user.refreshToken) {
      return false;
    }

    return bcrypt.compare(refreshToken, user.refreshToken);
  }
}

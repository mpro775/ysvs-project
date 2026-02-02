import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto, ChangePasswordDto } from './dto';
import { UserRole } from '../../common/decorators/roles.decorator';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('الحساب معطل');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      fullNameAr: user.fullNameAr,
      fullNameEn: user.fullNameEn,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.MEMBER,
    });

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    await this.usersService.updateLastLogin(user._id.toString());

    return {
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullNameAr: user.fullNameAr,
          fullNameEn: user.fullNameEn,
          role: user.role,
        },
        ...tokens,
      },
      message: 'تم التسجيل بنجاح',
    };
  }

  async login(user: { id: string; email: string; role: string }) {
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);
    await this.usersService.updateLastLogin(user.id);

    const fullUser = await this.usersService.findOne(user.id);

    return {
      data: {
        user: {
          id: fullUser._id,
          email: fullUser.email,
          fullNameAr: fullUser.fullNameAr,
          fullNameEn: fullUser.fullNameEn,
          role: fullUser.role,
          avatar: fullUser.avatar,
        },
        ...tokens,
      },
      message: 'تم تسجيل الدخول بنجاح',
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'تم تسجيل الخروج بنجاح' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const isValid = await this.usersService.validateRefreshToken(
      userId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Refresh token غير صالح');
    }

    const user = await this.usersService.findOne(userId);

    const tokens = await this.generateTokens({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await this.usersService.updateRefreshToken(userId, tokens.refreshToken);

    return {
      data: tokens,
      message: 'تم تجديد التوكن بنجاح',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal that email doesn't exist
      return { message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.setPasswordResetToken(
      user._id.toString(),
      resetToken,
      resetExpires,
    );

    // TODO: Send email with reset link
    // For now, just return success message
    // In production, you would send: `${frontendUrl}/reset-password?token=${resetToken}`

    return { message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByPasswordResetToken(token);

    if (!user) {
      throw new BadRequestException('رمز إعادة التعيين غير صالح أو منتهي الصلاحية');
    }

    await this.usersService.updatePassword(user._id.toString(), newPassword);

    return { message: 'تم إعادة تعيين كلمة المرور بنجاح' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findByEmail(
      (await this.usersService.findOne(userId)).email,
    );

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    await this.usersService.updatePassword(userId, changePasswordDto.newPassword);

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      data: user,
      message: 'تم جلب بيانات المستخدم بنجاح',
    };
  }

  private async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email, role: payload.role },
      {
        secret: this.configService.get<string>('jwt.secret') || 'default-secret',
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email, role: payload.role },
      {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
        expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
      },
    );

    return { accessToken, refreshToken };
  }
}

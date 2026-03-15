import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { UserRole } from '../../../common/decorators/roles.decorator';

export type UserDocument = HydratedDocument<User>;

export enum ProfessionalVerificationStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export interface VerificationDocument {
  key: string;
  url: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface ProfessionalVerification {
  status: ProfessionalVerificationStatus;
  document?: VerificationDocument;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  lastSubmittedAt?: Date;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true })
  fullNameAr: string;

  @Prop({ required: true, trim: true })
  fullNameEn: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Prop({ trim: true })
  specialty: string;

  @Prop({ trim: true })
  jobTitle: string;

  @Prop({ trim: true })
  workplace: string;

  @Prop({ trim: true })
  country: string;

  @Prop({
    type: String,
    enum: Object.values(Gender),
  })
  gender?: Gender;

  @Prop()
  membershipDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  avatar: string;

  @Prop()
  refreshToken: string;

  @Prop()
  passwordResetToken: string;

  @Prop()
  passwordResetExpires: Date;

  @Prop()
  verificationToken: string;

  @Prop()
  verificationExpires: Date;

  @Prop()
  lastLoginAt: Date;

  @Prop({
    type: {
      status: {
        type: String,
        enum: Object.values(ProfessionalVerificationStatus),
        default: ProfessionalVerificationStatus.NOT_SUBMITTED,
      },
      document: {
        key: { type: String, trim: true },
        url: { type: String, trim: true },
        originalName: { type: String, trim: true },
        mimetype: { type: String, trim: true },
        size: { type: Number },
        uploadedAt: { type: Date },
      },
      reviewedBy: { type: String, trim: true },
      reviewedAt: { type: Date },
      rejectionReason: { type: String, trim: true },
      lastSubmittedAt: { type: Date },
    },
    default: {
      status: ProfessionalVerificationStatus.NOT_SUBMITTED,
    },
  })
  professionalVerification: ProfessionalVerification;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'professionalVerification.status': 1 });
UserSchema.index({ fullNameAr: 'text', fullNameEn: 'text' });

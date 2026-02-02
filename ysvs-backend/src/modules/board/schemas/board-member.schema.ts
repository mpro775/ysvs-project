import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type BoardMemberDocument = HydratedDocument<BoardMember>;

@Schema({ timestamps: true })
export class BoardMember extends Document {
  @Prop({ required: true, trim: true })
  nameAr: string;

  @Prop({ required: true, trim: true })
  nameEn: string;

  @Prop({ required: true, trim: true })
  positionAr: string;

  @Prop({ required: true, trim: true })
  positionEn: string;

  @Prop({ trim: true })
  bioAr: string;

  @Prop({ trim: true })
  bioEn: string;

  @Prop()
  image: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const BoardMemberSchema = SchemaFactory.createForClass(BoardMember);

// Indexes
BoardMemberSchema.index({ isActive: 1, order: 1 });

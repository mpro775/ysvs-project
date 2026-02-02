import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type TicketTypeDocument = HydratedDocument<TicketType>;

@Schema({ timestamps: true })
export class TicketType extends Document {
  @Prop({ required: true, trim: true })
  nameAr: string;

  @Prop({ required: true, trim: true })
  nameEn: string;

  @Prop({ trim: true })
  descriptionAr: string;

  @Prop({ trim: true })
  descriptionEn: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ default: 'YER' })
  currency: string;

  @Prop({ default: 0 })
  maxQuantity: number;

  @Prop({ default: 0 })
  soldQuantity: number;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  saleStartDate: Date;

  @Prop()
  saleEndDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const TicketTypeSchema = SchemaFactory.createForClass(TicketType);

// Indexes
TicketTypeSchema.index({ event: 1, isActive: 1 });

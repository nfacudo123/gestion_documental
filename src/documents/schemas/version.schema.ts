import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DocumentVersion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'DocumentEntity', required: true, index: true })
  documentId: Types.ObjectId;

  @Prop({ required: true })
  version: number;

  @Prop({ required: true })
  storageKey: string;

  @Prop()
  hash: string;

  @Prop()
  mimeType: string;

  @Prop({ type: Types.ObjectId, required: true })
  createdBy: Types.ObjectId;
}

export const VersionSchema = SchemaFactory.createForClass(DocumentVersion);
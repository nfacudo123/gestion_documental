import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'DocumentEntity', index: true })
  documentId: Types.ObjectId;

  @Prop({ required: true })
  action: string; 

  @Prop({ required: true })
  actorId: string; // ID del usuario que realizó la acción

  @Prop()
  ip: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Object })
  details: any; // Para guardar qué cambió o el resultado
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
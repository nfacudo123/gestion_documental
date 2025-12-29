import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'documents' })
export class DocumentEntity extends Document {
  @Prop({ required: true, index: true })
  customerId: string;

  @Prop()
  processId?: string;

  @Prop({
    type: {
      domain: String,
      category: String,
      docType: String,
    },
    _id: false,
    required: true,
  })
  taxonomy: {
    domain: string;
    category: string;
    docType: string;
  };

  @Prop({ type: Number, default: 1 })
  currentVersion: number;

  @Prop({
    type: {
      owners: [String],
      readers: [String],
      updaters: [String],
      roles: [String],
    },
    _id: false,
    required: true,
  })
  acl: {
    owners: string[];
    readers: string[];
    updaters: string[];
    roles: string[];
  };

  @Prop({
    type: {
      policyId: String,
      deleteAt: Date, 
      mode: String,
    },
    _id: false,
  })
  retention: { 
    policyId?: string;
    deleteAt?: Date;
    mode: string;
  };

  @Prop({ index: true })
  deletedAt?: Date;

  // Timestamps automáticos por @Schema({ timestamps: true })
  createdAt: Date;
  updatedAt: Date;
  retentionPolicy?: any; 
}

export const DocumentEntitySchema = SchemaFactory.createForClass(DocumentEntity);
DocumentEntitySchema.index({ customerId: 1 });
DocumentEntitySchema.index({ 'taxonomy.domain': 1, 'taxonomy.category': 1, 'taxonomy.docType': 1 });
DocumentEntitySchema.index({ createdAt: 1 });
DocumentEntitySchema.index({ deletedAt: 1 }, { sparse: true });
DocumentEntitySchema.index({ 'retention.deleteAt': 1 }); 
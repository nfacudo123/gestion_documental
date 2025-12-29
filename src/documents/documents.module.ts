import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentEntity, DocumentEntitySchema } from './schemas/document.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { RetentionTaskService } from './tasks/retention-task.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentEntitySchema },
      { name: AuditLog.name, schema: AuditLogSchema }
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, RetentionTaskService],
})
export class DocumentsModule {}
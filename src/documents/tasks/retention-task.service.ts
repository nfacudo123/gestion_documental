import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentEntity } from '../schemas/document.schema';
import { AuditLog } from '../schemas/audit-log.schema'; 

@Injectable()
export class RetentionTaskService {
  private readonly logger = new Logger(RetentionTaskService.name);

  constructor(
    @InjectModel(DocumentEntity.name) 
    private docModel: Model<DocumentEntity>,
    
    @InjectModel(AuditLog.name)
    private auditModel: Model<AuditLog>, 
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRetentionCleanup() {
    this.logger.log('Iniciando proceso automático de retención legal...');

    const now = new Date();

    // Buscar documentos expirados según el modelo sugerido
    const expiredDocs = await this.docModel.find({
      'retention.deleteAt': { $lte: now },
      deletedAt: { $exists: false },
    });

    for (const doc of expiredDocs) {
      try {
        let actionTaken: string;

        if (doc.retention.mode === 'HARD') {
          await this.docModel.findByIdAndDelete(doc._id);
          actionTaken = 'HARD_DELETE_EXPIRATION';
        } else {
          await this.docModel.findByIdAndUpdate(doc._id, {
            $set: { deletedAt: new Date() },
          });
          actionTaken = 'SOFT_DELETE_EXPIRATION';
        }

        // Registro de Auditoría usando TUS campos (details, actorId, action)
        const auditEntry = new this.auditModel({
          documentId: doc._id,
          action: actionTaken,
          actorId: 'SYSTEM_CRON_WORKER',
          ip: '127.0.0.1',
          userAgent: 'NodeJS-Cron-Service',
          details: { 
            policyId: doc.retention.policyId,
            executionDate: new Date(),
            result: 'SUCCESS',
            version: doc.currentVersion
          }
        });
        
        await auditEntry.save();
        this.logger.log(`[${actionTaken}] Procesado: ${doc._id}`);

      } catch (error) {
        this.logger.error(`Error en documento ${doc._id}: ${error.message}`);
      }
    }
    this.logger.log('Proceso de limpieza finalizado.');
  }
}
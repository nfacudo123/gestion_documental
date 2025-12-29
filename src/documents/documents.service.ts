import { Injectable, NotFoundException, BadRequestException,ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentEntity } from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { AuditLog } from './schemas/audit-log.schema';
import { UpdateAclDto } from './dto/update-acl.dto';
import { UpdateRetentionDto } from './dto/update-retention.dto';
import { isValidObjectId } from 'mongoose';
import { CreateVersionDto } from './dto/create-version.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentEntity.name) private readonly docModel: Model<DocumentEntity>,
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLog>,
  ) {}

  async create(dto: CreateDocumentDto, customerId: string) {
    const newDoc = new this.docModel({
        ...dto,
        customerId: customerId,
        currentVersion: 1,
        // No incluimos 'retention' aquí para que nazca vacío/nulo en la DB
    });
    return await newDoc.save();
    }

  async findAll(domain?: string, page: number = 1, limit: number = 10) {
    const query: any = { deletedAt: null }; // Siempre excluimos los borrados

    // Filtro dinámico por dominio si se proporciona
    if (domain) {
      query['taxonomy.domain'] = { $regex: domain, $options: 'i' }; 
      // Búsqueda parcial e insensible a mayúsculas
    }

    const skip = (page - 1) * limit;

    // Ejecutamos la consulta con paginación
    const [data, total] = await Promise.all([
      this.docModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.docModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
  

    async findOne(id: string) {
    // Validar si el ID tiene el formato correcto para mongo
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`El ID proporcionado no es válido. Verifique el formato.`);
    }

    // Buscar el documento
    const doc = await this.docModel.findById(id).exec();
    
    // Si no existe, dar aviso
    if (!doc) {
      throw new NotFoundException(`No existe ningún documento bajo el ID: ${id}`);
    }
    
    await this.logAction((doc._id as Types.ObjectId).toString(), 'READ');
    return doc;
  }

    async createVersion(id: string, createVersionDto: CreateVersionDto) {
        if (!isValidObjectId(id)) throw new BadRequestException('ID no válido');

        const doc = await this.docModel.findById(id);
        if (!doc) throw new NotFoundException('Documento no encontrado');

        // Incremento manual para asegurar que se guarde
        doc.currentVersion = (doc.currentVersion || 1) + 1;
        
        // Guardamos el cambio físicamente en la base de datos
        await doc.save(); 

        return {
        message: "Versión registrada en base de datos",
        documentId: id,
        newVersion: doc.currentVersion,
        comment: createVersionDto.comment
        };
    }

//Agregamos tenantId como tercer parámetro
async getDownloadUrl(id: string, version?: number, tenantId?: string) {
    const doc = await this.docModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Documento no encontrado');

    // Evaluación de ACL y Tenant
    const docData = doc as any; 
    if (docData.tenantId && tenantId && docData.tenantId !== tenantId) {
      throw new ForbiddenException('Acceso denegado: El documento pertenece a otra organización.');
    }

    const targetVersion = version || doc.currentVersion;

    if (targetVersion > doc.currentVersion) {
      throw new BadRequestException(
        `Alerta: La versión ${targetVersion} no existe. Tienes 10 minutos para descargar las versiones existentes.`
      );
    }

    const fileName = `documento_${id}_v${targetVersion}.txt`;
    const tempDir = path.join(process.cwd(), 'temp-downloads');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const filePath = path.join(tempDir, fileName);

    const contenido = `
      ==================================================
      REPORTE DE DOCUMENTO - DESCARGA TEMPORAL
      ==================================================
      ID DEL DOCUMENTO: ${id}
      VERSIÓN GENERADA: ${targetVersion}
      FECHA: ${new Date().toLocaleString()}
      TENANT: ${tenantId || 'N/A'} 
      ==================================================
    `;

    fs.writeFileSync(filePath, contenido);

    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 600000); 

    return {
      message: "¡Archivo generado con éxito! Tienes 10 minutos para descargarlo antes de que sea eliminado.",
      downloadUrl: `http://localhost:3000/documents/download-file/${fileName}`,
      fileName
    };
}

  async getDocumentVersions(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('ID no válido.');
    
    const doc = await this.docModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Documento no encontrado');
    const history: any[] = []; 
    const totalVersions = doc.currentVersion || 1;

    for (let i = 1; i <= totalVersions; i++) {
      history.push({
        version: i,
        documentId: id,
        author: 'admin_test',
        status: i === totalVersions ? 'CURRENT' : 'ARCHIVED'
      });
    }

    return history;
  }

  async updateAcl(id: string, updateAclDto: UpdateAclDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Formato de ID incorrecto.');
    }

    const updatedDoc = await this.docModel.findByIdAndUpdate(
      id,
      { $set: { acl: updateAclDto } },
      { new: true },
    ).exec();

    if (!updatedDoc) {
      throw new NotFoundException(`Este documento no está bajo este ID: ${id}`);
    }
    
    await this.logAction((updatedDoc._id as Types.ObjectId).toString(), 'UPDATE_ACL', { newAcl: updateAclDto });
    return updatedDoc;
  }

    async updateRetention(id: string, dto: UpdateRetentionDto) {
    // Calculamos la fecha: Hoy + N años
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + dto.retentionYear);

    const retentionData = {
        policyId: dto.policyId,
        mode: dto.mode,
        deleteAt: expirationDate, // Se guarda como Date para el índice de base de datos
    };

    return await this.docModel.findByIdAndUpdate(
        id,
        { $set: { retention: retentionData } },
        { new: true }
    );
    }

    async remove(id: string) {
        if (!isValidObjectId(id)) throw new BadRequestException('ID no válido');

        const doc = await this.docModel.findById(id);
        if (!doc) throw new NotFoundException('Documento no encontrado');

    // Validación de la política vigente
    if (doc.retentionPolicy && doc.retentionPolicy.expiryDate) {
      const hoy = new Date();
      const fechaExpiracion = new Date(doc.retentionPolicy.expiryDate);

      if (hoy < fechaExpiracion) {
        throw new BadRequestException(
          `BLOQUEO LEGAL: Este documento tiene una política de retención activa hasta el ${fechaExpiracion.toLocaleDateString()}. No puede ser eliminado.`
        );
      }
    }

    // Si pasa la validación, procedemos al borrado (se puede usar soft delete o remove)
    return await this.docModel.findByIdAndDelete(id);
  }

  // Método privado para reutilizar la lógica de auditoría
  private async logAction(docId: string, action: string, details?: any) {
    const log = new this.auditModel({
      documentId: new Types.ObjectId(docId),
      action,
      actorId: 'user_admin_test',
      details,
    });
    await log.save();
  }
}

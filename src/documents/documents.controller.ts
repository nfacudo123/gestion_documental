import { Controller, Post, Get, Patch, Delete, Body, Param, Query,NotFoundException,Res, Req,UseGuards} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateAclDto } from './dto/update-acl.dto';
import { UpdateRetentionDto } from './dto/update-retention.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiExcludeEndpoint, ApiHeader } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import * as path from 'path';
import * as fs from 'fs';

// --- NUEVAS IMPORTACIONES PARA EL PUNTO 3 ---
import { AuthGuard } from '../auth/auth.guard'; 
import { Roles } from '../auth/roles.decorator';

@ApiTags('Documents')
@UseGuards(AuthGuard) 
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles('ADMIN') // ACL: Solo administradores crean documentos
  @ApiOperation({ summary: 'Registrar documento' })
    async create(@Body() createDto: CreateDocumentDto, @Req() req: any) {
    const customerId = req.user.tenantId; 
    
    return this.documentsService.create(createDto, customerId);
    }

  @Get()
  @ApiOperation({ summary: 'Listar documentos con filtros y paginación' })
  @ApiQuery({ name: 'domain', required: false, description: 'Filtrar por dominio (ej: FINANZAS)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findAll(
    @Query('domain') domain?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.documentsService.findAll(domain, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle real de un documento por ID' })
  async findOne(@Param('id') id: string) {
    return await this.documentsService.findOne(id);
  }

  @Post(':id/versions')
  @Roles('ADMIN', 'USER') // ACL: Ambos pueden versionar
  async createVersion(
    @Param('id') id: string,
    @Body() createVersionDto: CreateVersionDto,
  ) {
    return await this.documentsService.createVersion(id, createVersionDto);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Listar historial real de versiones del documento' })
  async getVersions(@Param('id') id: string) {
    return await this.documentsService.getDocumentVersions(id);
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Visualización segura' })
  async getContent(
    @Param('id') id: string, 
    @Req() req: any,
    @Query('version') version?: number
  ) {
    
    // Conexión final: Pasamos el tenantId al servicio para validar ACL
    return await this.documentsService.getDownloadUrl(
      id, 
      version ? Number(version) : undefined, 
      req.user.tenantId
    );
  }

  @Patch(':id/acl')
  @Roles('ADMIN') // ACL: Solo administradores gestionan permisos
  @ApiOperation({ summary: 'Actualizar permisos (ACL) en base de datos' })
  async updateAcl(
    @Param('id') id: string, 
    @Body() updateAclDto: UpdateAclDto
  ) {
    return await this.documentsService.updateAcl(id, updateAclDto);
  }

  @Patch(':id/retention')
    @ApiOperation({ summary: 'Actualizar política de retención legal' })
    async updateRetention(
    @Param('id') id: string,
    @Body() retentionDto: UpdateRetentionDto
    ) {
    return this.documentsService.updateRetention(id, retentionDto);
    }

  @Delete(':id')
  @Roles('ADMIN') // ACL: Solo el ADMIN puede borrar
  @ApiOperation({ summary: 'Borrado lógico (Soft Delete)' })
  async remove(@Param('id') id: string) {
    return await this.documentsService.remove(id);
  }

  @ApiExcludeEndpoint() 
  @Get('download-file/:fileName')
  async downloadFile(@Param('fileName') fileName: string, @Res() res: Response, @Query('mode') mode: string) {
    const filePath = path.join(process.cwd(), 'temp-downloads', fileName);

    if (!fs.existsSync(filePath)) throw new NotFoundException('Expirado');

    // Seguridad: Prevenir almacenamiento en caché de archivos sensibles
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Control: Visualización (inline) vs Descarga (attachment)
    const disposition = mode === 'download' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);

    res.sendFile(filePath);
  }
}
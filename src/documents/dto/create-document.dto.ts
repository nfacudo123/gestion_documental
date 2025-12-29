import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ example: 'PROC-ADMIN-001', required: false })
  processId?: string;

  @ApiProperty({ 
    example: { domain: 'RRHH', category: 'Contratos', docType: 'PDF' } 
  })
  taxonomy: { domain: string; category: string; docType: string };

  @ApiProperty({ 
    example: { 
      owners: ['admin_user'], 
      readers: ['staff_group'], 
      updaters: [], 
      roles: ['ADMIN'] 
    } 
  })
  acl: { owners: string[]; readers: string[]; updaters: string[]; roles: string[] };
}
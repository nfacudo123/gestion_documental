import { ApiProperty } from '@nestjs/swagger';

export class UpdateRetentionDto {
  @ApiProperty({ example: 'RET-01', description: 'ID de la política' })
  policyId: string;

  @ApiProperty({ example: 5, description: 'Años de retención a partir de hoy' })
  retentionYear: number;

  @ApiProperty({ example: 'SOFT', enum: ['SOFT', 'HARD'] })
  mode: string;
}
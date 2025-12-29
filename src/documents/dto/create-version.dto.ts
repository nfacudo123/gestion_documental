import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Nuevo archivo binario' })
  file: any;

  @ApiProperty({ example: 'Corrección de firmas', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}
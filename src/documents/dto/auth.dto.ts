import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ 
    example: 'ADMIN', 
    description: 'Rol del usuario (ADMIN o USER)',
    enum: ['ADMIN', 'USER'] 
  })
  @IsString() 
  @IsEnum(['ADMIN', 'USER'])
  @IsNotEmpty()
  role: string;

  @ApiProperty({ 
    example: 't1', 
    description: 'ID de la empresa (Tenant)' 
  })
  @IsString() 
  @IsNotEmpty()
  tenantId: string;
}
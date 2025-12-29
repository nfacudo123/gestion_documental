import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAclDto {
  @ApiProperty({ example: ['user_001', 'user_002'], description: 'Usuarios con permiso de lectura' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readers?: string[];

  @ApiProperty({ example: ['admin_01'], description: 'Usuarios con permiso de edición' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  updaters?: string[];

  @ApiProperty({ example: ['role_manager'], description: 'Roles con acceso' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];
}
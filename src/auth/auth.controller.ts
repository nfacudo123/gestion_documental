import { Controller, Post, Body, Delete, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthDto } from '../documents/dto/auth.dto';

const registeredUsers: AuthDto[] = [];

export interface SessionState {
  token: string | null;
  role: string | null;
  tenantId: string | null;
}

export const activeSession: SessionState = {
  token: null,
  role: null,
  tenantId: null
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo par Rol + Tenant' })
  register(@Body() data: AuthDto) {
    const exists = registeredUsers.find(u => u.role === data.role && u.tenantId === data.tenantId);
    if (!exists) {
      registeredUsers.push(data);
        return { message: 'Usuario y Tenant registrados exitosamente', data };
    }else{
        return { message: 'El Usuario y Tenant ya existen en el sistema', data };
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con validación de sesión activa' })
  login(@Body() data: AuthDto) {
    
    if (activeSession.token) {
      throw new BadRequestException(
        `No te puedes loguear de nuevo ya que el tenant ${activeSession.tenantId} está activo en el sistema, si quieres ingresar con otra cuenta, desloguea al tenant actual`
      );
    }

    const user = registeredUsers.find(
      u => u.role === data.role && u.tenantId === data.tenantId
    );

    if (!user) {
      throw new UnauthorizedException('No se puede loguear porque no existe el rol o tenant especificado');
    }

    activeSession.token = 'session-' + Math.random().toString(36).substring(7);
    activeSession.role = data.role;
    activeSession.tenantId = data.tenantId;
    
    return { 
      message: 'Acceso concedido', 
      session: activeSession 
    };
  }

  @Delete('logout')
  @ApiOperation({ summary: 'Cerrar sesión con mensaje personalizado' })
  logout() {
    if (!activeSession.token) {
      return { message: "No hay ninguna sesión activa para cerrar" };
    }

    // Guardamos los datos actuales para el mensaje final antes de borrarlos
    const lastTenant = activeSession.tenantId;
    const lastRole = activeSession.role;

    // Limpieza total del estado de seguridad
    activeSession.token = null;
    activeSession.role = null;
    activeSession.tenantId = null;

    // Respuesta solicitada con el detalle del usuario
    return { 
      message: "Sesión terminada",
      usuario: `El usuario con rol ${lastRole} del tenant ${lastTenant} ha finalizado su sesión`
    };
  }
}
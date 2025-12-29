import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { activeSession } from './auth.controller';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si existe sesión activa
    if (!activeSession.token) {
      throw new UnauthorizedException('Acceso denegado: Debes iniciar sesión en /auth/login primero');
    }

    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    request.user = {
    role: activeSession.role,
    tenantId: activeSession.tenantId
    };

    // Validación de Roles (RBAC)
    if (requiredRoles && activeSession.role) {
      if (!requiredRoles.includes(activeSession.role)) {
        throw new ForbiddenException(`Permisos insuficientes: Requiere ${requiredRoles.join(' o ')}`);
      }
    } else if (requiredRoles && !activeSession.role) {
       // Si se requiere rol pero la sesión no tiene uno
       throw new ForbiddenException('No se ha detectado un rol válido en la sesión');
    }

    return true;
  }
}
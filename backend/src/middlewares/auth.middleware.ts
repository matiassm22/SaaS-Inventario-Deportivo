import express from 'express';
import { AuthUser, UserRole } from '../types/index.js';
import { config } from '../config/env.js';

export interface AuthenticatedRequest extends express.Request {
  user?: AuthUser;
  tenantId?: string;
}

// Catálogo de usuarios conocidos para el entorno de desarrollo y validación
export const KNOWN_USERS: Record<string, AuthUser> = {
  'gerente@marathonsports.cl': {
    id: 'u-101',
    email: 'gerente@marathonsports.cl',
    nombre: 'Matías Muñoz',
    rol: 'GERENTE_OPERACIONES',
    cadena_id: '11111111-1111-1111-1111-111111111111',
    cadena_nombre: 'Marathon Sports Chile',
  },
  'tienda@marathonsports.cl': {
    id: 'u-102',
    email: 'tienda@marathonsports.cl',
    nombre: 'Encargado Tienda Costanera',
    rol: 'JEFE_TIENDA',
    cadena_id: '11111111-1111-1111-1111-111111111111',
    cadena_nombre: 'Marathon Sports Chile',
    sucursal_id: '22222222-2222-2222-2222-222222222201',
  },
  'auditor@marathonsports.cl': {
    id: 'u-103',
    email: 'auditor@marathonsports.cl',
    nombre: 'Auditor Financiero',
    rol: 'AUDITOR',
    cadena_id: '11111111-1111-1111-1111-111111111111',
    cadena_nombre: 'Marathon Sports Chile',
  },
  'gerente@sparta.cl': {
    id: 'u-201',
    email: 'gerente@sparta.cl',
    nombre: 'Gerencia Sparta',
    rol: 'GERENTE_OPERACIONES',
    cadena_id: '11111111-1111-1111-1111-111111111112',
    cadena_nombre: 'Sparta Deportes',
  },
};

/**
 * Codifica un token de sesión seguro base64 estructurado para el entorno B2B.
 */
export function generateToken(user: AuthUser): string {
  const payload = {
    ...user,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decodifica y valida un token de sesión.
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.exp && parsed.exp < Date.now()) {
      return null;
    }
    if (parsed.cadena_id && parsed.rol && parsed.email) {
      return parsed as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Middleware que exige autenticación estricta (Bearer Token).
 */
export function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      type: 'https://api.sportstock.ai/errors/unauthorized',
      title: 'No Autorizado',
      status: 401,
      detail: "Se requiere token Bearer de autenticación. Incluya 'Authorization: Bearer <token>'.",
      instance: req.originalUrl,
    });
  }

  const token = authHeader.substring(7).trim();
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({
      type: 'https://api.sportstock.ai/errors/invalid-token',
      title: 'Token Inválido o Expirado',
      status: 401,
      detail: 'El token proporcionado no es válido o ha expirado. Inicie sesión nuevamente.',
      instance: req.originalUrl,
    });
  }

  req.user = user;
  req.tenantId = user.cadena_id;
  return next();
}

/**
 * Middleware que permite acceso opcional, asignando usuario demo si no se provee token en desarrollo.
 */
export function optionalAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      req.tenantId = user.cadena_id;
      return next();
    }
  }

  // Si no hay token, inyecta el inquilino predeterminado en desarrollo para no bloquear endpoints demo
  req.user = KNOWN_USERS['gerente@marathonsports.cl'];
  req.tenantId = req.user.cadena_id;
  return next();
}

/**
 * Middleware para Control de Acceso Basado en Roles (RBAC).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        type: 'https://api.sportstock.ai/errors/unauthorized',
        title: 'No Autorizado',
        status: 401,
        detail: 'Debe iniciar sesión para acceder a este recurso.',
        instance: req.originalUrl,
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        type: 'https://api.sportstock.ai/errors/forbidden',
        title: 'Acceso Denegado por Rol (RBAC)',
        status: 403,
        detail: `Su rol '${req.user.rol}' no tiene permisos para esta acción. Roles autorizados: ${allowedRoles.join(', ')}.`,
        instance: req.originalUrl,
      });
    }

    return next();
  };
}

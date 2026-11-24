import crypto from 'node:crypto';
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
    sucursal_id: 'SUC-01',
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

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf-8');
}

function signSegment(data: string): string {
  return toBase64Url(
    crypto.createHmac('sha256', config.jwtSecret).update(data).digest()
  );
}

/**
 * Genera un JWT estándar RFC 7519 firmado con HMAC-SHA256 (HS256)
 * incluyendo claims de tenant (cadena_id) y rol RBAC.
 */
export function generateToken(user: AuthUser): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = toBase64Url(
    JSON.stringify({
      ...user,
      iat: nowSec,
      exp: nowSec + 24 * 60 * 60, // 24 horas
    })
  );
  const signature = signSegment(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

/**
 * Verifica firma criptográfica HS256 (constant-time) y expiración del JWT.
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSig = signSegment(`${headerB64}.${payloadB64}`);

    const sigBuf = Buffer.from(signatureB64, 'utf-8');
    const expBuf = Buffer.from(expectedSig, 'utf-8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const header = JSON.parse(fromBase64Url(headerB64));
    if (header.alg !== 'HS256') {
      return null;
    }

    const parsed = JSON.parse(fromBase64Url(payloadB64));
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp === 'number' && parsed.exp < nowSec) {
      return null;
    }

    if (parsed.cadena_id && parsed.rol && parsed.email) {
      return {
        id: parsed.id,
        email: parsed.email,
        nombre: parsed.nombre,
        rol: parsed.rol,
        cadena_id: parsed.cadena_id,
        cadena_nombre: parsed.cadena_nombre,
        sucursal_id: parsed.sucursal_id,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Middleware que exige autenticación estricta (Bearer JWT HS256).
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
      detail: 'El token proporcionado no tiene firma válida o ha expirado. Inicie sesión nuevamente.',
      instance: req.originalUrl,
    });
  }

  req.user = user;
  req.tenantId = user.cadena_id;
  return next();
}

/**
 * Middleware que permite lectura en modo consulta, inyectando tenant desde el JWT
 * o usando la cadena predeterminada si no se envía token.
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

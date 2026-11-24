import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateToken, verifyToken, KNOWN_USERS } from '../middlewares/auth.middleware.js';

describe('Autenticación, RBAC y Aislamiento Multi-Inquilino (Regla 1)', () => {
  it('Debe generar y verificar un token JWT válido con claims de tenant', () => {
    const user = KNOWN_USERS['gerente@marathonsports.cl'];
    const token = generateToken(user);

    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = verifyToken(token);
    assert.ok(decoded !== null);
    assert.strictEqual(decoded.email, 'gerente@marathonsports.cl');
    assert.strictEqual(decoded.cadena_id, '11111111-1111-1111-1111-111111111111');
    assert.strictEqual(decoded.rol, 'GERENTE_OPERACIONES');
  });

  it('Debe rechazar tokens corruptos o manipulados', () => {
    const invalidToken = 'token_invalido_no_base64_json';
    const decoded = verifyToken(invalidToken);
    assert.strictEqual(decoded, null);
  });

  it('Debe preservar el aislamiento entre tenants distintos', () => {
    const marathonUser = KNOWN_USERS['gerente@marathonsports.cl'];
    const spartaUser = KNOWN_USERS['gerente@sparta.cl'];

    assert.notStrictEqual(marathonUser.cadena_id, spartaUser.cadena_id);
    assert.strictEqual(marathonUser.cadena_nombre, 'Marathon Sports Chile');
    assert.strictEqual(spartaUser.cadena_nombre, 'Sparta Deportes');
  });
});

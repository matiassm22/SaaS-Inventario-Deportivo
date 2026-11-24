import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateToken, verifyToken, KNOWN_USERS } from '../middlewares/auth.middleware.js';
import { db, MARATHON_CADENA_ID, SPARTA_CADENA_ID } from '../services/db.service.js';

describe('Autenticación JWT HS256, RBAC y Aislamiento Multi-Inquilino (Regla 1)', () => {
  it('Debe generar y verificar un JWT firmado con HS256 (3 segmentos) y claims de tenant', () => {
    const user = KNOWN_USERS['gerente@marathonsports.cl'];
    const token = generateToken(user);

    assert.strictEqual(token.split('.').length, 3, 'El token debe ser un JWT estándar de 3 segmentos');

    const decoded = verifyToken(token);
    assert.ok(decoded !== null);
    assert.strictEqual(decoded.email, 'gerente@marathonsports.cl');
    assert.strictEqual(decoded.cadena_id, MARATHON_CADENA_ID);
    assert.strictEqual(decoded.rol, 'GERENTE_OPERACIONES');
  });

  it('Debe rechazar tokens corruptos o manipulados (firma HS256 inválida)', () => {
    const user = KNOWN_USERS['tienda@marathonsports.cl'];
    const token = generateToken(user);
    const [header, , sig] = token.split('.');

    // Intento de escalamiento de privilegios modificando payload sin la clave secreta
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...user, rol: 'GERENTE_OPERACIONES', cadena_id: SPARTA_CADENA_ID })
    )
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    assert.strictEqual(verifyToken(`${header}.${forgedPayload}.${sig}`), null);
    assert.strictEqual(verifyToken('token_invalido_no_jwt'), null);
  });

  it('Debe preservar el aislamiento estricto de inventario y órdenes entre tenants', async () => {
    const marathonInv = await db.getInventory(MARATHON_CADENA_ID);
    const spartaInv = await db.getInventory(SPARTA_CADENA_ID);

    assert.ok(marathonInv.length > 0);
    assert.ok(spartaInv.length > 0);
    assert.ok(marathonInv.every((item) => item.cadena_id === MARATHON_CADENA_ID));
    assert.ok(spartaInv.every((item) => item.cadena_id === SPARTA_CADENA_ID));

    const marathonSkus = new Set(marathonInv.map((i) => i.sku_codigo));
    const spartaSkus = new Set(spartaInv.map((i) => i.sku_codigo));
    for (const sku of spartaSkus) {
      assert.strictEqual(marathonSkus.has(sku), false, `El SKU ${sku} de Sparta no debe aparecer en Marathon`);
    }

    const marathonOrders = await db.getOrders(MARATHON_CADENA_ID);
    const spartaOrders = await db.getOrders(SPARTA_CADENA_ID);
    assert.ok(marathonOrders.every((o) => o.cadena_id === MARATHON_CADENA_ID));
    assert.ok(spartaOrders.every((o) => o.cadena_id === SPARTA_CADENA_ID));
  });
});

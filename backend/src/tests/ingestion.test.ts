import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ingestionService } from '../services/ingestion.service.js';

describe('Servicio de Ingesta y Validación Zod (Regla 4)', () => {
  it('Debe procesar correctamente un CSV con registros válidos', () => {
    const csvContent = [
      'sku_codigo,nombre,disciplina,talla,sucursal_codigo,fecha,unidades_vendidas,stock_actual,stock_minimo,precio_unitario',
      'RUN-001,Nike Vaporfly 3,RUNNING,42,SUC-01,2026-11-20,4,3,8,189990',
      'FUT-023,Balón Torneo Pro Match N°5,FUTBOL,Única,SUC-02,2026-11-20,8,12,18,34990',
    ].join('\n');

    const result = ingestionService.parseCSV(csvContent, 'lote_prueba.csv');

    assert.strictEqual(result.totalRecords, 2);
    assert.strictEqual(result.validRecords, 2);
    assert.strictEqual(result.failedRecords, 0);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.validRows[0].sku_codigo, 'RUN-001');
    assert.strictEqual(result.validRows[0].stock_actual, 3);
  });

  it('Debe aislar filas erróneas y reportar el motivo sin abortar el lote (Resiliencia)', () => {
    const csvCorrupto = [
      'sku_codigo,nombre,disciplina,talla,sucursal_codigo,fecha,unidades_vendidas,stock_actual,stock_minimo,precio_unitario',
      'RUN-001,Nike Vaporfly 3,RUNNING,42,SUC-01,2026-11-20,4,3,8,189990',
      'CORRUPT-01,Error Fecha,RUNNING,42,SUC-01,FECHA-INVALIDA,4,3,8,189990', // Fecha inválida
      'FUT-023,Balón Torneo,FUTBOL,Única,SUC-02,2026-11-20,8,12,18,34990',
    ].join('\n');

    const result = ingestionService.parseCSV(csvCorrupto, 'lote_corrupto.csv');

    assert.strictEqual(result.totalRecords, 3);
    assert.strictEqual(result.validRecords, 2);
    assert.strictEqual(result.failedRecords, 1);
    assert.strictEqual(result.errors.length, 1);
    assert.strictEqual(result.errors[0].row, 2);
    assert.ok(result.errors[0].error.includes('fecha'));
  });

  it('Debe procesar lotes JSON directos provenientes del ERP', () => {
    const jsonRecords = [
      {
        sku_codigo: 'FIT-012',
        nombre: 'Polera Compresión Dry-Fit',
        disciplina: 'FITNESS',
        talla: 'M',
        sucursal_codigo: 'SUC-03',
        fecha: '2026-11-22',
        unidades_vendidas: 5,
        stock_actual: 18,
        stock_minimo: 20,
        precio_unitario: 19990,
      },
    ];

    const result = ingestionService.parseJSONBatch(jsonRecords, 'API SAP');

    assert.strictEqual(result.validRecords, 1);
    assert.strictEqual(result.failedRecords, 0);
    assert.strictEqual(result.validRows[0].sku_codigo, 'FIT-012');
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ForecastingService } from '../services/forecasting.service.js';

describe('Motor Predictivo y Fórmula de Reposición (Regla de Negocio 3)', () => {
  const forecasting = new ForecastingService();

  it('Debe calcular la cantidad sugerida aplicando la fórmula de retail deportivo para SKU crítico', () => {
    // Caso de SKU en quiebre crítico (stock actual bajo = 3 u., demanda semanal histórica = 25 u.)
    const forecast = forecasting.calculateSKUForecast({
      skuCodigo: 'RUN-001',
      nombre: 'Nike Vaporfly 3',
      disciplina: 'RUNNING',
      sucursalId: 'suc-1',
      leadTimeDias: 3,
      stockActual: 3,
      stockTransito: 0,
      ventasHistoricasSemanales: [25, 28, 22, 30],
      horizonteSemanas: 6,
    });

    assert.strictEqual(forecast.skuCodigo, 'RUN-001');
    assert.strictEqual(forecast.stockActual, 3);
    assert.ok(forecast.stockSeguridad > 0, 'Debe calcular stock de seguridad');
    assert.ok(forecast.cantidadSugerida > 0, 'La cantidad sugerida debe ser positiva para un quiebre crítico');
    assert.ok(forecast.confidenceScore >= 80, 'El nivel de confianza algorítmica debe ser >= 80%');
    assert.strictEqual(forecast.curvaSemanal.length, 6, 'Debe generar curva para las 6 semanas del horizonte');
  });

  it('No debe sugerir reposición cuando el stock actual cubre holgadamente la demanda', () => {
    // Caso con stock actual excedente (150 u.)
    const forecast = forecasting.calculateSKUForecast({
      skuCodigo: 'FUT-104',
      nombre: 'Camiseta Local Oficial',
      disciplina: 'FUTBOL',
      sucursalId: 'suc-2',
      leadTimeDias: 2,
      stockActual: 150,
      stockTransito: 20,
      ventasHistoricasSemanales: [15, 12, 14, 16],
      horizonteSemanas: 4,
    });

    assert.strictEqual(forecast.cantidadSugerida, 0, 'Un SKU con stock abundante debe arrojar 0 unidades sugeridas');
    assert.strictEqual(forecast.curvaSemanal.length, 4);
  });
});

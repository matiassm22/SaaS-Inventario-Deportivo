# Estándares y Convenciones de Código (CODING STANDARDS)
## SportStockAI — Plataforma SaaS B2B

---

## 1. Convenciones Generales del Repositorio

- **Idioma del Código**:
  - Código fuente (variables, funciones, clases, métodos, endpoints): **Inglés**.
  - Documentación técnica, comentarios de negocio y mensajes de cara al usuario en Chile/LatAm: **Español**.
- **Control de Formato y Estilo**:
  - Prettier y ESLint son obligatorios en frontend y backend.
  - Black y Flake8/Ruff son obligatorios en los workers de Python.
  - `dart format` y `flutter analyze` en la aplicación móvil.
  - Ningún código con advertencias (*warnings*) de análisis estático se mergea a `develop`.

---

## 2. Estándares TypeScript / Node.js (Backend & Web)

### 2.1. Tipado Estricto
- Queda prohibido el uso de `any`. Usar `unknown` cuando el tipo no se conozca a priori y estrecharlo con *type guards* o esquemas Zod.
- Todo endpoint, función y servicio debe declarar explícitamente sus tipos de retorno.

```typescript
// Incorrecto: tipo sin definir
async function calculateForecast(data: any) {
  return data.map(item => item.units * 1.2);
}

// Correcto: contrato tipado con validación
import { z } from 'zod';

export const HistoricalSaleSchema = z.object({
  skuId: z.string().uuid(),
  weekDate: z.string().datetime(),
  unitsSold: z.number().int().nonnegative(),
});

export type HistoricalSale = z.infer<typeof HistoricalSaleSchema>;

export interface ForecastResult {
  skuId: string;
  projectedUnits: number;
  confidenceScore: number;
}

export async function calculateForecast(
  sales: HistoricalSale[]
): Promise<ForecastResult[]> {
  // Lógica controlada
}
```

### 2.2. Validación de Esquemas en la Entrada (Zod)
- No asumir que el cliente envía datos limpios. Cada controlador debe validar el body, query params y headers antes de invocar los casos de uso:

```typescript
// En Fastify / Express Controller
export async function handleIngestBatch(req: FastifyRequest, reply: FastifyReply) {
  const parseResult = IngestionBatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        details: parseResult.error.flatten(),
      },
    });
  }
  
  const jobId = await queueService.enqueueIngestion(parseResult.data);
  return reply.status(202).send({ success: true, data: { jobId } });
}
```

---

## 3. Estándares Flutter / Dart (App Móvil de Tienda)

### 3.1. Arquitectura de Estado
- Utilizar **Clean Architecture** separando claramente:
  - `data/` (Data sources de Supabase, modelos DTO, serializadores JSON).
  - `domain/` (Entidades de inventario, repositorios abstractos, casos de uso).
  - `presentation/` (Widgets desacoplados, BLoC / Riverpod providers).
- Los Widgets no deben contener lógica de cálculo ni llamadas HTTP directas.

### 3.2. Manejo de Estado en Piso de Tienda
- Diseñar pensando en pérdida temporal de señal Wi-Fi en bodegas o pasillos comerciales.
- Cachear localmente el semáforo de inventario y encolar las acciones realizadas offline para sincronización automática cuando retorne la conexión.

```dart
// Patrón de Estado (BLoC / Riverpod)
sealed class InventoryState {}

class InventoryLoading extends InventoryState {}

class InventoryLoaded extends InventoryState {
  final List<StoreStockItem> criticalItems;
  final List<StoreStockItem> warningItems;
  final List<StoreStockItem> healthyItems;
  final DateTime lastSynced;

  InventoryLoaded({
    required this.criticalItems,
    required this.warningItems,
    required this.healthyItems,
    required this.lastSynced,
  });
}

class InventoryError extends InventoryState {
  final String userFriendlyMessage;
  InventoryError(this.userFriendlyMessage);
}
```

---

## 4. Estándares Python (Worker Predictivo)

### 4.1. Tipado y Validaciones
- Python 3.11+. Uso obligatorio de Type Hints (`typing`).
- Modelos de entrada y salida respaldados por **Pydantic v2**.
- Código estructurado en clases o funciones puras testables con `pytest`.

```python
# Definición de Esquemas en Worker Python
from pydantic import BaseModel, Field
from datetime import date
from typing import List

class DemandPredictionInput(BaseModel):
    branch_id: str
    sku_id: str
    historical_sales: List[int] = Field(..., min_length=8)
    seasonal_index: float = Field(default=1.0, ge=0.1, le=5.0)

class DemandPredictionOutput(BaseModel):
    branch_id: str
    sku_id: str
    forecast_week: date
    projected_demand: int = Field(..., ge=0)
    safety_stock: int = Field(..., ge=0)
```

---

## 5. Estándares SQL y Migraciones (PostgreSQL / Supabase)

1. **Nomenclatura**: Tablas, columnas, índices y funciones siempre en minúsculas y `snake_case`.
2. **Llaves Primarias**: Identificadores únicos basados en UUID (`gen_random_uuid()`).
3. **Migraciones Versionadas**: No se aplican cambios manuales desde el panel web de Supabase. Todo cambio debe residir en un archivo SQL con timestamp en la carpeta de migraciones (`supabase/migrations/20261122000000_create_core_tables.sql`).
4. **Restricciones de Integridad**: Usar constraints explícitos (`CHECK (stock_actual >= 0)`, `NOT NULL`, `FOREIGN KEY ON DELETE ...`).

---

## 6. Formato Estandarizado de Errores (RFC 7807)

Toda respuesta de error HTTP 4xx o 5xx debe respetar el estándar RFC 7807 Problem Details:

```json
{
  "type": "https://api.sportstock.ai/errors/insufficient-stock",
  "title": "Stock Insuficiente para Venta",
  "status": 422,
  "detail": "El SKU RUN-001 en sucursal Costanera posee 2 unidades y se intentó descontar 5.",
  "instance": "/api/v1/tienda/venta",
  "invalid_params": [
    {
      "name": "unidades",
      "reason": "Excede el stock disponible actual (2)."
    }
  ]
}
```

import { z } from 'zod';

export type Disciplina = 'FUTBOL' | 'RUNNING' | 'FITNESS' | 'TRAIL' | 'OUTDOOR' | 'OTRO';
export type EstadoOrden = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_TRANSITO' | 'RECIBIDA';

// 1. Esquema de Ingesta por Fila (CSV o JSON)
export const IngestionRowSchema = z.object({
  sku_codigo: z.string().min(2),
  nombre: z.string().min(2),
  disciplina: z.enum(['FUTBOL', 'RUNNING', 'FITNESS', 'TRAIL', 'OUTDOOR', 'OTRO']),
  talla: z.string().optional().default('Única'),
  sucursal_codigo: z.string().min(2),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato fecha debe ser AAAA-MM-DD'),
  unidades_vendidas: z.coerce.number().int().nonnegative(),
  stock_actual: z.coerce.number().int().nonnegative(),
  stock_minimo: z.coerce.number().int().nonnegative().default(5),
  precio_unitario: z.coerce.number().nonnegative().default(0),
});

export type IngestionRow = z.infer<typeof IngestionRowSchema>;

// 2. Esquema de Aprobación de Orden
export const OrderStatusUpdateSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA']),
  cantidad_aprobada: z.number().int().positive().optional(),
  motivo_rechazo: z.string().optional(),
  aprobado_por: z.string().optional().default('Gerente de Operaciones'),
});

// 3. Esquema de Venta en Tienda
export const StoreSaleSchema = z.object({
  sku_codigo: z.string().min(2),
  sucursal_id: z.string().optional(),
  unidades: z.number().int().nonnegative(),
});

// 4. Entidades del Dominio
export interface ProductSKU {
  id: string;
  cadena_id: string;
  sku_codigo: string;
  nombre: string;
  disciplina: Disciplina;
  talla?: string;
  precio_costo: number;
  precio_venta: number;
}

export interface StoreInventory {
  id: string;
  sucursal_id: string;
  sku_id: string;
  sku_codigo: string;
  nombre: string;
  disciplina: Disciplina;
  stock_actual: number;
  stock_minimo: number;
  stock_seguridad: number;
  stock_transito: number;
  estado_alerta: 'CRITICO' | 'PREVENTIVO' | 'OPTIMO';
  lead_time_dias: number;
}

export interface ReplenishmentOrder {
  id: string;
  cadena_id: string;
  sucursal_id: string;
  sucursal_nombre: string;
  sku_id: string;
  sku_codigo: string;
  nombre_producto: string;
  disciplina: Disciplina;
  cantidad_sugerida: number;
  cantidad_aprobada?: number;
  fecha_pedido_sugerida: string;
  estado: EstadoOrden;
  confidence_score: number;
  evento_estacional: string;
  formula_desglose: {
    demanda_esperada: number;
    stock_seguridad: number;
    stock_actual: number;
    stock_transito: number;
  };
}

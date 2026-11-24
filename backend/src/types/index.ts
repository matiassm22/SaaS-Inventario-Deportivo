import { z } from 'zod';

export type Disciplina = 'FUTBOL' | 'RUNNING' | 'FITNESS' | 'TRAIL' | 'OUTDOOR' | 'OTRO';
export type ProductCategory = 'Calzado' | 'Ropa' | 'Accesorios';
export type EstadoOrden = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_TRANSITO' | 'RECIBIDA';
export type UserRole = 'GERENTE_OPERACIONES' | 'JEFE_TIENDA' | 'AUDITOR';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  cadena_id: string;
  cadena_nombre: string;
  sucursal_id?: string;
}

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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

// 2. Esquema de Aprobación / Rechazo de Orden
export const OrderStatusUpdateSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA']),
  cantidad_aprobada: z.number().int().positive().optional(),
  motivo_rechazo: z.string().optional(),
  aprobado_por: z.string().optional().default('Gerente de Operaciones'),
});

// 3. Esquema de Creación de Orden de Reposición
export const CreateOrderSchema = z.object({
  sku_codigo: z.string().min(2),
  sucursal_id: z.string().optional(),
  cantidad_sugerida: z.number().int().positive(),
  evento_estacional: z.string().optional().default('Reposición prioritaria'),
});

// 4. Esquema de Venta en Tienda
export const StoreSaleSchema = z.object({
  sku_codigo: z.string().min(2),
  sucursal_id: z.string().optional(),
  unidades: z.number().int().nonnegative(),
});

// 5. Esquema de Ajuste Físico de Conteo en Góndola (+/-)
export const StoreCountAdjustSchema = z.object({
  stock_actual: z.number().int().nonnegative(),
  sucursal_id: z.string().optional(),
  responsable: z.string().optional(),
});

// 6. Esquema de Ejecución Predictiva por Lote
export const RunForecastSchema = z.object({
  horizonte_semanas: z.number().int().min(2).max(8).optional().default(4),
  factores_estacionales: z
    .object({
      FUTBOL: z.number().min(0.5).max(3).optional(),
      RUNNING: z.number().min(0.5).max(3).optional(),
      FITNESS: z.number().min(0.5).max(3).optional(),
    })
    .optional(),
});

// 7. Esquema de Auditoría de Empleados
export const EmployeeAuditSchema = z.object({
  tipo_gestion: z.string().min(2),
  detalle: z.string().min(2),
  sucursal: z.string().optional().default('Red SportStock'),
  terminal: z.string().optional().default('Panel Web Enterprise'),
  estado: z.enum(['VERIFICADO', 'EXITOSO', 'APROBADO', 'AUDITADO', 'RECHAZADO']).optional().default('VERIFICADO'),
});

// 8. Entidades del Dominio
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
  cadena_id: string;
  sucursal_id: string;
  sucursal_codigo: string;
  sucursal_nombre: string;
  sku_id: string;
  sku_codigo: string;
  nombre: string;
  tipo: ProductCategory;
  disciplina: Disciplina;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  stock_seguridad: number;
  stock_transito: number;
  ventas_semanales_base: number;
  estado_alerta: 'CRITICO' | 'PREVENTIVO' | 'OPTIMO';
  lead_time_dias: number;
  conteo_confirmado: boolean;
  fecha_conteo?: string;
  auditado_por?: string;
  canal_ingesta?: string;
}

export interface ReplenishmentOrder {
  id: string;
  cadena_id: string;
  sucursal_id: string;
  sucursal_codigo: string;
  sucursal_nombre: string;
  sku_id: string;
  sku_codigo: string;
  nombre_producto: string;
  tipo: ProductCategory;
  disciplina: Disciplina;
  stock_actual: number;
  stock_minimo: number;
  cantidad_sugerida: number;
  cantidad_aprobada?: number;
  fecha_pedido_sugerida: string;
  estado: EstadoOrden;
  lead_time_dias: number;
  confidence_score: number;
  evento_estacional: string;
  formula_desglose: {
    demanda_esperada: number;
    stock_seguridad: number;
    stock_actual: number;
    stock_transito: number;
  };
}

export interface EmployeeAuditEntry {
  id: string;
  cadena_id: string;
  timestamp: string;
  relativo: string;
  empleado: string;
  rol: string;
  avatar: string;
  color: string;
  tipo_gestion: string;
  sucursal: string;
  terminal: string;
  detalle: string;
  estado: 'VERIFICADO' | 'EXITOSO' | 'APROBADO' | 'AUDITADO' | 'RECHAZADO';
}

export interface AuditLotRow {
  id: string;
  cadena_id: string;
  date: string;
  source: string;
  records: string;
  status: string;
  tone: 'success' | 'warning' | 'critical';
}

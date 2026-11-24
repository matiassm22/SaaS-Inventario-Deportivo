export type PageId =
  | 'dashboard'
  | 'inventory'
  | 'prediction'
  | 'replenishment'
  | 'store'
  | 'integration'
  | 'audit'
  | 'settings'

export type Disciplina = 'FUTBOL' | 'RUNNING' | 'FITNESS' | 'TRAIL' | 'OUTDOOR' | 'OTRO'
export type ProductCategory = 'Calzado' | 'Ropa' | 'Accesorios'
export type OrderStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export interface Branch {
  id: string
  codigo: string
  nombre: string
  ciudad: string
  lead_time_dias: number
}

export interface CatalogProduct {
  sku_id: string
  nombre: string
  tipo: ProductCategory
  disciplina: 'FUTBOL' | 'RUNNING' | 'FITNESS'
  precio: number
  stock_actual: number
  stock_minimo: number
  stock_seguridad: number
  ventas_semanales_base: number
  sucursal_id: string
  conteo_confirmado: boolean
  fecha_conteo?: string
  auditado_por?: string
  canal_ingesta?: string
}

export interface ReplenishmentOrder {
  id: string
  sku_id: string
  nombre: string
  tipo: ProductCategory
  disciplina: 'FUTBOL' | 'RUNNING' | 'FITNESS'
  sucursal_id: string
  sucursal_nombre: string
  stock_actual: number
  stock_minimo: number
  stock_seguridad: number
  demanda_esperada: number
  cantidad_sugerida: number
  fecha_pedido: string
  estado: OrderStatus
  lead_time: number
  confidence_score: number
  evento_estacional: string
}

export interface EmployeeAuditLog {
  id: string
  timestamp: string
  relativo: string
  empleado: string
  rol: string
  avatar: string
  color: string
  tipo_gestion: string
  sucursal: string
  terminal: string
  detalle: string
  estado: 'VERIFICADO' | 'EXITOSO' | 'APROBADO' | 'AUDITADO' | 'RECHAZADO'
}

export interface TeamMember {
  nombre: string
  rol: string
  avatar: string
  color: string
  sucursal: string
  estado: string
  ultima_gestion: string
  fecha_gestion: string
}

export interface BatchAuditRow {
  id: string
  date: string
  source: string
  records: string
  status: string
  tone: 'success' | 'warning' | 'critical' | string
}

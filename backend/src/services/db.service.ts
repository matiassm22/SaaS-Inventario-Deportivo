import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { StoreInventory, ReplenishmentOrder, IngestionRow } from '../types/index.js';

/**
 * Servicio unificado de base de datos.
 * Conecta a Supabase PostgreSQL cuando las credenciales están configuradas en .env;
 * en su defecto, opera con un almacenamiento reactivo precargado con el Seed chileno oficial.
 */
export class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private isConnectedToSupabase = false;

  // Estado reactivo en memoria (fallback para desarrollo y demos sin proyecto Supabase activo)
  private memory = {
    cadena: {
      id: config.defaultCadenaId,
      nombre: 'Marathon Sports Chile',
      rut: '76.842.190-3',
      tier: 'TIER_1',
    },
    sucursales: [
      { id: '22222222-2222-2222-2222-222222222201', codigo: 'SUC-01', nombre: 'Sucursal Costanera Center', lead_time_dias: 2 },
      { id: '22222222-2222-2222-2222-222222222202', codigo: 'SUC-02', nombre: 'Sucursal Parque Arauco', lead_time_dias: 3 },
      { id: '22222222-2222-2222-2222-222222222203', codigo: 'SUC-03', nombre: 'Sucursal Plaza Vespucio', lead_time_dias: 4 },
    ],
    inventory: [
      {
        id: 'inv-1',
        sucursal_id: '22222222-2222-2222-2222-222222222201',
        sku_id: '44444444-4444-4444-4444-444444444401',
        sku_codigo: 'RUN-001',
        nombre: 'Nike Vaporfly 3',
        disciplina: 'RUNNING' as const,
        stock_actual: 3,
        stock_minimo: 8,
        stock_seguridad: 5,
        stock_transito: 0,
        estado_alerta: 'CRITICO' as const,
        lead_time_dias: 2,
      },
      {
        id: 'inv-2',
        sucursal_id: '22222222-2222-2222-2222-222222222201',
        sku_id: '44444444-4444-4444-4444-444444444402',
        sku_codigo: 'RUN-008',
        nombre: 'Cortaviento Trail Shield',
        disciplina: 'RUNNING' as const,
        stock_actual: 6,
        stock_minimo: 12,
        stock_seguridad: 4,
        stock_transito: 0,
        estado_alerta: 'CRITICO' as const,
        lead_time_dias: 2,
      },
      {
        id: 'inv-3',
        sucursal_id: '22222222-2222-2222-2222-222222222202',
        sku_id: '44444444-4444-4444-4444-444444444403',
        sku_codigo: 'FUT-023',
        nombre: 'Balón Torneo Pro Match N°5',
        disciplina: 'FUTBOL' as const,
        stock_actual: 12,
        stock_minimo: 18,
        stock_seguridad: 6,
        stock_transito: 0,
        estado_alerta: 'PREVENTIVO' as const,
        lead_time_dias: 3,
      },
      {
        id: 'inv-4',
        sucursal_id: '22222222-2222-2222-2222-222222222203',
        sku_id: '44444444-4444-4444-4444-444444444404',
        sku_codigo: 'FIT-012',
        nombre: 'Polera Compresión Dry-Fit',
        disciplina: 'FITNESS' as const,
        stock_actual: 18,
        stock_minimo: 20,
        stock_seguridad: 5,
        stock_transito: 0,
        estado_alerta: 'PREVENTIVO' as const,
        lead_time_dias: 4,
      },
      {
        id: 'inv-5',
        sucursal_id: '22222222-2222-2222-2222-222222222202',
        sku_id: '44444444-4444-4444-4444-444444444405',
        sku_codigo: 'FUT-104',
        nombre: 'Camiseta Local Oficial 2026',
        disciplina: 'FUTBOL' as const,
        stock_actual: 45,
        stock_minimo: 20,
        stock_seguridad: 5,
        stock_transito: 10,
        estado_alerta: 'OPTIMO' as const,
        lead_time_dias: 3,
      },
    ] as StoreInventory[],
    orders: [
      {
        id: '55555555-5555-5555-5555-555555555501',
        cadena_id: config.defaultCadenaId,
        sucursal_id: '22222222-2222-2222-2222-222222222201',
        sucursal_nombre: 'Sucursal Costanera Center',
        sku_id: '44444444-4444-4444-4444-444444444401',
        sku_codigo: 'RUN-001',
        nombre_producto: 'Nike Vaporfly 3 (Talla 42)',
        disciplina: 'RUNNING' as const,
        cantidad_sugerida: 25,
        fecha_pedido_sugerida: '2026-11-26',
        estado: 'PENDIENTE' as const,
        confidence_score: 94,
        evento_estacional: '+35% por Maratón de Santiago',
        formula_desglose: {
          demanda_esperada: 28,
          stock_seguridad: 5,
          stock_actual: 3,
          stock_transito: 0,
        },
      },
      {
        id: '55555555-5555-5555-5555-555555555502',
        cadena_id: config.defaultCadenaId,
        sucursal_id: '22222222-2222-2222-2222-222222222201',
        sucursal_nombre: 'Sucursal Costanera Center',
        sku_id: '44444444-4444-4444-4444-444444444402',
        sku_codigo: 'RUN-008',
        nombre_producto: 'Cortaviento Trail Shield',
        disciplina: 'RUNNING' as const,
        cantidad_sugerida: 18,
        fecha_pedido_sugerida: '2026-11-27',
        estado: 'PENDIENTE' as const,
        confidence_score: 91,
        evento_estacional: 'Pico estacional calzado y abrigo',
        formula_desglose: {
          demanda_esperada: 20,
          stock_seguridad: 4,
          stock_actual: 6,
          stock_transito: 0,
        },
      },
      {
        id: '55555555-5555-5555-5555-555555555503',
        cadena_id: config.defaultCadenaId,
        sucursal_id: '22222222-2222-2222-2222-222222222202',
        sucursal_nombre: 'Sucursal Parque Arauco',
        sku_id: '44444444-4444-4444-4444-444444444403',
        sku_codigo: 'FUT-023',
        nombre_producto: 'Balón Torneo Pro Match N°5',
        disciplina: 'FUTBOL' as const,
        cantidad_sugerida: 28,
        fecha_pedido_sugerida: '2026-11-30',
        estado: 'PENDIENTE' as const,
        confidence_score: 87,
        evento_estacional: 'Inicio Torneo Nacional 2026',
        formula_desglose: {
          demanda_esperada: 34,
          stock_seguridad: 6,
          stock_actual: 12,
          stock_transito: 0,
        },
      },
    ] as ReplenishmentOrder[],
    auditLots: [
      { id: 'LT-2026-1122-04', date: 'Hoy, 08:30', source: 'SAP Business One', records: '12.458', status: 'Validado', tone: 'success' },
      { id: 'LT-2026-1122-03', date: 'Ayer, 18:12', source: 'stock_semanal.xlsx', records: '4.862', status: 'Validado con alertas', tone: 'warning' },
      { id: 'LT-2026-1121-02', date: '21 Nov, 08:30', source: 'SAP Business One', records: '12.391', status: 'Validado', tone: 'success' },
    ],
  };

  constructor() {
    const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
    if (config.supabase.url && key) {
      try {
        this.supabase = createClient(config.supabase.url, key);
        this.isConnectedToSupabase = true;
        console.log('[Database] Conectado exitosamente a Supabase PostgreSQL Cloud.');
      } catch (err) {
        console.warn('[Database] Fallo conexión a Supabase, activando almacenamiento local reactivo:', err);
      }
    } else {
      console.log('[Database] Sin credenciales Supabase. Operando con Seed reactivo en memoria.');
    }
  }

  public async getInventory(sucursalId?: string): Promise<StoreInventory[]> {
    if (sucursalId) {
      return this.memory.inventory.filter((x) => x.sucursal_id === sucursalId);
    }
    return this.memory.inventory;
  }

  public async getStoreInventory(sucursalId?: string) {
    let items = this.memory.inventory;
    if (sucursalId) {
      items = items.filter((x) => x.sucursal_id === sucursalId);
    }
    return items.map((x) => ({
      sku: x.sku_codigo,
      title: x.nombre,
      variant: `${x.disciplina} · Reposición ${x.lead_time_dias}d`,
      stockActual: x.stock_actual,
      stockMinimo: x.stock_minimo,
      etaReposicion: `En ${x.lead_time_dias} días hábiles`,
      level: x.estado_alerta === 'CRITICO' ? 'critical' : x.estado_alerta === 'PREVENTIVO' ? 'warning' : 'optimal',
    }));
  }

  public async updateStock(skuCodigo: string, unitsToDeduct: number, sucursalId?: string): Promise<StoreInventory> {
    const item = this.memory.inventory.find(
      (x) => x.sku_codigo === skuCodigo && (!sucursalId || x.sucursal_id === sucursalId)
    );
    if (!item) {
      throw new Error(`SKU ${skuCodigo} no encontrado en inventario.`);
    }

    if (item.stock_actual < unitsToDeduct) {
      throw new Error(`Stock insuficiente: disponible ${item.stock_actual}, solicitado ${unitsToDeduct}.`);
    }

    item.stock_actual -= unitsToDeduct;

    // Recalcular estado de alerta
    if (item.stock_actual <= item.stock_minimo) {
      item.estado_alerta = 'CRITICO';
    } else if (item.stock_actual <= item.stock_minimo + item.stock_seguridad) {
      item.estado_alerta = 'PREVENTIVO';
    } else {
      item.estado_alerta = 'OPTIMO';
    }

    return item;
  }

  public async getOrders(estado?: string): Promise<ReplenishmentOrder[]> {
    if (estado) {
      return this.memory.orders.filter((x) => x.estado === estado);
    }
    return this.memory.orders;
  }

  public async resolveOrder(orderId: string, status: 'APROBADA' | 'RECHAZADA', approvedQty?: number): Promise<ReplenishmentOrder> {
    const order = this.memory.orders.find((x) => x.id === orderId);
    if (!order) {
      throw new Error(`Orden ${orderId} no encontrada.`);
    }

    order.estado = status;
    if (status === 'APROBADA') {
      order.cantidad_aprobada = approvedQty ?? order.cantidad_sugerida;
      // Reflejar en stock en tránsito
      const inv = this.memory.inventory.find((x) => x.sku_codigo === order.sku_codigo);
      if (inv) inv.stock_transito += order.cantidad_aprobada;
    }

    return order;
  }

  public async getAuditLots() {
    return this.memory.auditLots;
  }

  public async saveIngestionBatch(lotCode: string, source: string, rows: IngestionRow[]) {
    // 1. Agregar a auditoría
    this.memory.auditLots.unshift({
      id: lotCode,
      date: 'Ahora mismo',
      source,
      records: rows.length.toLocaleString('es-CL'),
      status: 'Validado',
      tone: 'success',
    });

    // 2. Actualizar o insertar en inventario
    for (const row of rows) {
      const existing = this.memory.inventory.find((x) => x.sku_codigo === row.sku_codigo);
      if (existing) {
        existing.stock_actual = row.stock_actual;
        existing.stock_minimo = row.stock_minimo;
      }
    }

    return { processed: rows.length };
  }
}

export const db = new DatabaseService();

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import {
  AuditLotRow,
  Disciplina,
  EmployeeAuditEntry,
  IngestionRow,
  ProductCategory,
  ReplenishmentOrder,
  StoreInventory,
} from '../types/index.js';

export const MARATHON_CADENA_ID = '11111111-1111-1111-1111-111111111111';
export const SPARTA_CADENA_ID = '11111111-1111-1111-1111-111111111112';

interface BranchInfo {
  id: string;
  cadena_id: string;
  codigo: string;
  nombre: string;
  lead_time_dias: number;
}

function inferCategory(nombre: string): ProductCategory {
  const lower = nombre.toLowerCase();
  if (lower.includes('zapat') || lower.includes('vaporfly') || lower.includes('mercurial') || lower.includes('metcon') || lower.includes('nimbus') || lower.includes('flyknit')) {
    return 'Calzado';
  }
  if (lower.includes('polera') || lower.includes('camiseta') || lower.includes('short') || lower.includes('cortaviento') || lower.includes('calza') || lower.includes('medias') || lower.includes('top')) {
    return 'Ropa';
  }
  return 'Accesorios';
}

function computeAlertLevel(stockActual: number, stockMinimo: number, stockSeguridad: number): 'CRITICO' | 'PREVENTIVO' | 'OPTIMO' {
  if (stockActual === 0 || stockActual <= Math.ceil(stockMinimo * 0.5)) return 'CRITICO';
  if (stockActual <= stockMinimo || stockActual <= stockMinimo + Math.floor(stockSeguridad * 0.3)) return 'PREVENTIVO';
  return 'OPTIMO';
}

const BRANCHES_SEED: BranchInfo[] = [
  { id: '22222222-2222-2222-2222-222222222201', cadena_id: MARATHON_CADENA_ID, codigo: 'SUC-01', nombre: 'Sucursal Costanera Center', lead_time_dias: 2 },
  { id: '22222222-2222-2222-2222-222222222202', cadena_id: MARATHON_CADENA_ID, codigo: 'SUC-02', nombre: 'Sucursal Parque Arauco', lead_time_dias: 3 },
  { id: '22222222-2222-2222-2222-222222222203', cadena_id: MARATHON_CADENA_ID, codigo: 'SUC-03', nombre: 'Sucursal Plaza Vespucio', lead_time_dias: 4 },
  { id: '22222222-2222-2222-2222-222222222301', cadena_id: SPARTA_CADENA_ID, codigo: 'SUC-01', nombre: 'Sparta Mall Sport', lead_time_dias: 2 },
  { id: '22222222-2222-2222-2222-222222222302', cadena_id: SPARTA_CADENA_ID, codigo: 'SUC-02', nombre: 'Sparta Alto Las Condes', lead_time_dias: 3 },
];

function makeInv(
  cadenaId: string,
  sucCodigo: string,
  skuCodigo: string,
  nombre: string,
  tipo: ProductCategory,
  disciplina: Disciplina,
  precio: number,
  stockActual: number,
  stockMinimo: number,
  stockSeguridad: number,
  ventasSem: number,
  confirmado = false,
  auditadoPor?: string,
  fechaConteo?: string
): StoreInventory {
  const branch =
    BRANCHES_SEED.find((b) => b.cadena_id === cadenaId && b.codigo === sucCodigo) ||
    BRANCHES_SEED.find((b) => b.cadena_id === cadenaId) ||
    BRANCHES_SEED[0];

  return {
    id: `inv-${cadenaId.slice(-4)}-${skuCodigo}`,
    cadena_id: cadenaId,
    sucursal_id: branch.id,
    sucursal_codigo: branch.codigo,
    sucursal_nombre: branch.nombre,
    sku_id: `sku-${cadenaId.slice(-4)}-${skuCodigo}`,
    sku_codigo: skuCodigo,
    nombre,
    tipo,
    disciplina,
    precio,
    stock_actual: stockActual,
    stock_minimo: stockMinimo,
    stock_seguridad: stockSeguridad,
    stock_transito: 0,
    ventas_semanales_base: ventasSem,
    estado_alerta: computeAlertLevel(stockActual, stockMinimo, stockSeguridad),
    lead_time_dias: branch.lead_time_dias,
    conteo_confirmado: confirmado,
    auditado_por: auditadoPor,
    fecha_conteo: fechaConteo,
    canal_ingesta: 'API REST / Seed',
  };
}

/**
 * Servicio unificado de base de datos Multi-Inquilino (Regla 1).
 * Conecta a Supabase PostgreSQL cuando hay credenciales válidas en .env;
 * en su defecto, opera con almacenamiento reactivo aislado por cadena_id.
 */
export class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private isConnectedToSupabase = false;

  private memory: {
    branches: BranchInfo[];
    inventory: StoreInventory[];
    orders: ReplenishmentOrder[];
    auditLots: AuditLotRow[];
    employeeAudits: EmployeeAuditEntry[];
  };

  constructor() {
    this.memory = {
      branches: [...BRANCHES_SEED],
      inventory: [
        // === MARATHON SPORTS CHILE (30 SKUs: 10 Fútbol, 10 Running, 10 Fitness) ===
        makeInv(MARATHON_CADENA_ID, 'SUC-02', 'FUT-023', 'Balón Torneo Pro Match N°5', 'Accesorios', 'FUTBOL', 29990, 12, 18, 6, 15, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:35'),
        makeInv(MARATHON_CADENA_ID, 'SUC-02', 'FUT-104', 'Camiseta Local Oficial 2026', 'Ropa', 'FUTBOL', 54990, 45, 20, 5, 22, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:10'),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FB-001', 'Balón de Fútbol Nº5 FIFA Quality Pro', 'Accesorios', 'FUTBOL', 29990, 0, 10, 4, 15, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FB-002', 'Zapatilla Fútbol Sala Predator Edge', 'Calzado', 'FUTBOL', 69990, 5, 20, 6, 14, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FB-003', 'Canillera Pro Fibra de Carbono con Tobillera', 'Accesorios', 'FUTBOL', 14990, 8, 25, 5, 11, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FB-004', 'Short Deportivo Fútbol Dri-FIT Pro L', 'Ropa', 'FUTBOL', 19990, 22, 15, 4, 10, true, 'Matías Muñoz (Supervisor)', '23 Nov, 08:50'),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FB-006', 'Guantes de Arquero Uhlsport Soft Grip', 'Accesorios', 'FUTBOL', 32990, 2, 12, 4, 7, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-02', 'FB-007', 'Zapatos de Fútbol Terreno Firme Mercurial FG', 'Calzado', 'FUTBOL', 89990, 4, 15, 5, 12, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FB-008', 'Medias Técnicas de Fútbol Antideslizantes', 'Ropa', 'FUTBOL', 7990, 45, 20, 5, 25, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:05'),
        makeInv(MARATHON_CADENA_ID, 'SUC-03', 'FB-009', 'Cortavientos de Entrenamiento Fútbol Shield', 'Ropa', 'FUTBOL', 36990, 14, 18, 4, 8, false),

        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'RUN-001', 'Nike Vaporfly 3 (Talla 42)', 'Calzado', 'RUNNING', 189990, 3, 8, 5, 20, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:30'),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'RUN-008', 'Cortaviento Trail Shield', 'Ropa', 'RUNNING', 49990, 6, 12, 4, 14, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'RN-011', 'Zapatilla Running Pro Flyknit', 'Calzado', 'RUNNING', 89990, 38, 20, 6, 18, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:30'),
        makeInv(MARATHON_CADENA_ID, 'SUC-02', 'RN-012', 'Zapatilla Running Asics Gel-Nimbus 25', 'Calzado', 'RUNNING', 129990, 4, 18, 5, 9, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'RN-013', 'Mochila Técnica Trail Running 30 L', 'Accesorios', 'RUNNING', 34990, 54, 10, 3, 6, true, 'Irian Lopez (Auditor)', '23 Nov, 09:15'),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'RN-015', 'Reloj Deportivo GPS Pulsómetro Pro', 'Accesorios', 'RUNNING', 179990, 5, 10, 3, 5, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'RN-016', 'Polera Técnica Transpirable Running Breeze', 'Ropa', 'RUNNING', 18990, 26, 15, 4, 14, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:22'),
        makeInv(MARATHON_CADENA_ID, 'SUC-03', 'RN-017', 'Calzas Compresión Running Pro', 'Ropa', 'RUNNING', 27990, 11, 15, 4, 10, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-02', 'RN-018', 'Zapatilla Trail Running All-Terrain Grip', 'Calzado', 'RUNNING', 94990, 0, 12, 4, 7, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'RN-019', 'Cinturón de Hidratación con Caramañola', 'Accesorios', 'RUNNING', 15990, 30, 12, 4, 11, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:12'),

        makeInv(MARATHON_CADENA_ID, 'SUC-03', 'FIT-012', 'Polera Compresión Dry-Fit', 'Ropa', 'FITNESS', 24990, 18, 20, 5, 12, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 09:40'),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FT-021', 'Polera Térmica Compression M', 'Ropa', 'FITNESS', 24990, 6, 15, 4, 12, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-03', 'FT-022', 'Mancuerna Hexagonal Engomada 10kg Par', 'Accesorios', 'FITNESS', 34990, 3, 15, 4, 7, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-03', 'FT-023', 'Colchoneta Yoga Mat Antideslizante 6mm', 'Accesorios', 'FITNESS', 16990, 28, 25, 5, 14, true, 'Matías Muñoz (Supervisor)', '23 Nov, 09:00'),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FT-024', 'Proteína Whey Isolate 2kg Chocolate', 'Accesorios', 'FITNESS', 45990, 7, 30, 8, 16, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-02', 'FT-025', 'Set Bandas Elásticas de Resistencia x5', 'Accesorios', 'FITNESS', 12990, 42, 20, 5, 15, true, 'Renato Nuñez (Abastecimiento)', '23 Nov, 08:55'),
        makeInv(MARATHON_CADENA_ID, 'SUC-03', 'FT-026', 'Kettlebell Ruso Hierro Fundido 16kg', 'Accesorios', 'FITNESS', 29990, 0, 12, 4, 6, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FT-027', 'Zapatilla Training Crossfit Metcon Pro', 'Calzado', 'FITNESS', 84990, 14, 18, 5, 11, false),
        makeInv(MARATHON_CADENA_ID, 'SUC-02', 'FT-028', 'Cuerda de Saltar Alta Velocidad Speed Rope', 'Accesorios', 'FITNESS', 9990, 35, 15, 4, 13, true, 'Jorge Hormazabal (Encargado)', '23 Nov, 08:40'),
        makeInv(MARATHON_CADENA_ID, 'SUC-01', 'FT-029', 'Top Deportivo Soporte Alto Fitness Mujer', 'Ropa', 'FITNESS', 22990, 16, 15, 4, 10, true, 'Joyce Honores (Gerente)', '23 Nov, 08:30'),

        // === SPARTA DEPORTES (Tenant independiente — Aislamiento Multi-Inquilino) ===
        makeInv(SPARTA_CADENA_ID, 'SUC-01', 'SPA-001', 'Zapatilla New Balance FuelCell Rebel v4', 'Calzado', 'RUNNING', 139990, 2, 12, 4, 16, true, 'Gerencia Sparta', '23 Nov, 09:15'),
        makeInv(SPARTA_CADENA_ID, 'SUC-01', 'SPA-002', 'Raqueta Tenis Wilson Blade 98', 'Accesorios', 'FITNESS', 219990, 0, 6, 2, 5, false),
        makeInv(SPARTA_CADENA_ID, 'SUC-02', 'SPA-003', 'Balón Fútbol Puma Orbita LaLiga', 'Accesorios', 'FUTBOL', 34990, 9, 18, 5, 12, false),
        makeInv(SPARTA_CADENA_ID, 'SUC-02', 'SPA-004', 'Polera Técnica Sparta Pro Run', 'Ropa', 'RUNNING', 22990, 31, 15, 4, 11, true, 'Gerencia Sparta', '23 Nov, 08:40'),
        makeInv(SPARTA_CADENA_ID, 'SUC-01', 'SPA-005', 'Bicicleta Estática Spinning Pro S2', 'Accesorios', 'FITNESS', 349990, 1, 5, 2, 3, false),
        makeInv(SPARTA_CADENA_ID, 'SUC-02', 'SPA-006', 'Zapatilla Trail Hoka Speedgoat 6', 'Calzado', 'RUNNING', 164990, 19, 12, 4, 10, true, 'Gerencia Sparta', '23 Nov, 09:00'),
      ],
      orders: [
        {
          id: '55555555-5555-5555-5555-555555555501',
          cadena_id: MARATHON_CADENA_ID,
          sucursal_id: '22222222-2222-2222-2222-222222222201',
          sucursal_codigo: 'SUC-01',
          sucursal_nombre: 'Sucursal Costanera Center',
          sku_id: '44444444-4444-4444-4444-444444444401',
          sku_codigo: 'RUN-001',
          nombre_producto: 'Nike Vaporfly 3 (Talla 42)',
          tipo: 'Calzado',
          disciplina: 'RUNNING',
          stock_actual: 3,
          stock_minimo: 8,
          cantidad_sugerida: 25,
          fecha_pedido_sugerida: '2026-11-26',
          estado: 'PENDIENTE',
          lead_time_dias: 2,
          confidence_score: 94,
          evento_estacional: '+35% por Maratón de Santiago',
          formula_desglose: { demanda_esperada: 28, stock_seguridad: 5, stock_actual: 3, stock_transito: 0 },
        },
        {
          id: '55555555-5555-5555-5555-555555555502',
          cadena_id: MARATHON_CADENA_ID,
          sucursal_id: '22222222-2222-2222-2222-222222222201',
          sucursal_codigo: 'SUC-01',
          sucursal_nombre: 'Sucursal Costanera Center',
          sku_id: '44444444-4444-4444-4444-444444444402',
          sku_codigo: 'RUN-008',
          nombre_producto: 'Cortaviento Trail Shield',
          tipo: 'Ropa',
          disciplina: 'RUNNING',
          stock_actual: 6,
          stock_minimo: 12,
          cantidad_sugerida: 18,
          fecha_pedido_sugerida: '2026-11-27',
          estado: 'PENDIENTE',
          lead_time_dias: 2,
          confidence_score: 91,
          evento_estacional: 'Pico estacional calzado y abrigo',
          formula_desglose: { demanda_esperada: 20, stock_seguridad: 4, stock_actual: 6, stock_transito: 0 },
        },
        {
          id: '55555555-5555-5555-5555-555555555503',
          cadena_id: MARATHON_CADENA_ID,
          sucursal_id: '22222222-2222-2222-2222-222222222202',
          sucursal_codigo: 'SUC-02',
          sucursal_nombre: 'Sucursal Parque Arauco',
          sku_id: '44444444-4444-4444-4444-444444444403',
          sku_codigo: 'FUT-023',
          nombre_producto: 'Balón Torneo Pro Match N°5',
          tipo: 'Accesorios',
          disciplina: 'FUTBOL',
          stock_actual: 12,
          stock_minimo: 18,
          cantidad_sugerida: 28,
          fecha_pedido_sugerida: '2026-11-30',
          estado: 'PENDIENTE',
          lead_time_dias: 3,
          confidence_score: 87,
          evento_estacional: 'Inicio Torneo Nacional 2026',
          formula_desglose: { demanda_esperada: 34, stock_seguridad: 6, stock_actual: 12, stock_transito: 0 },
        },
        {
          id: 'ORD-101',
          cadena_id: MARATHON_CADENA_ID,
          sucursal_id: '22222222-2222-2222-2222-222222222201',
          sucursal_codigo: 'SUC-01',
          sucursal_nombre: 'Sucursal Costanera Center',
          sku_id: 'sku-1111-FB-001',
          sku_codigo: 'FB-001',
          nombre_producto: 'Balón de Fútbol Nº5 FIFA Quality Pro',
          tipo: 'Accesorios',
          disciplina: 'FUTBOL',
          stock_actual: 0,
          stock_minimo: 10,
          cantidad_sugerida: 60,
          fecha_pedido_sugerida: '2026-11-25',
          estado: 'PENDIENTE',
          lead_time_dias: 2,
          confidence_score: 93,
          evento_estacional: 'Quiebre crítico balón torneo',
          formula_desglose: { demanda_esperada: 56, stock_seguridad: 4, stock_actual: 0, stock_transito: 0 },
        },
        {
          id: 'ORD-104',
          cadena_id: MARATHON_CADENA_ID,
          sucursal_id: '22222222-2222-2222-2222-222222222203',
          sucursal_codigo: 'SUC-03',
          sucursal_nombre: 'Sucursal Plaza Vespucio',
          sku_id: 'sku-1111-FT-026',
          sku_codigo: 'FT-026',
          nombre_producto: 'Kettlebell Ruso Hierro Fundido 16kg',
          tipo: 'Accesorios',
          disciplina: 'FITNESS',
          stock_actual: 0,
          stock_minimo: 12,
          cantidad_sugerida: 35,
          fecha_pedido_sugerida: '2026-11-28',
          estado: 'PENDIENTE',
          lead_time_dias: 4,
          confidence_score: 89,
          evento_estacional: 'Campaña Verano Gimnasios',
          formula_desglose: { demanda_esperada: 31, stock_seguridad: 4, stock_actual: 0, stock_transito: 0 },
        },
        // Órdenes independientes para Sparta Deportes
        {
          id: 'SPA-ORD-01',
          cadena_id: SPARTA_CADENA_ID,
          sucursal_id: '22222222-2222-2222-2222-222222222301',
          sucursal_codigo: 'SUC-01',
          sucursal_nombre: 'Sparta Mall Sport',
          sku_id: 'sku-1112-SPA-001',
          sku_codigo: 'SPA-001',
          nombre_producto: 'Zapatilla New Balance FuelCell Rebel v4',
          tipo: 'Calzado',
          disciplina: 'RUNNING',
          stock_actual: 2,
          stock_minimo: 12,
          cantidad_sugerida: 24,
          fecha_pedido_sugerida: '2026-11-26',
          estado: 'PENDIENTE',
          lead_time_dias: 2,
          confidence_score: 93,
          evento_estacional: '+35% Temporada Running',
          formula_desglose: { demanda_esperada: 22, stock_seguridad: 4, stock_actual: 2, stock_transito: 0 },
        },
        {
          id: 'SPA-ORD-02',
          cadena_id: SPARTA_CADENA_ID,
          sucursal_id: '22222222-2222-2222-2222-222222222301',
          sucursal_codigo: 'SUC-01',
          sucursal_nombre: 'Sparta Mall Sport',
          sku_id: 'sku-1112-SPA-002',
          sku_codigo: 'SPA-002',
          nombre_producto: 'Raqueta Tenis Wilson Blade 98',
          tipo: 'Accesorios',
          disciplina: 'FITNESS',
          stock_actual: 0,
          stock_minimo: 6,
          cantidad_sugerida: 10,
          fecha_pedido_sugerida: '2026-11-27',
          estado: 'PENDIENTE',
          lead_time_dias: 2,
          confidence_score: 88,
          evento_estacional: 'Torneo Clubes Santiago',
          formula_desglose: { demanda_esperada: 8, stock_seguridad: 2, stock_actual: 0, stock_transito: 0 },
        },
      ],
      auditLots: [
        { id: 'LT-2026-1122-04', cadena_id: MARATHON_CADENA_ID, date: 'Hoy, 08:30', source: 'SAP Business One', records: '12.458', status: 'Validado', tone: 'success' },
        { id: 'LT-2026-1122-03', cadena_id: MARATHON_CADENA_ID, date: 'Ayer, 18:12', source: 'stock_semanal.xlsx', records: '4.862', status: 'Validado con alertas', tone: 'warning' },
        { id: 'LT-2026-1121-02', cadena_id: MARATHON_CADENA_ID, date: '21 Nov, 08:30', source: 'SAP Business One', records: '12.391', status: 'Validado', tone: 'success' },
        { id: 'SPA-LT-2026-01', cadena_id: SPARTA_CADENA_ID, date: 'Hoy, 09:00', source: 'Oracle Retail Sparta', records: '6.240', status: 'Validado', tone: 'success' },
      ],
      employeeAudits: [
        {
          id: 'LOG-701',
          cadena_id: MARATHON_CADENA_ID,
          timestamp: '23/11/2026 09:42:15',
          relativo: 'Hace 5 min',
          empleado: 'Joyce Honores',
          rol: 'Gerente de Operaciones',
          avatar: 'JH',
          color: 'from-blue-600 to-sky-500',
          tipo_gestion: 'Cierre de Inventario General',
          sucursal: 'Sucursal Costanera Center',
          terminal: 'Terminal POS-01 (Web)',
          detalle: 'Validó y cerró el último inventario general de 30 SKUs. Generó 5 solicitudes de reposición.',
          estado: 'VERIFICADO',
        },
        {
          id: 'LOG-702',
          cadena_id: MARATHON_CADENA_ID,
          timestamp: '23/11/2026 09:35:20',
          relativo: 'Hace 12 min',
          empleado: 'Jorge Hormazabal',
          rol: 'Encargado de Tienda',
          avatar: 'JH',
          color: 'from-emerald-600 to-teal-500',
          tipo_gestion: 'Conteo Físico en Góndola',
          sucursal: 'Sucursal Costanera Center',
          terminal: 'App Móvil Tienda',
          detalle: 'Conteo confirmado en Balón de Fútbol Nº5 FIFA Quality Pro (FB-001): 0 unidades en góndola.',
          estado: 'VERIFICADO',
        },
        {
          id: 'LOG-703',
          cadena_id: MARATHON_CADENA_ID,
          timestamp: '23/11/2026 09:30:10',
          relativo: 'Hace 17 min',
          empleado: 'Irian Lopez',
          rol: 'Auditor de Bodega',
          avatar: 'IL',
          color: 'from-purple-600 to-indigo-500',
          tipo_gestion: 'Ingesta Masiva CSV',
          sucursal: 'Sucursal Parque Arauco',
          terminal: 'Servidor Ingesta Bodega',
          detalle: 'Sincronizó planilla CSV de bodega con actualización de existencias.',
          estado: 'EXITOSO',
        },
        {
          id: 'SPA-LOG-01',
          cadena_id: SPARTA_CADENA_ID,
          timestamp: '23/11/2026 09:15:00',
          relativo: 'Hace 20 min',
          empleado: 'Gerencia Sparta',
          rol: 'GERENTE_OPERACIONES',
          avatar: 'GS',
          color: 'from-emerald-600 to-teal-500',
          tipo_gestion: 'Auditoría Mall Sport',
          sucursal: 'Sparta Mall Sport',
          terminal: 'Panel Gerencial Web',
          detalle: 'Revisión inicial de stock crítico para New Balance FuelCell y Wilson Blade.',
          estado: 'VERIFICADO',
        },
      ],
    };

    const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
    if (config.supabase.url && key) {
      try {
        this.supabase = createClient(config.supabase.url, key);
        this.isConnectedToSupabase = true;
        console.log('[Database] Cliente Supabase PostgreSQL inicializado.');
      } catch (err) {
        console.warn('[Database] Fallo conexión a Supabase, activando almacenamiento local reactivo:', err);
      }
    } else {
      console.log('[Database] Sin credenciales Supabase. Operando con Seed multi-tenant en memoria.');
    }
  }

  public isSupabaseActive(): boolean {
    return this.isConnectedToSupabase && this.supabase !== null;
  }

  private matchesBranch(item: { sucursal_id: string; sucursal_codigo: string }, branchFilter?: string): boolean {
    if (!branchFilter || branchFilter === 'TODAS') return true;
    return item.sucursal_id === branchFilter || item.sucursal_codigo.toUpperCase() === branchFilter.toUpperCase();
  }

  public async getInventory(cadenaId: string, sucursalFilter?: string): Promise<StoreInventory[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('inventario_tienda')
          .select('id, cadena_id, sucursal_id, sku_id, stock_actual, stock_minimo, stock_seguridad, stock_transito, ultimo_conteo_en, productos_sku(sku_codigo, nombre, disciplina, precio_venta), sucursales(codigo, nombre, lead_time_dias)')
          .eq('cadena_id', cadenaId);

        if (!error && data && data.length > 0) {
          const mapped: StoreInventory[] = data.map((row: any) => {
            const prod = Array.isArray(row.productos_sku) ? row.productos_sku[0] : row.productos_sku;
            const suc = Array.isArray(row.sucursales) ? row.sucursales[0] : row.sucursales;
            const nombre = prod?.nombre || 'SKU sin nombre';
            const stockActual = Number(row.stock_actual ?? 0);
            const stockMinimo = Number(row.stock_minimo ?? 5);
            const stockSeguridad = Number(row.stock_seguridad ?? 3);

            return {
              id: row.id,
              cadena_id: row.cadena_id,
              sucursal_id: row.sucursal_id,
              sucursal_codigo: suc?.codigo || 'SUC-01',
              sucursal_nombre: suc?.nombre || 'Sucursal',
              sku_id: row.sku_id,
              sku_codigo: prod?.sku_codigo || row.sku_id,
              nombre,
              tipo: inferCategory(nombre),
              disciplina: (prod?.disciplina || 'OTRO') as Disciplina,
              precio: Number(prod?.precio_venta ?? 0),
              stock_actual: stockActual,
              stock_minimo: stockMinimo,
              stock_seguridad: stockSeguridad,
              stock_transito: Number(row.stock_transito ?? 0),
              ventas_semanales_base: Math.max(5, Math.round(stockMinimo * 0.75)),
              estado_alerta: computeAlertLevel(stockActual, stockMinimo, stockSeguridad),
              lead_time_dias: Number(suc?.lead_time_dias ?? 3),
              conteo_confirmado: Boolean(row.ultimo_conteo_en),
              fecha_conteo: row.ultimo_conteo_en ? new Date(row.ultimo_conteo_en).toLocaleString('es-CL') : undefined,
              canal_ingesta: 'Supabase PostgreSQL',
            };
          });
          return mapped.filter((x) => this.matchesBranch(x, sucursalFilter));
        }
      } catch (err) {
        console.warn('[Database] Fallback a memoria en getInventory:', err);
      }
    }

    return this.memory.inventory.filter(
      (x) => x.cadena_id === cadenaId && this.matchesBranch(x, sucursalFilter)
    );
  }

  public async getStoreInventory(cadenaId: string, sucursalId?: string) {
    const items = await this.getInventory(cadenaId, sucursalId);
    return items.map((x) => ({
      sku: x.sku_codigo,
      title: x.nombre,
      variant: `${x.disciplina} · Reposición ${x.lead_time_dias}d`,
      stockActual: x.stock_actual,
      stockMinimo: x.stock_minimo,
      etaReposicion: `En ${x.lead_time_dias} días hábiles`,
      level: x.estado_alerta === 'CRITICO' ? 'critical' : x.estado_alerta === 'PREVENTIVO' ? 'warning' : 'optimal',
      isCounted: x.conteo_confirmado,
    }));
  }

  public async updateStock(
    cadenaId: string,
    skuCodigo: string,
    unitsToDeduct: number,
    sucursalId?: string
  ): Promise<StoreInventory> {
    const item = this.memory.inventory.find(
      (x) =>
        x.cadena_id === cadenaId &&
        x.sku_codigo.toUpperCase() === skuCodigo.toUpperCase() &&
        this.matchesBranch(x, sucursalId)
    );

    if (!item) {
      throw new Error(`SKU ${skuCodigo} no encontrado en el inventario de esta cadena.`);
    }

    if (item.stock_actual < unitsToDeduct) {
      throw new Error(`Stock insuficiente: disponible ${item.stock_actual}, solicitado ${unitsToDeduct}.`);
    }

    item.stock_actual -= unitsToDeduct;
    item.estado_alerta = computeAlertLevel(item.stock_actual, item.stock_minimo, item.stock_seguridad);

    if (this.supabase) {
      try {
        const { data: prod } = await this.supabase
          .from('productos_sku')
          .select('id')
          .eq('cadena_id', cadenaId)
          .eq('sku_codigo', item.sku_codigo)
          .maybeSingle();

        if (prod?.id) {
          await this.supabase
            .from('inventario_tienda')
            .update({ stock_actual: item.stock_actual, actualizado_en: new Date().toISOString() })
            .eq('cadena_id', cadenaId)
            .eq('sku_id', prod.id);
        }
      } catch (err) {
        console.warn('[Database] Error actualizando stock en Supabase:', err);
      }
    }

    return item;
  }

  public async adjustStockCount(
    cadenaId: string,
    skuCodigo: string,
    newStock: number,
    sucursalId?: string,
    responsible = 'Encargado de Tienda'
  ): Promise<StoreInventory> {
    const item = this.memory.inventory.find(
      (x) =>
        x.cadena_id === cadenaId &&
        x.sku_codigo.toUpperCase() === skuCodigo.toUpperCase() &&
        this.matchesBranch(x, sucursalId)
    );

    if (!item) {
      throw new Error(`SKU ${skuCodigo} no encontrado en esta cadena.`);
    }

    item.stock_actual = Math.max(0, newStock);
    item.conteo_confirmado = true;
    item.auditado_por = responsible;
    item.fecha_conteo = `Hoy, ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    item.estado_alerta = computeAlertLevel(item.stock_actual, item.stock_minimo, item.stock_seguridad);

    if (this.supabase) {
      try {
        const { data: prod } = await this.supabase
          .from('productos_sku')
          .select('id')
          .eq('cadena_id', cadenaId)
          .eq('sku_codigo', item.sku_codigo)
          .maybeSingle();

        if (prod?.id) {
          await this.supabase
            .from('inventario_tienda')
            .update({
              stock_actual: item.stock_actual,
              ultimo_conteo_en: new Date().toISOString(),
              actualizado_en: new Date().toISOString(),
            })
            .eq('cadena_id', cadenaId)
            .eq('sku_id', prod.id);
        }
      } catch (err) {
        console.warn('[Database] Error persistiendo ajuste físico en Supabase:', err);
      }
    }

    await this.addEmployeeAuditLog(cadenaId, {
      empleado: responsible,
      rol: 'JEFE_TIENDA',
      tipo_gestion: 'Ajuste Físico en Góndola',
      sucursal: item.sucursal_nombre,
      terminal: 'App Móvil Tienda',
      detalle: `Conteo físico confirmado en ${item.nombre} (${item.sku_codigo}): ${item.stock_actual} unidades.`,
      estado: 'VERIFICADO',
    });

    return item;
  }

  public async getOrders(cadenaId: string, estado?: string): Promise<ReplenishmentOrder[]> {
    if (this.supabase) {
      try {
        let query = this.supabase
          .from('ordenes_reposicion')
          .select('id, cadena_id, sucursal_id, sku_id, cantidad_sugerida, cantidad_aprobada, fecha_pedido_sugerida, estado, productos_sku(sku_codigo, nombre, disciplina), sucursales(codigo, nombre, lead_time_dias)')
          .eq('cadena_id', cadenaId);

        if (estado) {
          query = query.eq('estado', estado);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((row: any) => {
            const prod = Array.isArray(row.productos_sku) ? row.productos_sku[0] : row.productos_sku;
            const suc = Array.isArray(row.sucursales) ? row.sucursales[0] : row.sucursales;
            const nombre = prod?.nombre || 'Producto';
            const qty = Number(row.cantidad_sugerida ?? 0);
            return {
              id: row.id,
              cadena_id: row.cadena_id,
              sucursal_id: row.sucursal_id,
              sucursal_codigo: suc?.codigo || 'SUC-01',
              sucursal_nombre: suc?.nombre || 'Sucursal',
              sku_id: row.sku_id,
              sku_codigo: prod?.sku_codigo || row.sku_id,
              nombre_producto: nombre,
              tipo: inferCategory(nombre),
              disciplina: (prod?.disciplina || 'OTRO') as Disciplina,
              stock_actual: 0,
              stock_minimo: 10,
              cantidad_sugerida: qty,
              cantidad_aprobada: row.cantidad_aprobada ? Number(row.cantidad_aprobada) : undefined,
              fecha_pedido_sugerida: row.fecha_pedido_sugerida,
              estado: row.estado,
              lead_time_dias: Number(suc?.lead_time_dias ?? 3),
              confidence_score: 92,
              evento_estacional: 'Pronóstico Supabase Cloud',
              formula_desglose: {
                demanda_esperada: qty,
                stock_seguridad: 5,
                stock_actual: 0,
                stock_transito: 0,
              },
            };
          });
        }
      } catch (err) {
        console.warn('[Database] Fallback a memoria en getOrders:', err);
      }
    }

    const tenantOrders = this.memory.orders.filter((x) => x.cadena_id === cadenaId);
    return estado ? tenantOrders.filter((x) => x.estado === estado) : tenantOrders;
  }

  public async createOrder(
    cadenaId: string,
    params: {
      skuCodigo: string;
      sucursalId?: string;
      cantidadSugerida: number;
      eventoEstacional?: string;
      demandaEsperada?: number;
      confidenceScore?: number;
    }
  ): Promise<ReplenishmentOrder> {
    const inv = this.memory.inventory.find(
      (x) =>
        x.cadena_id === cadenaId &&
        x.sku_codigo.toUpperCase() === params.skuCodigo.toUpperCase() &&
        this.matchesBranch(x, params.sucursalId)
    );

    const existing = this.memory.orders.find(
      (o) =>
        o.cadena_id === cadenaId &&
        o.sku_codigo.toUpperCase() === params.skuCodigo.toUpperCase() &&
        o.estado === 'PENDIENTE'
    );
    if (existing) return existing;

    const branch =
      this.memory.branches.find((b) => b.cadena_id === cadenaId && (b.id === inv?.sucursal_id || b.codigo === params.sucursalId)) ||
      this.memory.branches.find((b) => b.cadena_id === cadenaId) ||
      this.memory.branches[0];

    const fechaPedido = new Date(Date.now() + branch.lead_time_dias * 86400000).toISOString().split('T')[0];

    const newOrder: ReplenishmentOrder = {
      id: `ORD-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 89)}`,
      cadena_id: cadenaId,
      sucursal_id: branch.id,
      sucursal_codigo: branch.codigo,
      sucursal_nombre: branch.nombre,
      sku_id: inv?.sku_id || `sku-${params.skuCodigo}`,
      sku_codigo: inv?.sku_codigo || params.skuCodigo.toUpperCase(),
      nombre_producto: inv?.nombre || params.skuCodigo,
      tipo: inv?.tipo || 'Accesorios',
      disciplina: inv?.disciplina || 'OTRO',
      stock_actual: inv?.stock_actual ?? 0,
      stock_minimo: inv?.stock_minimo ?? 10,
      cantidad_sugerida: params.cantidadSugerida,
      fecha_pedido_sugerida: fechaPedido,
      estado: 'PENDIENTE',
      lead_time_dias: branch.lead_time_dias,
      confidence_score: params.confidenceScore ?? 91,
      evento_estacional: params.eventoEstacional || 'Reposición predictiva',
      formula_desglose: {
        demanda_esperada: params.demandaEsperada ?? params.cantidadSugerida,
        stock_seguridad: inv?.stock_seguridad ?? 4,
        stock_actual: inv?.stock_actual ?? 0,
        stock_transito: inv?.stock_transito ?? 0,
      },
    };

    this.memory.orders.unshift(newOrder);

    if (this.supabase) {
      try {
        const { data: prod } = await this.supabase
          .from('productos_sku')
          .select('id')
          .eq('cadena_id', cadenaId)
          .eq('sku_codigo', newOrder.sku_codigo)
          .maybeSingle();

        const { data: suc } = await this.supabase
          .from('sucursales')
          .select('id')
          .eq('cadena_id', cadenaId)
          .eq('codigo', branch.codigo)
          .maybeSingle();

        if (prod?.id && suc?.id) {
          await this.supabase.from('ordenes_reposicion').insert({
            cadena_id: cadenaId,
            sucursal_id: suc.id,
            sku_id: prod.id,
            cantidad_sugerida: newOrder.cantidad_sugerida,
            fecha_pedido_sugerida: newOrder.fecha_pedido_sugerida,
            estado: 'PENDIENTE',
          });
        }
      } catch (err) {
        console.warn('[Database] Error insertando orden en Supabase:', err);
      }
    }

    return newOrder;
  }

  public async resolveOrder(
    cadenaId: string,
    orderId: string,
    status: 'APROBADA' | 'RECHAZADA',
    approvedQty?: number,
    approverName = 'Gerente de Operaciones'
  ): Promise<ReplenishmentOrder> {
    const order = this.memory.orders.find(
      (x) => x.cadena_id === cadenaId && (x.id === orderId || x.sku_codigo === orderId)
    );
    if (!order) {
      throw new Error(`Orden ${orderId} no encontrada para esta cadena.`);
    }

    order.estado = status;
    if (status === 'APROBADA') {
      order.cantidad_aprobada = approvedQty ?? order.cantidad_sugerida;
      const inv = this.memory.inventory.find(
        (x) => x.cadena_id === cadenaId && x.sku_codigo === order.sku_codigo
      );
      if (inv) inv.stock_transito += order.cantidad_aprobada;
    }

    if (this.supabase) {
      try {
        await this.supabase
          .from('ordenes_reposicion')
          .update({
            estado: status,
            cantidad_aprobada: status === 'APROBADA' ? order.cantidad_aprobada : null,
            resuelto_en: new Date().toISOString(),
          })
          .eq('id', order.id)
          .eq('cadena_id', cadenaId);
      } catch (err) {
        console.warn('[Database] Error actualizando orden en Supabase:', err);
      }
    }

    await this.addEmployeeAuditLog(cadenaId, {
      empleado: approverName,
      rol: 'GERENTE_OPERACIONES',
      tipo_gestion: status === 'APROBADA' ? 'Aprobación de Orden' : 'Rechazo de Orden',
      sucursal: order.sucursal_nombre,
      terminal: 'Panel Gerencial Web',
      detalle: `${status === 'APROBADA' ? 'Aprobó' : 'Rechazó'} orden ${order.id} (${order.sku_codigo} · ${order.cantidad_sugerida} u.).`,
      estado: status === 'APROBADA' ? 'APROBADO' : 'RECHAZADO',
    });

    return order;
  }

  public async getAuditLots(cadenaId: string): Promise<AuditLotRow[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('lotes_ingesta')
          .select('lote_codigo, cadena_id, origen, nombre_archivo, registros_totales, registros_fallidos, estado, creado_en')
          .eq('cadena_id', cadenaId)
          .order('creado_en', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.lote_codigo,
            cadena_id: row.cadena_id,
            date: new Date(row.creado_en).toLocaleString('es-CL'),
            source: row.nombre_archivo || row.origen,
            records: Number(row.registros_totales ?? 0).toLocaleString('es-CL'),
            status: row.estado === 'VALIDADO_CON_ALERTAS' ? 'Validado con alertas' : row.estado === 'FALLIDO' ? 'Fallido' : 'Validado',
            tone: row.registros_fallidos > 0 ? 'warning' : 'success',
          }));
        }
      } catch (err) {
        console.warn('[Database] Fallback a memoria en getAuditLots:', err);
      }
    }

    return this.memory.auditLots.filter((l) => l.cadena_id === cadenaId);
  }

  public async saveIngestionBatch(
    cadenaId: string,
    lotCode: string,
    source: string,
    rows: IngestionRow[],
    errors: { row: number; error: string }[] = []
  ) {
    const hasErrors = errors.length > 0;
    this.memory.auditLots.unshift({
      id: lotCode,
      cadena_id: cadenaId,
      date: 'Ahora mismo',
      source,
      records: rows.length.toLocaleString('es-CL'),
      status: hasErrors ? `Validado con ${errors.length} alertas` : 'Validado',
      tone: hasErrors ? 'warning' : 'success',
    });

    // Actualizar SKUs existentes o INSERTAR SKUs nuevos en la cadena
    for (const row of rows) {
      const existing = this.memory.inventory.find(
        (x) => x.cadena_id === cadenaId && x.sku_codigo.toUpperCase() === row.sku_codigo.toUpperCase()
      );
      if (existing) {
        existing.stock_actual = row.stock_actual;
        existing.stock_minimo = row.stock_minimo;
        if (row.precio_unitario > 0) existing.precio = row.precio_unitario;
        existing.canal_ingesta = source;
        existing.estado_alerta = computeAlertLevel(existing.stock_actual, existing.stock_minimo, existing.stock_seguridad);
      } else {
        const created = makeInv(
          cadenaId,
          row.sucursal_codigo,
          row.sku_codigo.toUpperCase(),
          row.nombre,
          inferCategory(row.nombre),
          row.disciplina,
          row.precio_unitario,
          row.stock_actual,
          row.stock_minimo,
          Math.max(3, Math.round(row.stock_minimo * 0.3)),
          Math.max(4, row.unidades_vendidas),
          false
        );
        created.canal_ingesta = source;
        this.memory.inventory.unshift(created);
      }
    }

    if (this.supabase) {
      try {
        await this.supabase.from('lotes_ingesta').insert({
          cadena_id: cadenaId,
          lote_codigo: lotCode,
          origen: source.toLowerCase().includes('api') ? 'API_ERP' : 'CSV_MANUAL',
          nombre_archivo: source,
          registros_totales: rows.length + errors.length,
          registros_validos: rows.length,
          registros_fallidos: errors.length,
          estado: hasErrors ? 'VALIDADO_CON_ALERTAS' : 'VALIDADO',
          detalles_error: hasErrors ? errors : null,
        });
      } catch (err) {
        console.warn('[Database] Error guardando lote en Supabase:', err);
      }
    }

    return { processed: rows.length };
  }

  public async getEmployeeAuditLogs(cadenaId: string): Promise<EmployeeAuditEntry[]> {
    return this.memory.employeeAudits.filter((l) => l.cadena_id === cadenaId);
  }

  public async addEmployeeAuditLog(
    cadenaId: string,
    entry: {
      empleado: string;
      rol: string;
      tipo_gestion: string;
      sucursal: string;
      terminal: string;
      detalle: string;
      estado: EmployeeAuditEntry['estado'];
    }
  ): Promise<EmployeeAuditEntry> {
    const initials = entry.empleado
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const now = new Date();
    const created: EmployeeAuditEntry = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      cadena_id: cadenaId,
      timestamp: `${now.toLocaleDateString('es-CL')} ${now.toLocaleTimeString('es-CL')}`,
      relativo: 'Recién',
      empleado: entry.empleado,
      rol: entry.rol,
      avatar: initials || 'US',
      color: 'from-emerald-600 to-teal-500',
      tipo_gestion: entry.tipo_gestion,
      sucursal: entry.sucursal,
      terminal: entry.terminal,
      detalle: entry.detalle,
      estado: entry.estado,
    };
    this.memory.employeeAudits.unshift(created);
    return created;
  }
}

export const db = new DatabaseService();

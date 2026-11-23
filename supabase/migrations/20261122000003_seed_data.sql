-- ==============================================================================
-- SPORTSTOCK AI — MIGRACIÓN 03: SEED CON DATASET REALISTA DE RETAIL CHILENO
-- Carga inicial para pruebas y demostración de flujo de extremo a extremo
-- ==============================================================================

-- 1. Insertar Cadena Representativa (Marathon Sports Chile)
INSERT INTO cadenas (id, nombre, rut, tier, moneda)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Marathon Sports Chile', '76.842.190-3', 'TIER_1', 'USD')
ON CONFLICT (rut) DO NOTHING;

-- 2. Insertar Sucursales Principales en Santiago
INSERT INTO sucursales (id, cadena_id, codigo, nombre, direccion, comuna, lead_time_dias)
VALUES 
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'SUC-01', 'Sucursal Costanera Center', 'Av. Andrés Bello 2425, Nivel 3', 'Providencia', 2),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'SUC-02', 'Sucursal Parque Arauco', 'Av. Kennedy 5413, Piso 2', 'Las Condes', 3),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'SUC-03', 'Sucursal Plaza Vespucio', 'Av. Vicuña Mackenna 7110', 'La Florida', 4)
ON CONFLICT (cadena_id, codigo) DO NOTHING;

-- 3. Insertar Usuarios Operativos
INSERT INTO usuarios (id, cadena_id, sucursal_id, email, nombre_completo, rol)
VALUES 
    ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', NULL, 'matias.gonzalez@marathonsports.cl', 'Matías González', 'GERENTE_OPERACIONES'),
    ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'tienda.costanera@marathonsports.cl', 'Encargado Tienda Costanera', 'ENCARGADO_TIENDA'),
    ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', NULL, 'admin.ti@marathonsports.cl', 'Administrador TI / Datos', 'ADMIN_TI')
ON CONFLICT (email) DO NOTHING;

-- 4. Catálogo Maestro de SKUs
INSERT INTO productos_sku (id, cadena_id, sku_codigo, nombre, disciplina, talla, precio_costo, precio_venta)
VALUES 
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111', 'RUN-001', 'Nike Vaporfly 3', 'RUNNING', 'Talla 42', 125000, 219990),
    ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111111', 'RUN-008', 'Cortaviento Trail Shield', 'RUNNING', 'Talla M', 32000, 69990),
    ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111111', 'FUT-023', 'Balón Torneo Pro Match N°5', 'FUTBOL', 'Estándar', 18000, 39990),
    ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111111', 'FIT-012', 'Polera Compresión Dry-Fit', 'FITNESS', 'Talla L', 14000, 29990),
    ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111111', 'FUT-104', 'Camiseta Local Oficial 2026', 'FUTBOL', 'Talla M', 38000, 74990)
ON CONFLICT (cadena_id, sku_codigo) DO NOTHING;

-- 5. Inventario en Tienda (Configurado para generar alertas críticas y preventivas)
INSERT INTO inventario_tienda (cadena_id, sucursal_id, sku_id, stock_actual, stock_minimo, stock_seguridad, stock_transito)
VALUES 
    -- Costanera Center: RUN-001 en Quiebre Crítico (3 u. vs mín 8)
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', 3, 8, 5, 0),
    -- Costanera Center: RUN-008 en Quiebre Crítico (6 u. vs mín 12)
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444402', 6, 12, 4, 0),
    -- Parque Arauco: FUT-023 en Alerta Preventiva (12 u. vs mín 18)
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', '44444444-4444-4444-4444-444444444403', 12, 18, 6, 0),
    -- Plaza Vespucio: FIT-012 en Alerta Preventiva (18 u. vs mín 20)
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', '44444444-4444-4444-4444-444444444404', 18, 20, 5, 0),
    -- Parque Arauco: FUT-104 en Stock Óptimo (45 u. vs mín 20)
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', '44444444-4444-4444-4444-444444444405', 45, 20, 5, 10)
ON CONFLICT (sucursal_id, sku_id) DO UPDATE 
SET stock_actual = EXCLUDED.stock_actual, stock_minimo = EXCLUDED.stock_minimo;

-- 6. Ventas Históricas (Últimas 6 semanas)
INSERT INTO ventas_historicas (cadena_id, sucursal_id, sku_id, fecha, unidades, monto_total)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', '2026-10-12', 15, 3299850),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', '2026-10-19', 18, 3959820),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', '2026-10-26', 22, 4839780),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', '2026-11-02', 26, 5719740),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', '2026-11-09', 28, 6159720),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', '2026-11-16', 31, 6819690)
ON CONFLICT DO NOTHING;

-- 7. Órdenes Sugeridas Pendientes de Aprobación
INSERT INTO ordenes_reposicion (id, cadena_id, sucursal_id, sku_id, cantidad_sugerida, fecha_pedido_sugerida, estado)
VALUES 
    ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444401', 25, '2026-11-26', 'PENDIENTE'),
    ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', '44444444-4444-4444-4444-444444444402', 18, '2026-11-27', 'PENDIENTE'),
    ('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', '44444444-4444-4444-4444-444444444403', 28, '2026-11-30', 'PENDIENTE')
ON CONFLICT (id) DO NOTHING;

-- 8. Auditoría Inicial de Lotes de Ingesta
INSERT INTO lotes_ingesta (lote_codigo, cadena_id, origen, nombre_archivo, registros_totales, registros_validos, registros_fallidos, estado)
VALUES 
    ('LT-2026-1122-04', '11111111-1111-1111-1111-111111111111', 'API_ERP', 'sap_sync_batch.json', 12458, 12458, 0, 'VALIDADO'),
    ('LT-2026-1122-03', '11111111-1111-1111-1111-111111111111', 'CSV_MANUAL', 'stock_semanal_costanera.csv', 4862, 4850, 12, 'VALIDADO_CON_ALERTAS')
ON CONFLICT (lote_codigo) DO NOTHING;

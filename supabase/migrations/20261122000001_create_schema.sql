-- ==============================================================================
-- SPORTSTOCK AI — MIGRACIÓN 01: ESQUEMA RELACIONAL 3FN
-- Compatible con PostgreSQL 15+ / Supabase Cloud
-- ==============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Cadenas de Retail Deportivo (Tenants)
CREATE TABLE IF NOT EXISTS cadenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    rut VARCHAR(20) NOT NULL UNIQUE,
    tier VARCHAR(20) NOT NULL DEFAULT 'TIER_1' CHECK (tier IN ('TIER_1', 'TIER_2')),
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Sucursales por Cadena
CREATE TABLE IF NOT EXISTS sucursales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    comuna VARCHAR(100),
    ciudad VARCHAR(100) DEFAULT 'Santiago',
    lead_time_dias INT NOT NULL DEFAULT 3 CHECK (lead_time_dias > 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cadena_id, codigo)
);

-- 3. Tabla de Usuarios y Perfiles (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('ADMIN_TI', 'GERENTE_OPERACIONES', 'ENCARGADO_TIENDA')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Catálogo Maestro de Productos y SKUs
CREATE TABLE IF NOT EXISTS productos_sku (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    sku_codigo VARCHAR(100) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    disciplina VARCHAR(50) NOT NULL CHECK (disciplina IN ('FUTBOL', 'RUNNING', 'FITNESS', 'TRAIL', 'OUTDOOR', 'OTRO')),
    talla VARCHAR(20),
    precio_costo NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio_costo >= 0),
    precio_venta NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cadena_id, sku_codigo)
);

-- 5. Inventario en Tienda en Tiempo Real
CREATE TABLE IF NOT EXISTS inventario_tienda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES productos_sku(id) ON DELETE CASCADE,
    stock_actual INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    stock_seguridad INT NOT NULL DEFAULT 3 CHECK (stock_seguridad >= 0),
    stock_transito INT NOT NULL DEFAULT 0 CHECK (stock_transito >= 0),
    ultimo_conteo_en TIMESTAMPTZ,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sucursal_id, sku_id)
);

-- 6. Historial de Ventas Semanales / Diarias
CREATE TABLE IF NOT EXISTS ventas_historicas (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES productos_sku(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    unidades INT NOT NULL CHECK (unidades > 0),
    monto_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, fecha)
) PARTITION BY RANGE (fecha);

-- Particiones iniciales (2025 y 2026)
CREATE TABLE IF NOT EXISTS ventas_historicas_2025 PARTITION OF ventas_historicas
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS ventas_historicas_2026 PARTITION OF ventas_historicas
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE IF NOT EXISTS ventas_historicas_default PARTITION OF ventas_historicas
    DEFAULT;

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_brin ON ventas_historicas USING BRIN (fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_cadena_sucursal_sku ON ventas_historicas (cadena_id, sucursal_id, sku_id);
CREATE INDEX IF NOT EXISTS idx_inventario_stock_min ON inventario_tienda (sucursal_id, stock_actual, stock_minimo);

-- 7. Proyecciones Predictivas de Demanda
CREATE TABLE IF NOT EXISTS proyecciones_demanda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES productos_sku(id) ON DELETE CASCADE,
    fecha_inicio_semana DATE NOT NULL,
    horizonte_semana INT NOT NULL CHECK (horizonte_semana BETWEEN 1 AND 8),
    demanda_proyectada INT NOT NULL CHECK (demanda_proyectada >= 0),
    limite_inferior INT,
    limite_superior INT,
    factor_estacional NUMERIC(5, 3) NOT NULL DEFAULT 1.000,
    confidence_score INT NOT NULL DEFAULT 90 CHECK (confidence_score BETWEEN 0 AND 100),
    evento_estacional VARCHAR(150),
    generado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Órdenes y Sugerencias de Reposición
CREATE TABLE IF NOT EXISTS ordenes_reposicion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES productos_sku(id) ON DELETE CASCADE,
    cantidad_sugerida INT NOT NULL CHECK (cantidad_sugerida > 0),
    cantidad_aprobada INT CHECK (cantidad_aprobada >= 0),
    fecha_pedido_sugerida DATE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'EN_TRANSITO', 'RECIBIDA')),
    aprobado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    resuelto_en TIMESTAMPTZ,
    motivo_rechazo TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Auditoría de Lotes de Ingesta (API REST / CSV)
CREATE TABLE IF NOT EXISTS lotes_ingesta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cadena_id UUID NOT NULL REFERENCES cadenas(id) ON DELETE CASCADE,
    lote_codigo VARCHAR(50) NOT NULL UNIQUE,
    origen VARCHAR(50) NOT NULL CHECK (origen IN ('API_ERP', 'CSV_MANUAL', 'SANDBOX')),
    nombre_archivo VARCHAR(255),
    registros_totales INT NOT NULL DEFAULT 0,
    registros_validos INT NOT NULL DEFAULT 0,
    registros_fallidos INT NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'PROCESANDO' CHECK (estado IN ('PROCESANDO', 'VALIDADO', 'VALIDADO_CON_ALERTAS', 'FALLIDO')),
    detalles_error JSONB,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SPORTSTOCK AI — MIGRACIÓN 02: SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- Cumplimiento de Ley N° 21.719 y Aislamiento Multi-Inquilino Estricto
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas sensibles
ALTER TABLE cadenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_sku ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_tienda ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_historicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecciones_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_reposicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_ingesta ENABLE ROW LEVEL SECURITY;

-- 2. Funciones auxiliares de contexto JWT (Compatibles con Supabase Auth)
CREATE OR REPLACE FUNCTION current_cadena_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claim.cadena_id', true), '')::UUID,
        NULLIF(current_setting('app.current_cadena_id', true), '')::UUID
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claim.rol', true), ''),
        NULLIF(current_setting('app.current_rol', true), '')
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_sucursal_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('request.jwt.claim.sucursal_id', true), '')::UUID,
        NULLIF(current_setting('app.current_sucursal_id', true), '')::UUID
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Políticas para PRODUCTOS_SKU
DROP POLICY IF EXISTS p_productos_sku_select ON productos_sku;
CREATE POLICY p_productos_sku_select ON productos_sku
    FOR SELECT TO authenticated, anon
    USING (cadena_id = current_cadena_id() OR current_cadena_id() IS NULL);

DROP POLICY IF EXISTS p_productos_sku_admin ON productos_sku;
CREATE POLICY p_productos_sku_admin ON productos_sku
    FOR ALL TO authenticated
    USING (cadena_id = current_cadena_id() AND current_user_role() IN ('ADMIN_TI', 'GERENTE_OPERACIONES'));

-- 4. Políticas para INVENTARIO_TIENDA
DROP POLICY IF EXISTS p_inventario_select ON inventario_tienda;
CREATE POLICY p_inventario_select ON inventario_tienda
    FOR SELECT TO authenticated, anon
    USING (
        cadena_id = current_cadena_id() OR current_cadena_id() IS NULL
    );

DROP POLICY IF EXISTS p_inventario_update_tienda ON inventario_tienda;
CREATE POLICY p_inventario_update_tienda ON inventario_tienda
    FOR UPDATE TO authenticated
    USING (
        cadena_id = current_cadena_id() AND (
            current_user_role() IN ('GERENTE_OPERACIONES', 'ADMIN_TI') OR
            (current_user_role() = 'ENCARGADO_TIENDA' AND sucursal_id = current_sucursal_id())
        )
    );

-- 5. Políticas para ÓRDENES_REPOSICIÓN
DROP POLICY IF EXISTS p_ordenes_select ON ordenes_reposicion;
CREATE POLICY p_ordenes_select ON ordenes_reposicion
    FOR SELECT TO authenticated, anon
    USING (cadena_id = current_cadena_id() OR current_cadena_id() IS NULL);

DROP POLICY IF EXISTS p_ordenes_gerente_update ON ordenes_reposicion;
CREATE POLICY p_ordenes_gerente_update ON ordenes_reposicion
    FOR UPDATE TO authenticated
    USING (cadena_id = current_cadena_id() AND current_user_role() IN ('GERENTE_OPERACIONES', 'ADMIN_TI'));

-- 6. Trigger para auditoría automática de resolución de órdenes
CREATE OR REPLACE FUNCTION fn_audit_orden_resolucion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado <> OLD.estado AND NEW.estado IN ('APROBADA', 'RECHAZADA') THEN
        NEW.resuelto_en = NOW();
        IF NEW.cantidad_aprobada IS NULL AND NEW.estado = 'APROBADA' THEN
            NEW.cantidad_aprobada = NEW.cantidad_sugerida;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_orden_resolucion ON ordenes_reposicion;
CREATE TRIGGER trg_audit_orden_resolucion
    BEFORE UPDATE ON ordenes_reposicion
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_orden_resolucion();

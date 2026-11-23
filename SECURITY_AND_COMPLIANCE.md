# Seguridad y Cumplimiento Normativo (SECURITY & COMPLIANCE)
## SportStockAI — Plataforma SaaS B2B

---

## 1. Cumplimiento Regulatorio: Ley N° 21.719 (Chile)

En conformidad con la legislación chilena sobre protección de la vida privada y tratamiento de datos personales (**Ley N° 21.719** que moderniza la **Ley N° 19.628**):

### 1.1. Principio de Minimización de Datos
- **SportStockAI solo almacena y procesa información estrictamente necesaria** para optimizar la cadena de suministro y la disponibilidad en góndola.
- **Queda terminantemente prohibido almacenar**: Nombres, RUT, domicilios, teléfonos o tarjetas de crédito de clientes consumidores finales.
- Toda transacción comercial proveniente de los sistemas POS/ERP de las cadenas cliente debe anonimizarse antes o durante la ingesta, reteniendo únicamente:
  - Identificador de Sucursal.
  - Código SKU del producto.
  - Fecha y hora de la transacción.
  - Cantidad de unidades vendidas y monto bruto.

### 1.2. Contratos de Encargo de Tratamiento
- La relación contractual entre SportStockAI y la cadena deportiva (ej. Decathlon, Sparta) estipula que la cadena actúa en calidad de **Responsable del Tratamiento** y SportStockAI en calidad de **Encargado del Tratamiento**.
- Los datos de inventario y ventas no se compartirán, cederán ni utilizarán para entrenar modelos agregados transversales sin la previa autorización explícita y anonimización de los registros.

---

## 2. Matriz de Control de Acceso Basado en Roles (RBAC)

El sistema define 3 roles de usuario con permisos mutuamente excluyentes:

| Recurso / Acción | ADMIN_TI | GERENTE_OPERACIONES | ENCARGADO_TIENDA |
| :--- | :---: | :---: | :---: |
| **Configurar API / Webhooks ERP** | Total | Sin acceso | Sin acceso |
| **Cargar Lotes CSV Masivos** | Total | Sin acceso | Sin acceso |
| **Ver Dashboard Consolidado de Red** | Solo lectura | Total | Sin acceso |
| **Aprobar / Rechazar Órdenes Reposición** | Sin acceso | Total | Sin acceso |
| **Consultar Alertas de su Sucursal** | Solo lectura | Solo lectura | Total (Solo su tienda) |
| **Registrar Venta / Descontar Stock Local**| Sin acceso | Sin acceso | Total (Solo su tienda) |
| **Auditoría y Logs del Sistema** | Total | Parcial | Sin acceso |

---

## 3. Implementación de Row-Level Security (RLS) en Supabase

Cada tabla de la base de datos debe implementar políticas de seguridad a nivel de fila. Ejemplo de política obligatoria:

```sql
-- Habilitar RLS en órdenes de reposición
ALTER TABLE ordenes_reposicion ENABLE ROW LEVEL SECURITY;

-- Política 1: Gerente de Operaciones puede ver y editar órdenes de SU cadena
CREATE POLICY gerente_cadena_policy ON ordenes_reposicion
    FOR ALL
    TO authenticated
    USING (
        cadena_id = (auth.jwt() -> 'app_metadata' ->> 'cadena_id')::uuid
        AND (auth.jwt() -> 'app_metadata' ->> 'rol') IN ('GERENTE_OPERACIONES', 'ADMIN_TI')
    );

-- Política 2: Encargado de Tienda solo puede VER órdenes de SU sucursal asignada
CREATE POLICY tienda_sucursal_policy ON ordenes_reposicion
    FOR SELECT
    TO authenticated
    USING (
        cadena_id = (auth.jwt() -> 'app_metadata' ->> 'cadena_id')::uuid
        AND sucursal_id = (auth.jwt() -> 'app_metadata' ->> 'sucursal_id')::uuid
        AND (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ENCARGADO_TIENDA'
    );
```

---

## 4. Gestión de Secretos y Configuración

1. **Prohibición de Secretos en Control de Versiones**:
   - Ninguna clave API (`SUPABASE_SERVICE_KEY`, `REDIS_PASSWORD`, llaves JWT, tokens de conexión ERP) debe commitearse a Git.
   - Todo archivo `.env` está expresamente incluido en `.gitignore`.
   - Se mantiene un archivo `.env.example` actualizado con nombres de variables y descripciones, sin valores reales.
2. **Rotación de Credenciales**:
   - Las claves de servicio de producción se rotan trimestralmente o de inmediato si se detecta cualquier sospecha de filtración.
3. **Cifrado en Reposo y en Tránsito**:
   - Todo tráfico web/móvil hacia la API viaja obligatoriamente cifrado con TLS 1.3.
   - La base de datos PostgreSQL de Supabase utiliza cifrado AES-256 en reposo para volúmenes y respaldos.

---

## 5. Auditoría y Trazabilidad

- Cada cambio de estado en `ordenes_reposicion` (de `PENDIENTE` a `APROBADA` o `RECHAZADA`) debe registrar de forma inmutable:
  - El `usuario_id` del gerente que tomó la decisión.
  - La marca temporal UTC exacta (`resuelto_en`).
  - La cantidad aprobada final (que puede diferir de la sugerida por el algoritmo).
- Se mantiene una tabla de auditoría para registrar accesos fallidos de autenticación y exportaciones masivas de datos.

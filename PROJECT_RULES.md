# Reglas Maestras e Invariantes del Proyecto (PROJECT RULES)
## SportStockAI — Plataforma SaaS B2B de Optimización de Inventario y Analítica Predictiva

> **Vigencia**: Noviembre 2026 — Versión 1.0  
> **Ámbito de Aplicación**: Todo el código fuente, migraciones de base de datos, APIs, modelos predictivos e interfaces del repositorio.  
> **Audiencia**: Equipo de Ingeniería de Software (Irían López, Matías Muñoz, Gonzalo Rivera, Jorge Hormazábal, Joyce Honores).

---

## 1. Declaración de Invariantes (Reglas de Oro Inquebrantables)

Cualquier cambio de código, PR o propuesta de arquitectura que viole una de estas 7 reglas será **rechazado automáticamente en revisión**.

### REGLA 1: Aislamiento Multi-Inquilino Estricto (*Tenant Isolation*)
* **Invariante**: Ningún usuario de una cadena deportiva cliente (ej. *Sparta*) puede bajo ninguna circunstancia leer, alterar, inferir o eliminar datos de otra cadena (ej. *Marathon Sports*).
* **Implementación obligatoria**:
  1. Todas las tablas de dominio deben incluir la columna `cadena_id UUID NOT NULL REFERENCES cadenas(id)`.
  2. El 100% de las tablas en PostgreSQL deben tener `ROW LEVEL SECURITY (RLS)` habilitado.
  3. Ninguna consulta SQL desde el backend puede ejecutarse en modo `service_role` sin inyectar explícitamente el contexto de sesión (`SET LOCAL app.current_cadena_id = ...`) o usar el cliente autenticado del usuario.

### REGLA 2: Desacoplamiento del Cómputo Predictivo (Cero Bloqueos al Event Loop)
* **Invariante**: El hilo principal de ejecución de la API REST (Node.js) **nunca** debe ejecutar algoritmos matemáticos intensivos, iteraciones de suavizamiento exponencial sobre catálogos completos ni transformaciones de datos pesadas.
* **Implementación obligatoria**:
  1. Toda solicitud de cálculo predictivo o ingesta de lotes superiores a 100 registros debe responder inmediatamente `202 Accepted` con un `job_id`.
  2. El procesamiento se delega exclusivamente a la cola de tareas asíncrona (**Redis + BullMQ**) y es consumido por el worker predictivo (Python / proceso worker aislado).

### REGLA 3: Umbral de Rendimiento Predictivo (RNF-02)
* **Invariante**: El tiempo de procesamiento y emisión de pronósticos para un lote de **500 SKUs** no debe superar los **3,0 segundos**.
* **Implementación obligatoria**:
  1. Los datos históricos para el motor predictivo deben consultarse de forma agregada por rangos temporales (usando índices BRIN en `ventas_historicas.fecha`).
  2. Prohibido ejecutar consultas N+1 en bucles para obtener ventas por SKU; usar agregaciones SQL en bloque (`GROUP BY sku_id, semana`).

### REGLA 4: Resiliencia en Ingesta Dual y Validación de Entrada
* **Invariante**: El sistema debe aceptar datos tanto vía API REST (JSON) como mediante planillas masivas (CSV/Excel), pero **ningún registro entra a la base de datos sin validación de esquema**.
* **Implementación obligatoria**:
  1. Toda entrada de datos externos debe validarse estrictamente contra esquemas **Zod** (en Node.js) o **Pydantic** (en Python).
  2. Si un archivo CSV contiene filas erróneas, el proceso no debe abortar en silencio: debe procesar las filas válidas y generar un reporte detallado con las filas rechazadas y el motivo específico del error.

### REGLA 5: Privacidad y Cumplimiento de la Ley N° 21.719 (Chile)
* **Invariante**: SportStockAI es una solución de optimización de inventario B2B; **no es un CRM de consumidores finales**.
* **Implementación obligatoria**:
  1. Queda estrictamente prohibido persistir datos personales de compradores finales (nombres, RUT, tarjetas de crédito, teléfonos, correos).
  2. La tabla `ventas_historicas` solo registra: `sucursal_id`, `sku_id`, `fecha`, `unidades_vendidas` y `monto_total`.
  3. Toda comunicación entre clientes (Web/Móvil) y servidores debe utilizar TLS 1.3 obligatorio con certificados HSTS.

### REGLA 6: Precisión Numérica y Manejo de Divisas
* **Invariante**: Prohibido usar tipos de datos de punto flotante binario (`float`, `double`, `real`) para precios, costos o márgenes.
* **Implementación obligatoria**:
  1. En base de datos PostgreSQL: usar `NUMERIC(12, 2)` o almacenar montos monetarios en centavos/enteros (`INTEGER` / `BIGINT`).
  2. Las tarifas SaaS se gestionan en USD (Tier 1: 150 USD/sucursal/mes; Tier 2: 1.200 USD/mes), mientras que los costos operativos locales se calculan en CLP. La conversión oficial debe quedar registrada con el tipo de cambio observado de la fecha de facturación.

### REGLA 7: Versionado e Inmutabilidad de Contratos API
* **Invariante**: Ningún cambio en el backend puede romper el funcionamiento de las aplicaciones móviles en tienda ya desplegadas.
* **Implementación obligatoria**:
  1. Todos los endpoints REST deben comenzar obligatoriamente con el prefijo `/api/v1/`.
  2. Si se requiere una modificación que rompa la firma de entrada o salida, debe crearse una nueva ruta `/api/v2/`, manteniendo retrocompatibilidad durante al menos un ciclo semestral.

### REGLA 8: Mensajes de Commit y Trazabilidad en Español Estricto
* **Invariante**: Todo mensaje de commit en Git debe redactarse **exclusivamente en español**, empleando la sintaxis estándar de *Conventional Commits* (`tipo(alcance): descripción`).
* **Implementación obligatoria**:
  1. Queda estrictamente prohibido el uso de descripciones en inglés o spanglish en los commits del repositorio.
  2. El contenido de los commits debe mantener un tono técnico, formal y libre de emojis o modismos.

---

## 2. Reglas de Negocio Específicas de Retail Deportivo

1. **Horizonte de Proyección**: El motor predictivo calcula demanda estacional obligatoriamente en un rango de **2 a 8 semanas** calendario.
2. **Disciplinas Deportivas Soportadas**: Todo SKU debe pertenecer a una disciplina válida (`FUTBOL`, `RUNNING`, `FITNESS`, `TRAIL`, `OUTDOOR`, `OTRO`) para alimentar los índices de estacionalidad correspondientes.
3. **Fórmula de Reposición Sugerida**:
   $$\text{Cantidad Sugerida} = \max\left(0, \text{Demanda Proyectada (Lead Time)} + \text{Stock de Seguridad} - \text{Stock Actual} - \text{Stock en Tránsito}\right)$$
   *Donde el Stock de Seguridad se calcula en base a la variabilidad de la demanda histórica y el lead time de reposición de la sucursal.*
4. **Ciclo de Vida de Órdenes**:
   $$\text{PENDIENTE} \xrightarrow{\text{Aprobación Gerencial}} \text{APROBADA} \quad \text{ó} \quad \text{RECHAZADA}$$
   *Toda orden aprobada o rechazada debe almacenar auditoría obligatoria (`aprobado_por`, `fecha_resolucion`, `cantidad_aprobada`).*

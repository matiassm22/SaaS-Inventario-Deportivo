# Guía de Despliegue en la Nube y Operación en Producción
## SportStockAI — Plataforma SaaS B2B de Optimización de Inventario

Esta guía describe el procedimiento paso a paso para desplegar la plataforma completa en infraestructura cloud de producción utilizando servicios de alta disponibilidad y bajo costo operativo.

---

## 1. Configuración de Base de Datos (Supabase Cloud)

### Paso 1: Crear el Proyecto
1. Iniciar sesión en [Supabase.com](https://supabase.com) y crear una nueva organización o proyecto:
   - **Nombre del Proyecto**: `sportstock-production`
   - **Región**: `South America (São Paulo)` (para menor latencia hacia Chile)
   - **Contraseña de Base de Datos**: Generar y almacenar de forma segura.

### Paso 2: Ejecutar las Migraciones en el SQL Editor
En la barra lateral de Supabase, acceder al **SQL Editor** y ejecutar secuencialmente los tres archivos de migración ubicados en `supabase/migrations/`:

1. **Migración 1 — Esquema Relacional 3FN**:
   - Abrir y copiar el contenido de `supabase/migrations/20261122000001_create_schema.sql`.
   - Ejecutar en el SQL Editor. Crea las tablas `cadenas`, `sucursales`, `categorias`, `disciplinas`, `skus`, `inventario_actual`, `ventas_historicas`, `ordenes_reposicion`, `auditoria_ingesta` e índices BRIN.
2. **Migración 2 — Seguridad y Row-Level Security (RLS)**:
   - Copiar el contenido de `supabase/migrations/20261122000002_rls_and_security.sql`.
   - Ejecutar. Habilita RLS en el 100% de las tablas y crea las políticas de aislamiento estricto por `cadena_id`.
3. **Migración 3 — Dataset Semilla Oficial**:
   - Copiar el contenido de `supabase/migrations/20261122000003_seed_data.sql`.
   - Ejecutar. Carga las cadenas piloto (*Marathon Sports Chile* y *Sparta*), sucursales de Santiago (*Costanera Center*, *Parque Arauco*, *Plaza Vespucio*) y el catálogo base de calzado y vestuario.

### Paso 3: Obtener Credenciales de Conexión
En Supabase, acceder a **Project Settings > API**:
- **Project URL**: `https://<tu-id-de-proyecto>.supabase.co`
- **service_role Key** (Secret): Clave de backend para operaciones administrativas con contexto de sesión.
- **anon Key** (Public): Clave pública para clientes.

---

## 2. Despliegue del Backend API REST (Node.js)

### Opción A: Despliegue en Render (Recomendada con `render.yaml`)
1. Iniciar sesión en [Render.com](https://render.com) y conectar la cuenta de GitHub.
2. Hacer clic en **New > Blueprint** y seleccionar el repositorio `SaaS-Inventario-Deportivo`.
3. Render detectará automáticamente el archivo `render.yaml` ubicado en la raíz.
4. En las variables de entorno del servicio `sportstock-backend`, configurar:
   - `SUPABASE_URL`: La URL del proyecto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: La clave service_role obtenida en el paso anterior.
   - `DEFAULT_CADENA_ID`: `11111111-1111-1111-1111-111111111111`
5. Hacer clic en **Apply**. El backend se compilará y desplegará automáticamente.
6. Verificar el estado del servicio ingresando a:
   `https://sportstock-backend.onrender.com/health`
   *(Debe retornar `status: "ONLINE"` y `service: "SportStockAI API Backend"`).*

### Opción B: Despliegue con Docker en Cualquier Servidor (VPS / AWS / GCP)
En un servidor Linux con Docker y Docker Compose instalado:
```bash
git clone https://github.com/matiassm22/SaaS-Inventario-Deportivo.git
cd "SaaS-Inventario-Deportivo"
docker compose up -d
```
El contenedor compilará el backend multi-stage y levantará la API en el puerto `3000`.

---

## 3. Despliegue del Dashboard Web (React 19 + Vite)

### Opción A: Despliegue en Vercel
1. Iniciar sesión en [Vercel.com](https://vercel.com) y hacer clic en **Add New > Project**.
2. Importar el repositorio `SaaS-Inventario-Deportivo`.
3. Configuración del proyecto:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. En **Environment Variables**, agregar:
   - `VITE_API_URL`: URL pública del backend desplegado (ejemplo: `https://sportstock-backend.onrender.com/api/v1`).
5. Hacer clic en **Deploy**. Gracias a `frontend/vercel.json`, todas las rutas de SPA funcionarán sin errores 404 al recargar.

### Opción B: Despliegue en Netlify
1. En [Netlify.com](https://netlify.com), hacer clic en **Add new site > Import an existing project**.
2. Conectar GitHub y seleccionar el repositorio.
3. Configuración:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Agregar la variable de entorno `VITE_API_URL`.
5. El archivo `frontend/netlify.toml` gestionará automáticamente las redirecciones.

---

## 4. Compilación y Empaquetado de la App Móvil (Flutter)

Para generar el paquete instalable para los teléfonos Android de los operarios de tienda:

### Paso 1: Configurar la URL de la API de Producción
En [mobile/lib/features/inventory/data/inventory_api_service.dart](file:///c:/Users/mmuno/Downloads/SaaS%20inventario%20deportivo/mobile/lib/features/inventory/data/inventory_api_service.dart), actualizar la URL base o suministrarla al constructor:
```dart
InventoryApiService({this.baseUrl = 'https://sportstock-backend.onrender.com/api/v1'});
```

### Paso 2: Compilar el APK de Lanzamiento
En una máquina con el SDK de Flutter instalado, ejecutar en el directorio `mobile/`:
```bash
cd mobile
flutter pub get
flutter build apk --release
```
El archivo compilado quedará listo para su distribución e instalación directa en dispositivos de bodega o pistolas láser Android en:
`mobile/build/app/outputs/flutter-apk/app-release.apk`

---

## 5. Protocolo de Pruebas Post-Despliegue (Smoke Test)

Una vez desplegados los servicios, ejecutar las siguientes validaciones de extremo a extremo:

1. **Comprobar Health Check**:
   ```bash
   curl -i https://<tu-backend-url>/health
   # Retorno esperado: HTTP 200 OK con JSON de estado.
   ```
2. **Iniciar Sesión en el Dashboard Web**:
   - Abrir la URL del frontend en el navegador.
   - En el menú superior o lateral, hacer clic en "Iniciar sesión".
   - Seleccionar el perfil "Gerente de Operaciones (Marathon Sports)" con contraseña `Password123!`.
   - Comprobar que los KPIs y sugerencias urgentes se cargan desde el servidor.
3. **Probar Ingesta Masiva con el Archivo de Ejemplo**:
   - En la sección "Integraciones", arrastrar el archivo `dataset_ingesta_ejemplo.csv`.
   - Verificar que el backend responda `202 Accepted` y que el lote quede registrado en la tabla de auditoría inferior.
4. **Validación en Móvil**:
   - Abrir la app en el teléfono, hacer clic en el botón flotante "Escanear" y enfocar el código de barras de cualquier producto del catálogo para confirmar el descuento y la actualización en rack.

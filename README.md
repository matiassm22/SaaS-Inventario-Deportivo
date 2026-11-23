# SportStockAI — Plataforma SaaS B2B de Optimización de Inventario

[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue)](./ARCHITECTURE.md)
[![Compliance](https://img.shields.io/badge/Compliance-Ley%2021.719%20Chile-green)](./SECURITY_AND_COMPLIANCE.md)
[![Rules](https://img.shields.io/badge/Rules-Project%20Invariants-orange)](./PROJECT_RULES.md)

SportStockAI es una solución SaaS B2B especializada en analítica predictiva de demanda y reposición automatizada para cadenas de retail deportivo en Chile y América Latina. Su motor algorítmico anticipa la demanda estacional con un horizonte de 2 a 8 semanas, mitigando quiebres de stock en temporadas punta y calculando puntos de reorden óptimos por sucursal.

---

## Índice de Documentación Técnica

Todo desarrollador del proyecto debe consultar y apegarse a los siguientes documentos rectores:

1. **[PROJECT_RULES.md](./PROJECT_RULES.md)**: Reglas de oro e invariantes del proyecto. Define las 7 restricciones fundamentales de desarrollo (aislamiento multi-inquilino obligatorio, cero bloqueos al Event Loop, latencia inferior a 3,0 s para 500 SKUs, cumplimiento de la Ley N° 21.719 y precisión monetaria).
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Especificación arquitectónica y contratos de interfaz. Incluye diagramas de componentes, desglose del frontend, backend, persistencia relacional 3FN con Row-Level Security (RLS) en PostgreSQL y contratos REST.
3. **[CODING_STANDARDS.md](./CODING_STANDARDS.md)**: Convenciones de código y calidad para TypeScript (modo estricto, esquemas Zod), Dart/Flutter (Clean Architecture), Python (Pydantic v2, type hints) y formato RFC 7807 para gestión de errores.
4. **[SECURITY_AND_COMPLIANCE.md](./SECURITY_AND_COMPLIANCE.md)**: Políticas de seguridad, privacidad y normativa chilena (Ley N° 21.719). Matriz de control de acceso RBAC, aislamiento de datos, gestión de secretos y auditoría.
5. **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Metodología de trabajo, asignación de roles técnicos, flujo de ramas en Git, convención de commits semánticos y Definition of Done (DoD).
6. **[documentacion/](./documentacion/)**: Informes formales y presentaciones de evaluación económica (FEP) e ingeniería de software (TIS).

---

## Stack Tecnológico Oficial

| Componente | Tecnología | Rol Operativo |
| :--- | :--- | :--- |
| **Panel Web Ejecutivo** | React 19, Vite, TypeScript, Tailwind CSS | Dashboards gerenciales, KPIs y aprobación de órdenes |
| **App Móvil de Tienda** | Flutter (Dart), Android & iOS | Semáforo de stock en tiempo real y lectura de códigos |
| **API Gateway & Negocio**| Node.js LTS, Express con TypeScript | API RESTful `/api/v1/`, RBAC y gestión de estados |
| **Motor Predictivo** | Algoritmo de suavizamiento estacional | Proyección a 2–8 semanas y cálculo de reorden |
| **Persistencia & Auth** | Supabase Cloud (PostgreSQL 15+) | Almacenamiento 3FN, Row-Level Security y WebSockets |
| **Infraestructura Local** | Docker Compose | Contenedores para PostgreSQL y Redis en desarrollo |

---

## Guía de Puesta en Marcha

### Prerrequisitos
- Node.js v20 LTS o superior.
- Git.
- Docker Desktop (opcional, para base de datos local).

---

### Configuración de la Base de Datos

#### Opción A: Supabase Cloud (Recomendada)
1. Crear un proyecto en [Supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecutar en orden las siguientes migraciones:
   - `supabase/migrations/20261122000001_create_schema.sql` (Esquema 3FN).
   - `supabase/migrations/20261122000002_rls_and_security.sql` (Seguridad y RLS).
   - `supabase/migrations/20261122000003_seed_data.sql` (Dataset inicial de retail deportivo chileno).
3. En `backend/.env`, configurar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

#### Opción B: Contenedor Local (Docker Compose)
Si se dispone de Docker Desktop, ejecutar en la raíz:
```bash
docker compose up -d
```
*(Las migraciones SQL y el seed se ejecutan automáticamente en el primer arranque del contenedor PostgreSQL).*

---

### Ejecución de los Servicios

#### 1. Backend API REST (Node.js + TypeScript)
```bash
cd backend
npm install
npm run dev
```
- Servicio activo en: `http://localhost:3000/api/v1`
- Verificación de estado: `http://localhost:3000/health`
- *Nota: Si no se configuran credenciales de Supabase en el archivo `.env`, el backend arranca automáticamente con un almacenamiento reactivo precargado con el seed oficial para pruebas inmediatas.*

#### 2. Dashboard Web (React 19 + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Interfaz disponible en: `http://localhost:5173`

#### 3. Aplicación Móvil de Tienda (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

---

## Verificación de Ingesta y Contratos API

Se incluye el archivo de prueba `dataset_ingesta_ejemplo.csv` con datos válidos de calzado y vestuario para comprobar la validación y el cálculo predictivo:

```bash
curl -X POST http://localhost:3000/api/v1/ingesta/lote \
  -F "archivo=@dataset_ingesta_ejemplo.csv"
```

---

## Equipo de Desarrollo

- **Irían López**: Líder de Proyecto / Arquitectura de Software
- **Matías Muñoz**: Backend API & Motor Predictivo
- **Gonzalo Rivera / Renato Núñez**: Persistencia de Datos & Supabase RLS
- **Jorge Hormazábal**: Frontend Web & Aplicación Móvil Flutter
- **Joyce Honores**: Aseguramiento de Calidad (QA) & UX en Tienda

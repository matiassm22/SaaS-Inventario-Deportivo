# Guía de Contribución y Flujo de Trabajo (CONTRIBUTING)
## SportStockAI — Plataforma SaaS B2B

---

## 1. Asignación de Roles y Responsabilidades del Equipo

El equipo opera bajo una metodología ágil adaptada a la estructura de desarrollo documentada:

- **Irían López**: Líder de Proyecto / Arquitectura de Software / Coordinación de Entregas.
- **Matías Muñoz**: Backend API (Node.js/TypeScript) / Algoritmos y Motor Predictivo.
- **Gonzalo Rivera / Renato Núñez**: Modelado de Datos / Supabase PostgreSQL / RLS y Optimización de Consultas.
- **Jorge Hormazábal**: Frontend Web Gerencial (React) / Aplicación Móvil en Flutter.
- **Joyce Honores**: QA / Pruebas de Integración y Criterios de Aceptación / UX en Tienda.

---

## 2. Flujo de Trabajo en Git (GitFlow Simplificado)

```
main (Producción estable y protegida)
  ▲
  │ (Release aprobada con tag)
develop (Rama de integración continua)
  ▲
  ├── feat/ingesta-csv-parser        (Matías)
  ├── feat/dashboard-kpis            (Jorge)
  ├── feat/rls-sucursales            (Renato/Gonzalo)
  └── fix/tiempo-respuesta-500-skus  (Matías/Irían)
```

### Reglas de Ramas:
1. **`main`**: Código productivo. Solo recibe merge desde `develop` mediante Pull Request validado y etiquetado con SemVer (`v1.0.0`).
2. **`develop`**: Rama base para el trabajo diario. Siempre debe compilar y tener las pruebas unitarias pasando.
3. **`feat/<nombre-funcionalidad>`**: Nuevas características o pantallas.
4. **`fix/<descripcion-error>`**: Corrección de bugs detectados en pruebas o desarrollo.
5. **`chore/<tarea-tecnica>`**: Tareas de configuración, linters o dependencias.

---

## 3. Convención de Commits (Conventional Commits en Español)

Todos los mensajes de commit deben redactarse **estrictamente en español**, respetando la convención de Conventional Commits:

```
<tipo>(<alcance opcional>): <descripción imperativa en español>
```

### Tipos Permitidos:
- `feat`: Nueva funcionalidad (ej. `feat(ingesta): agregar soporte para detección automática de delimitador csv`).
- `fix`: Corrección de un defecto (ej. `fix(stock): prevenir actualizaciones de stock negativo en endpoint de tienda`).
- `docs`: Documentación (ej. `docs(api): actualizar contratos de endpoints de reabastecimiento`).
- `style`: Ajustes visuales o formato sin cambio en lógica de negocio.
- `refactor`: Reorganización o limpieza de código sin alterar comportamiento externo.
- `test`: Incorporación o corrección de suites de prueba.
- `perf`: Mejoras de rendimiento (ej. `perf(db): agregar indice BRIN en tabla de historial de ventas`).
- `chore`: Tareas de configuración, compilación, paquetes o herramientas de desarrollo.

---

## 4. Proceso de Pull Requests y Code Review

Antes de solicitar la revisión de un PR:
1. Asegurarse de que el código no introduce warnings en linters (`npm run lint`, `flutter analyze`).
2. Verificar que las migraciones de base de datos corren limpiamente hacia adelante y hacia atrás.
3. Probar que no se vulneran las reglas de `PROJECT_RULES.md` (especialmente RLS y desacoplamiento asíncrono).

### Plantilla de Pull Request:
```markdown
### ¿Qué cambio introduce este PR?
- [ ] Nueva funcionalidad (`feat`)
- [ ] Corrección de bug (`fix`)
- [ ] Mejora de rendimiento (`perf`)
- [ ] Cambio en base de datos / Migración SQL

### Descripción del Cambio:
(Explicación concisa del problema resuelto y la solución técnica adoptada).

### Verificación y Pruebas Realizadas:
- [ ] Pruebas unitarias ejecutadas exitosamente.
- [ ] Validado con dataset sintético de prueba.
- [ ] Verificado aislamiento multi-inquilino (RLS activo).
- [ ] Tiempo de respuesta verificado (< 3s en cálculos pesados).
```

---

## 5. Definición de Terminado (Definition of Done - DoD)

Una tarea, historia o requerimiento funcional se considera **terminado** únicamente cuando:
1. El código cumple con las guías de estilo de `CODING_STANDARDS.md`.
2. Cuenta con al menos una prueba de aceptación automatizada o evidencia verificable (ej. prueba en Postman o test Gherkin).
3. Las políticas RLS han sido testeadas contra dos usuarios de distintas cadenas deportivas.
4. El PR cuenta con la aprobación de al menos un revisor técnico del equipo.
5. El código está integrado en la rama `develop` sin conflictos.

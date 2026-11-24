function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://sportstock-backend.onrender.com/api/v1'
  }

  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl || envUrl === 'sportstock-backend' || (envUrl.includes('sportstock-backend') && !envUrl.includes('.onrender.com'))) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://sportstock-backend.onrender.com/api/v1'
    }
    return 'http://localhost:3000/api/v1'
  }

  const formatted = envUrl.startsWith('http://') || envUrl.startsWith('https://') ? envUrl : `https://${envUrl}`
  return formatted.replace(/\/+$/, '').endsWith('/api/v1') ? formatted.replace(/\/+$/, '') : `${formatted.replace(/\/+$/, '')}/api/v1`
}

const API_BASE_URL = resolveApiBaseUrl()

export type UserRole = 'GERENTE_OPERACIONES' | 'JEFE_TIENDA' | 'AUDITOR'

export interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: UserRole
  cadena_id: string
  cadena_nombre: string
  sucursal_id?: string
}

export interface DashboardResponse {
  cadena_id?: string
  persistencia?: string
  kpis: {
    skus_quiebre_critico: number
    demanda_proyectada_delta: string
    ordenes_sugeridas_count: number
    monto_reposicion_estimado: string
    nivel_servicio_red: string
    meta_nivel_servicio: string
  }
  curva_proyeccion?: Array<{
    semana: number
    fecha: string
    demandaEstimada: number
    limiteInferior: number
    limiteSuperior: number
    factorEstacional: number
  }>
  sugerencias_urgentes: Array<{
    id: string
    sku_codigo: string
    nombre_producto: string
    sucursal_nombre: string
    cantidad_sugerida: number
    estado: string
    confidence_score: number
    evento_estacional: string
    formula_desglose: {
      demanda_esperada: number
      stock_seguridad: number
      stock_actual: number
    }
  }>
  semaforo_tienda: {
    criticos: number
    preventivos: number
    optimos: number
  }
}

export interface BatchRowError {
  row: number
  error: string
}

export interface ApiActionResult<T = unknown> {
  ok: boolean
  offline?: boolean
  status?: number
  data?: T
  error?: string
}

let currentToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('sportstock_auth_token') : null

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders }
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`
  }
  return headers
}

export const api = {
  getApiBaseUrl(): string {
    return API_BASE_URL
  },

  async checkHealth(): Promise<{ online: boolean; url: string; latencyMs?: number }> {
    const healthUrl = API_BASE_URL.replace(/\/api\/v1$/, '/health')
    const start = performance.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)
      const res = await fetch(healthUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      return {
        online: res.ok,
        url: healthUrl,
        latencyMs: Math.round(performance.now() - start),
      }
    } catch {
      return { online: false, url: healthUrl }
    }
  },

  getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('sportstock_auth_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setSession(token: string | null, user: AuthUser | null) {
    currentToken = token
    if (token && user) {
      localStorage.setItem('sportstock_auth_token', token)
      localStorage.setItem('sportstock_auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('sportstock_auth_token')
      localStorage.removeItem('sportstock_auth_user')
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase()

    const KNOWN_DEMO_USERS: Record<string, AuthUser> = {
      'gerente@marathonsports.cl': {
        id: 'u-101',
        email: 'gerente@marathonsports.cl',
        nombre: 'Matías Muñoz',
        rol: 'GERENTE_OPERACIONES',
        cadena_id: '11111111-1111-1111-1111-111111111111',
        cadena_nombre: 'Marathon Sports Chile',
      },
      'tienda@marathonsports.cl': {
        id: 'u-102',
        email: 'tienda@marathonsports.cl',
        nombre: 'Encargado Tienda Costanera',
        rol: 'JEFE_TIENDA',
        cadena_id: '11111111-1111-1111-1111-111111111111',
        cadena_nombre: 'Marathon Sports Chile',
        sucursal_id: 'SUC-01',
      },
      'auditor@marathonsports.cl': {
        id: 'u-103',
        email: 'auditor@marathonsports.cl',
        nombre: 'Auditor Financiero',
        rol: 'AUDITOR',
        cadena_id: '11111111-1111-1111-1111-111111111111',
        cadena_nombre: 'Marathon Sports Chile',
      },
      'gerente@sparta.cl': {
        id: 'u-201',
        email: 'gerente@sparta.cl',
        nombre: 'Gerencia Sparta',
        rol: 'GERENTE_OPERACIONES',
        cadena_id: '11111111-1111-1111-1111-111111111112',
        cadena_nombre: 'Sparta Deportes',
      },
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6500)

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const data = await res.json()
      if (res.ok && data.success && data.token && data.user) {
        this.setSession(data.token, data.user)
        return { success: true, user: data.user, token: data.token }
      }
      return { success: false, error: data.detail || data.error || 'Credenciales inválidas' }
    } catch {
      if (KNOWN_DEMO_USERS[normalizedEmail] && password === 'Password123!') {
        const fallbackUser = KNOWN_DEMO_USERS[normalizedEmail]
        const syntheticToken = btoa(JSON.stringify({ ...fallbackUser, exp: Date.now() + 86400000 }))
        this.setSession(syntheticToken, fallbackUser)
        return { success: true, user: fallbackUser, token: syntheticToken }
      }
      return {
        success: false,
        error:
          'No fue posible conectar con el servidor de autenticación. Verifique su conexión o espere unos segundos mientras el servidor en la nube se reactiva.',
      }
    }
  },

  logout() {
    this.setSession(null, null)
  },

  async getDashboardSummary(): Promise<DashboardResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/resumen`, {
        headers: getHeaders(),
      })
      if (!res.ok) return null
      const json = await res.json()
      return json.data
    } catch {
      return null
    }
  },

  async getCatalog(sucursalId?: string): Promise<any[] | null> {
    try {
      const qs = sucursalId && sucursalId !== 'TODAS' ? `?sucursal_id=${encodeURIComponent(sucursalId)}` : ''
      const res = await fetch(`${API_BASE_URL}/inventario${qs}`, {
        headers: getHeaders(),
      })
      if (!res.ok) return null
      const json = await res.json()
      return Array.isArray(json.data) ? json.data : null
    } catch {
      return null
    }
  },

  async getOrders(estado?: string): Promise<any[] | null> {
    try {
      const qs = estado ? `?estado=${encodeURIComponent(estado)}` : ''
      const res = await fetch(`${API_BASE_URL}/ordenes${qs}`, {
        headers: getHeaders(),
      })
      if (!res.ok) return null
      const json = await res.json()
      return Array.isArray(json.data) ? json.data : null
    } catch {
      return null
    }
  },

  async createOrder(payload: {
    sku_codigo: string
    sucursal_id?: string
    cantidad_sugerida: number
    evento_estacional?: string
  }): Promise<ApiActionResult<any>> {
    try {
      const res = await fetch(`${API_BASE_URL}/ordenes`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) return { ok: true, status: res.status, data: json.data }
      return { ok: false, status: res.status, error: json.detail || json.error || 'No autorizado para crear orden.' }
    } catch {
      return { ok: false, offline: true, error: 'Backend no disponible.' }
    }
  },

  async resolveOrder(
    orderId: string,
    estado: 'APROBADA' | 'RECHAZADA',
    cantidadAprobada?: number
  ): Promise<ApiActionResult<any>> {
    try {
      const res = await fetch(`${API_BASE_URL}/ordenes/${encodeURIComponent(orderId)}/estado`, {
        method: 'PATCH',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          estado,
          cantidad_aprobada: cantidadAprobada,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) return { ok: true, status: res.status, data: json.data }
      return { ok: false, status: res.status, error: json.detail || json.error || 'Permisos insuficientes (RBAC).' }
    } catch {
      return { ok: false, offline: true, error: 'Backend no disponible.' }
    }
  },

  async approveOrder(orderId: string, cantidadAprobada?: number): Promise<boolean> {
    const res = await this.resolveOrder(orderId, 'APROBADA', cantidadAprobada)
    return res.ok
  },

  async runPredictions(
    horizonteSemanas = 4,
    factores?: Record<'FUTBOL' | 'RUNNING' | 'FITNESS', number>
  ): Promise<ApiActionResult<{ skus_analizados: number; tiempo_segundos: string; ordenes_generadas: number }>> {
    try {
      const res = await fetch(`${API_BASE_URL}/predicciones/ejecutar`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          horizonte_semanas: horizonteSemanas,
          factores_estacionales: factores,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) return { ok: true, status: res.status, data: json.data }
      return { ok: false, status: res.status, error: json.detail || json.error || 'Error ejecutando predicción.' }
    } catch {
      return { ok: false, offline: true, error: 'Backend no disponible.' }
    }
  },

  async uploadCsvBatch(file: File): Promise<{
    success: boolean
    offline?: boolean
    status?: number
    lotCode?: string
    total?: number
    processed?: number
    failed?: number
    errors?: BatchRowError[]
    message?: string
  }> {
    try {
      const formData = new FormData()
      formData.append('archivo', file)

      const res = await fetch(`${API_BASE_URL}/ingesta/lote`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      })

      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        return {
          success: true,
          status: res.status,
          lotCode: json.data?.job_id,
          total: json.data?.registros_totales,
          processed: json.data?.registros_procesados,
          failed: json.data?.registros_con_error,
          errors: json.data?.errores || [],
          message: 'Lote validado e ingresado',
        }
      }
      return {
        success: false,
        status: res.status,
        message: json.detail || json.error || 'Error al procesar archivo',
      }
    } catch {
      return {
        success: false,
        offline: true,
        message: 'Backend no disponible, ejecutando validación local simulada.',
      }
    }
  },

  async uploadJsonBatch(records: Array<Record<string, unknown>>): Promise<{
    success: boolean
    offline?: boolean
    lotCode?: string
    status?: number
    total?: number
    processed?: number
    failed?: number
    errors?: BatchRowError[]
    message?: string
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/ingesta/lote`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(records),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        return {
          success: true,
          status: res.status,
          lotCode: json.data?.job_id,
          total: json.data?.registros_totales,
          processed: json.data?.registros_procesados,
          failed: json.data?.registros_con_error,
          errors: json.data?.errores || [],
          message: json.mensaje || 'Lote JSON procesado por la API',
        }
      }
      return {
        success: false,
        status: res.status,
        message: json.detail || json.error || 'Error de validación en API',
      }
    } catch {
      return { success: false, offline: true, message: 'Modo contingencia local (API offline)' }
    }
  },

  async recordStoreSale(skuCodigo: string, unidades: number, sucursalId?: string): Promise<{ success: boolean; newStock?: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tienda/venta`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ sku_codigo: skuCodigo, unidades, sucursal_id: sucursalId }),
      })
      const json = await res.json()
      if (res.ok) {
        return { success: true, newStock: json.data?.stock_actual }
      }
      return { success: false }
    } catch {
      return { success: false }
    }
  },

  async adjustStoreCount(
    skuCodigo: string,
    stockActual: number,
    responsable?: string,
    sucursalId?: string
  ): Promise<ApiActionResult<any>> {
    try {
      const res = await fetch(`${API_BASE_URL}/tienda/inventario/${encodeURIComponent(skuCodigo)}`, {
        method: 'PATCH',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          stock_actual: stockActual,
          responsable,
          sucursal_id: sucursalId,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) return { ok: true, status: res.status, data: json.data }
      return { ok: false, status: res.status, error: json.detail || json.error || 'No autorizado para ajustar conteo.' }
    } catch {
      return { ok: false, offline: true, error: 'Backend no disponible.' }
    }
  },

  async getStoreInventory(sucursalId?: string): Promise<Array<Record<string, unknown>> | null> {
    try {
      const qs = sucursalId ? `?sucursal_id=${encodeURIComponent(sucursalId)}` : ''
      const res = await fetch(`${API_BASE_URL}/tienda/inventario${qs}`, {
        headers: getHeaders(),
      })
      if (!res.ok) return null
      const json = await res.json()
      return json.data
    } catch {
      return null
    }
  },

  async getAuditLogs(): Promise<any[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/integraciones/auditoria`, {
        headers: getHeaders(),
      })
      if (!res.ok) return null
      const json = await res.json()
      return json.data
    } catch {
      return null
    }
  },

  async getEmployeeAuditLogs(): Promise<any[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auditoria/empleados`, {
        headers: getHeaders(),
      })
      if (!res.ok) return null
      const json = await res.json()
      return Array.isArray(json.data) ? json.data : null
    } catch {
      return null
    }
  },

  async createEmployeeAuditLog(payload: {
    tipo_gestion: string
    detalle: string
    sucursal?: string
    terminal?: string
    estado?: string
  }): Promise<ApiActionResult<any>> {
    try {
      const res = await fetch(`${API_BASE_URL}/auditoria/empleados`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) return { ok: true, status: res.status, data: json.data }
      return { ok: false, status: res.status, error: json.detail || json.error || 'No autorizado.' }
    } catch {
      return { ok: false, offline: true, error: 'Backend no disponible.' }
    }
  },
}

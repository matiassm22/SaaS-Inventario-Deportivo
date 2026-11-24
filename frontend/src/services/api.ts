const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const formattedBaseUrl = rawBaseUrl.startsWith('http://') || rawBaseUrl.startsWith('https://')
  ? rawBaseUrl
  : `https://${rawBaseUrl}`;
const API_BASE_URL = formattedBaseUrl.replace(/\/+$/, '').endsWith('/api/v1')
  ? formattedBaseUrl.replace(/\/+$/, '')
  : `${formattedBaseUrl.replace(/\/+$/, '')}/api/v1`;

export type UserRole = 'GERENTE_OPERACIONES' | 'JEFE_TIENDA' | 'AUDITOR';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  cadena_id: string;
  cadena_nombre: string;
  sucursal_id?: string;
}

export interface DashboardResponse {
  kpis: {
    skus_quiebre_critico: number;
    demanda_proyectada_delta: string;
    ordenes_sugeridas_count: number;
    monto_reposicion_estimado: string;
    nivel_servicio_red: string;
    meta_nivel_servicio: string;
  };
  sugerencias_urgentes: Array<{
    id: string;
    sku_codigo: string;
    nombre_producto: string;
    sucursal_nombre: string;
    cantidad_sugerida: number;
    estado: string;
    confidence_score: number;
    evento_estacional: string;
    formula_desglose: {
      demanda_esperada: number;
      stock_seguridad: number;
      stock_actual: number;
    };
  }>;
  semaforo_tienda: {
    criticos: number;
    preventivos: number;
    optimos: number;
  };
}

let currentToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('sportstock_auth_token') : null;

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
}

export const api = {
  // Manejo de sesión y tokens
  getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('sportstock_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(token: string | null, user: AuthUser | null) {
    currentToken = token;
    if (token && user) {
      localStorage.setItem('sportstock_auth_token', token);
      localStorage.setItem('sportstock_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sportstock_auth_token');
      localStorage.removeItem('sportstock_auth_user');
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token && data.user) {
        this.setSession(data.token, data.user);
        return { success: true, user: data.user, token: data.token };
      }
      return { success: false, error: data.detail || data.error || 'Credenciales inválidas' };
    } catch {
      return { success: false, error: 'No fue posible conectar con el servidor de autenticación.' };
    }
  },

  logout() {
    this.setSession(null, null);
  },

  // 1. Obtener KPIs y sugerencias en vivo
  async getDashboardSummary(): Promise<DashboardResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/resumen`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('API offline');
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },

  // 2. Aprobar orden en la base de datos
  async approveOrder(orderId: string, cantidadAprobada?: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/ordenes/${orderId}/estado`, {
        method: 'PATCH',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          estado: 'APROBADA',
          cantidad_aprobada: cantidadAprobada,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 3. Subir archivo CSV de stock/ventas
  async uploadCsvBatch(file: File): Promise<{ success: boolean; lotCode?: string; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const res = await fetch(`${API_BASE_URL}/ingesta/lote`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        return { success: true, lotCode: json.data?.job_id, message: 'Lote validado e ingresado' };
      }
      return { success: false, message: json.error || 'Error al procesar archivo' };
    } catch {
      return { success: false, message: 'Backend no disponible, ejecutando validación local simulada.' };
    }
  },

  // 4. Registrar venta en tienda (descuenta stock)
  async recordStoreSale(skuCodigo: string, unidades: number): Promise<{ success: boolean; newStock?: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tienda/venta`, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ sku_codigo: skuCodigo, unidades }),
      });
      const json = await res.json();
      if (res.ok) {
        return { success: true, newStock: json.data?.stock_actual };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  // 5. Consultar auditoría de lotes
  async getAuditLogs(): Promise<any[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/integraciones/auditoria`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },
};

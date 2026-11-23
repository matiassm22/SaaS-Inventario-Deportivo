const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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

export const api = {
  // 1. Obtener KPIs y sugerencias en vivo
  async getDashboardSummary(): Promise<DashboardResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/resumen`);
      if (!res.ok) throw new Error('API offline');
      const json = await res.json();
      return json.data;
    } catch (e) {
      // Fallback a modo offline/demo
      return null;
    }
  },

  // 2. Aprobar orden en la base de datos
  async approveOrder(orderId: string, cantidadAprobada?: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/ordenes/${orderId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        return { success: true, lotCode: json.data?.job_id, message: 'Lote validado e ingresado' };
      }
      return { success: false, message: json.error || 'Error al procesar archivo' };
    } catch (e: any) {
      return { success: false, message: 'Backend no disponible, ejecutando validación local simulada.' };
    }
  },

  // 4. Registrar venta en tienda (descuenta stock)
  async recordStoreSale(skuCodigo: string, unidades: number): Promise<{ success: boolean; newStock?: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tienda/venta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE_URL}/integraciones/auditoria`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  },
};

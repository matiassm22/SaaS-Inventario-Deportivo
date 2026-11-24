import { Request, Response } from 'express';
import { db } from '../services/db.service.js';
import { ForecastingService } from '../services/forecasting.service.js';
import { ingestionService } from '../services/ingestion.service.js';
import { queueService } from '../services/queue.service.js';
import { OrderStatusUpdateSchema, StoreSaleSchema, LoginSchema } from '../types/index.js';
import { KNOWN_USERS, generateToken, AuthenticatedRequest } from '../middlewares/auth.middleware.js';

const forecasting = new ForecastingService();

export class ApiController {
  // 1. GET /api/v1/dashboard/resumen
  public static async getDashboardSummary(req: Request, res: Response) {
    try {
      const { sucursal_id, disciplina } = req.query as { sucursal_id?: string; disciplina?: string };
      
      const inventory = await db.getInventory(sucursal_id);
      const orders = await db.getOrders();

      const criticalSkus = inventory.filter((i) => i.estado_alerta === 'CRITICO').length;
      const warningSkus = inventory.filter((i) => i.estado_alerta === 'PREVENTIVO').length;
      const optimalSkus = inventory.filter((i) => i.estado_alerta === 'OPTIMO').length;
      const pendingOrders = orders.filter((o) => o.estado === 'PENDIENTE');

      // Calcular pronóstico para la serie temporal
      const sampleForecast = forecasting.calculateSKUForecast({
        skuCodigo: 'RUN-001',
        nombre: 'Nike Vaporfly 3',
        disciplina: 'RUNNING',
        sucursalId: sucursal_id || 'SUC-01',
        leadTimeDias: 3,
        stockActual: 3,
        ventasHistoricasSemanales: [15, 18, 22, 26, 28, 31],
        horizonteSemanas: 6,
      });

      return res.json({
        success: true,
        data: {
          kpis: {
            skus_quiebre_critico: criticalSkus,
            demanda_proyectada_delta: '+18,5%',
            ordenes_sugeridas_count: pendingOrders.length,
            monto_reposicion_estimado: '$18,4M',
            nivel_servicio_red: '91,4%',
            meta_nivel_servicio: '≥95%',
          },
          curva_proyeccion: sampleForecast.curvaSemanal,
          sugerencias_urgentes: pendingOrders,
          semaforo_tienda: {
            criticos: criticalSkus,
            preventivos: warningSkus,
            optimos: optimalSkus,
          },
          insight: {
            titulo: 'Insight de SportStock',
            mensaje: 'La demanda de Running subirá un 35% por la Maratón de Santiago. Anticipar 2 semanas reduce el costo de quiebre en $4,2M.',
          },
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. PATCH /api/v1/ordenes/:id/estado
  public static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validation = OrderStatusUpdateSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros inválidos',
          detalles: validation.error.flatten(),
        });
      }

      const { estado, cantidad_aprobada } = validation.data;
      const updatedOrder = await db.resolveOrder(id, estado, cantidad_aprobada);

      return res.json({
        success: true,
        data: updatedOrder,
        mensaje: `Orden ${id} actualizada con éxito a estado ${estado}.`,
      });
    } catch (err: any) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }

  // 3. POST /api/v1/ingesta/lote
  public static async ingestBatch(req: Request, res: Response) {
    try {
      let result;

      // Si se subió un archivo CSV
      if (req.file) {
        const fileContent = req.file.buffer.toString('utf-8');
        result = ingestionService.parseCSV(fileContent, req.file.originalname);
      } else if (Array.isArray(req.body)) {
        // Payload JSON directo de ERP
        result = ingestionService.parseJSONBatch(req.body, 'API REST ERP');
      } else if (req.body.csv_text) {
        // Texto CSV crudo en body
        result = ingestionService.parseCSV(req.body.csv_text, 'Texto CSV');
      } else {
        return res.status(400).json({
          success: false,
          error: 'Debe adjuntar un archivo CSV multipart o enviar un array JSON en el body.',
        });
      }

      // Si el lote supera los 50 registros, se delega a la cola asíncrona (Regla 2)
      if (result.validRows.length > 50) {
        const job = await queueService.enqueueIngestionJob(result.lotCode, result.source, result.validRows);
        return res.status(202).json({
          success: true,
          status: 'ACCEPTED',
          mensaje: 'Lote masivo encolado exitosamente para procesamiento asíncrono.',
          data: {
            job_id: job.id,
            estado: job.estado,
            registros_totales: result.totalRecords,
            registros_procesados: result.validRecords,
            registros_con_error: result.failedRecords,
            errores: result.errors,
          },
        });
      }

      await db.saveIngestionBatch(result.lotCode, result.source, result.validRows);

      return res.status(202).json({
        success: true,
        data: {
          job_id: result.lotCode,
          estado: 'VALIDADO',
          registros_totales: result.totalRecords,
          registros_procesados: result.validRecords,
          registros_con_error: result.failedRecords,
          errores: result.errors,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 4. POST /api/v1/tienda/venta
  public static async recordStoreSale(req: Request, res: Response) {
    try {
      const validation = StoreSaleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de venta inválidos',
          detalles: validation.error.flatten(),
        });
      }

      const { sku_codigo, unidades, sucursal_id } = validation.data;
      const updatedItem = await db.updateStock(sku_codigo, unidades, sucursal_id);

      return res.json({
        success: true,
        data: updatedItem,
        mensaje: `Venta registrada. Stock actualizado de ${sku_codigo}: ${updatedItem.stock_actual} u.`,
      });
    } catch (err: any) {
      return res.status(422).json({ success: false, error: err.message });
    }
  }

  // 5. GET /api/v1/integraciones/auditoria
  public static async getAuditLogs(req: Request, res: Response) {
    try {
      const lots = await db.getAuditLots();
      return res.json({ success: true, data: lots });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 6. GET /api/v1/tienda/inventario
  public static async getStoreInventory(req: Request, res: Response) {
    try {
      const sucursalId = req.query.sucursal_id ? String(req.query.sucursal_id) : undefined;
      const items = await db.getStoreInventory(sucursalId);
      return res.json({ success: true, data: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 7. POST /api/v1/auth/login
  public static async login(req: Request, res: Response) {
    try {
      const validation = LoginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          type: 'https://api.sportstock.ai/errors/bad-request',
          title: 'Credenciales Inválidas',
          status: 400,
          detail: 'Debe ingresar un email válido y una contraseña de al menos 6 caracteres.',
          instance: req.originalUrl,
        });
      }

      const { email, password } = validation.data;
      const user = KNOWN_USERS[email.toLowerCase()];

      if (!user || password !== 'Password123!') {
        return res.status(401).json({
          type: 'https://api.sportstock.ai/errors/unauthorized',
          title: 'Autenticación Fallida',
          status: 401,
          detail: 'El correo electrónico o la contraseña ingresada son incorrectos.',
          instance: req.originalUrl,
        });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user,
        mensaje: `Bienvenido(a), ${user.nombre}. Sesión iniciada como ${user.rol}.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 8. GET /api/v1/auth/me
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    return res.json({ success: true, user: req.user });
  }

  // 9. GET /api/v1/trabajos/:id/estado
  public static async getJobStatus(req: Request, res: Response) {
    const { id } = req.params;
    const job = queueService.getJob(id);
    if (!job) {
      return res.status(404).json({
        type: 'https://api.sportstock.ai/errors/not-found',
        title: 'Trabajo No Encontrado',
        status: 404,
        detail: `No se encontró el trabajo de procesamiento con ID ${id}.`,
        instance: req.originalUrl,
      });
    }
    return res.json({ success: true, data: job });
  }
}

import { Response } from 'express';
import { db } from '../services/db.service.js';
import { ForecastingService } from '../services/forecasting.service.js';
import { ingestionService } from '../services/ingestion.service.js';
import { queueService } from '../services/queue.service.js';
import {
  CreateOrderSchema,
  EmployeeAuditSchema,
  LoginSchema,
  OrderStatusUpdateSchema,
  RunForecastSchema,
  StoreCountAdjustSchema,
  StoreSaleSchema,
} from '../types/index.js';
import { KNOWN_USERS, generateToken, AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { config } from '../config/env.js';

const forecasting = new ForecastingService();

function resolveTenantId(req: AuthenticatedRequest): string {
  return req.tenantId || req.user?.cadena_id || config.defaultCadenaId;
}

export class ApiController {
  // 1. GET /api/v1/dashboard/resumen
  public static async getDashboardSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const { sucursal_id } = req.query as { sucursal_id?: string };

      const inventory = await db.getInventory(cadenaId, sucursal_id);
      const orders = await db.getOrders(cadenaId);

      const criticalSkus = inventory.filter((i) => i.estado_alerta === 'CRITICO').length;
      const warningSkus = inventory.filter((i) => i.estado_alerta === 'PREVENTIVO').length;
      const optimalSkus = inventory.filter((i) => i.estado_alerta === 'OPTIMO').length;
      const pendingOrders = orders.filter((o) => o.estado === 'PENDIENTE');

      const totalReposicionCLP = pendingOrders.reduce((acc, o) => {
        const prod = inventory.find((p) => p.sku_codigo === o.sku_codigo);
        return acc + o.cantidad_sugerida * (prod?.precio || 39990);
      }, 0);

      const sampleItem = inventory[0];
      const sampleForecast = forecasting.calculateSKUForecast({
        skuCodigo: sampleItem?.sku_codigo || 'RUN-001',
        nombre: sampleItem?.nombre || 'Nike Vaporfly 3',
        disciplina: sampleItem?.disciplina || 'RUNNING',
        sucursalId: sucursal_id || sampleItem?.sucursal_codigo || 'SUC-01',
        leadTimeDias: sampleItem?.lead_time_dias || 3,
        stockActual: sampleItem?.stock_actual ?? 3,
        ventasHistoricasSemanales: [15, 18, 22, 26, 28, 31],
        horizonteSemanas: 6,
      });

      return res.json({
        success: true,
        data: {
          cadena_id: cadenaId,
          persistencia: db.isSupabaseActive() ? 'SUPABASE_POSTGRESQL' : 'MEMORIA_MULTI_TENANT',
          kpis: {
            skus_quiebre_critico: criticalSkus,
            demanda_proyectada_delta: '+18,5%',
            ordenes_sugeridas_count: pendingOrders.length,
            monto_reposicion_estimado: `$${(totalReposicionCLP / 1000000).toFixed(1).replace('.', ',')}M`,
            nivel_servicio_red: inventory.length > 0 ? `${Math.round(((inventory.length - criticalSkus) / inventory.length) * 1000) / 10}%` : '95,0%',
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

  // 2. GET /api/v1/inventario
  public static async getCatalogInventory(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const sucursalId = req.query.sucursal_id ? String(req.query.sucursal_id) : undefined;
      const items = await db.getInventory(cadenaId, sucursalId);
      return res.json({ success: true, data: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. GET /api/v1/ordenes
  public static async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const estado = req.query.estado ? String(req.query.estado) : undefined;
      const orders = await db.getOrders(cadenaId, estado);
      return res.json({ success: true, data: orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 4. POST /api/v1/ordenes
  public static async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const validation = CreateOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de orden inválidos',
          detalles: validation.error.flatten(),
        });
      }

      const { sku_codigo, sucursal_id, cantidad_sugerida, evento_estacional } = validation.data;
      const order = await db.createOrder(cadenaId, {
        skuCodigo: sku_codigo,
        sucursalId: sucursal_id,
        cantidadSugerida: cantidad_sugerida,
        eventoEstacional: evento_estacional,
      });

      return res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 5. PATCH /api/v1/ordenes/:id/estado
  public static async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
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
      const approverName = req.user?.nombre || validation.data.aprobado_por;
      const updatedOrder = await db.resolveOrder(cadenaId, id, estado, cantidad_aprobada, approverName);

      return res.json({
        success: true,
        data: updatedOrder,
        mensaje: `Orden ${id} actualizada con éxito a estado ${estado}.`,
      });
    } catch (err: any) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }

  // 6. POST /api/v1/predicciones/ejecutar
  public static async runPredictions(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const validation = RunForecastSchema.safeParse(req.body || {});
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros de predicción inválidos',
          detalles: validation.error.flatten(),
        });
      }

      const start = performance.now();
      const { horizonte_semanas } = validation.data;
      const inventory = await db.getInventory(cadenaId);
      const existingOrders = await db.getOrders(cadenaId, 'PENDIENTE');
      const createdOrders = [];

      for (const item of inventory) {
        const forecast = forecasting.calculateSKUForecast({
          skuCodigo: item.sku_codigo,
          nombre: item.nombre,
          disciplina: item.disciplina,
          sucursalId: item.sucursal_codigo,
          leadTimeDias: item.lead_time_dias,
          stockActual: item.stock_actual,
          stockTransito: item.stock_transito,
          ventasHistoricasSemanales: [
            Math.max(1, Math.round(item.ventas_semanales_base * 0.9)),
            Math.max(1, Math.round(item.ventas_semanales_base * 1.05)),
            Math.max(1, Math.round(item.ventas_semanales_base * 0.95)),
            item.ventas_semanales_base,
          ],
          horizonteSemanas: horizonte_semanas,
        });

        if (item.stock_actual <= item.stock_minimo && forecast.cantidadSugerida > 0) {
          const alreadyPending = existingOrders.some((o) => o.sku_codigo === item.sku_codigo);
          if (!alreadyPending) {
            const newOrder = await db.createOrder(cadenaId, {
              skuCodigo: item.sku_codigo,
              sucursalId: item.sucursal_codigo,
              cantidadSugerida: forecast.cantidadSugerida,
              eventoEstacional: forecast.eventoEstacional,
              demandaEsperada: Math.round(forecast.demandaAcumulada / horizonte_semanas),
              confidenceScore: forecast.confidenceScore,
            });
            createdOrders.push(newOrder);
          }
        }
      }

      const elapsedSec = ((performance.now() - start) / 1000).toFixed(3);
      await db.addEmployeeAuditLog(cadenaId, {
        empleado: req.user?.nombre || 'Motor Predictivo',
        rol: req.user?.rol || 'GERENTE_OPERACIONES',
        tipo_gestion: 'Cálculo Predictivo API',
        sucursal: 'Red Nacional',
        terminal: 'API Gateway /v1',
        detalle: `Evaluó ${inventory.length} SKUs en ${elapsedSec}s (horizonte ${horizonte_semanas} sem). Creó ${createdOrders.length} órdenes nuevas.`,
        estado: 'EXITOSO',
      });

      return res.json({
        success: true,
        data: {
          skus_analizados: inventory.length,
          tiempo_segundos: elapsedSec,
          ordenes_generadas: createdOrders.length,
          nuevas_ordenes: createdOrders,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 7. POST /api/v1/ingesta/lote
  public static async ingestBatch(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      let result;

      if (req.file) {
        const fileContent = req.file.buffer.toString('utf-8');
        result = ingestionService.parseCSV(fileContent, req.file.originalname);
      } else if (Array.isArray(req.body)) {
        result = ingestionService.parseJSONBatch(req.body, 'API REST ERP');
      } else if (req.body.csv_text) {
        result = ingestionService.parseCSV(req.body.csv_text, 'Texto CSV');
      } else {
        return res.status(400).json({
          success: false,
          error: 'Debe adjuntar un archivo CSV multipart o enviar un array JSON en el body.',
        });
      }

      if (result.validRows.length > 50) {
        const job = await queueService.enqueueIngestionJob(
          cadenaId,
          result.lotCode,
          result.source,
          result.validRows,
          result.errors
        );
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

      await db.saveIngestionBatch(cadenaId, result.lotCode, result.source, result.validRows, result.errors);
      await db.addEmployeeAuditLog(cadenaId, {
        empleado: req.user?.nombre || 'Sistema Ingesta',
        rol: req.user?.rol || 'AUDITOR',
        tipo_gestion: 'Ingesta de Lote',
        sucursal: 'Central',
        terminal: result.source,
        detalle: `Lote ${result.lotCode}: ${result.validRecords} filas válidas, ${result.failedRecords} con error.`,
        estado: result.failedRecords > 0 ? 'AUDITADO' : 'EXITOSO',
      });

      return res.status(202).json({
        success: true,
        data: {
          job_id: result.lotCode,
          estado: result.failedRecords > 0 ? 'VALIDADO_CON_ALERTAS' : 'VALIDADO',
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

  // 8. POST /api/v1/tienda/venta
  public static async recordStoreSale(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const validation = StoreSaleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de venta inválidos',
          detalles: validation.error.flatten(),
        });
      }

      const { sku_codigo, unidades, sucursal_id } = validation.data;
      const updatedItem = await db.updateStock(cadenaId, sku_codigo, unidades, sucursal_id);

      return res.json({
        success: true,
        data: updatedItem,
        mensaje: `Venta registrada. Stock actualizado de ${sku_codigo}: ${updatedItem.stock_actual} u.`,
      });
    } catch (err: any) {
      return res.status(422).json({ success: false, error: err.message });
    }
  }

  // 9. PATCH /api/v1/tienda/inventario/:sku
  public static async adjustStoreCount(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const { sku } = req.params;
      const validation = StoreCountAdjustSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de conteo físico inválidos',
          detalles: validation.error.flatten(),
        });
      }

      const { stock_actual, sucursal_id, responsable } = validation.data;
      const updatedItem = await db.adjustStockCount(
        cadenaId,
        sku,
        stock_actual,
        sucursal_id,
        responsable || req.user?.nombre || 'Encargado de Tienda'
      );

      return res.json({
        success: true,
        data: updatedItem,
        mensaje: `Conteo físico de ${sku} actualizado a ${updatedItem.stock_actual} u.`,
      });
    } catch (err: any) {
      return res.status(404).json({ success: false, error: err.message });
    }
  }

  // 10. GET /api/v1/integraciones/auditoria
  public static async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const lots = await db.getAuditLots(cadenaId);
      return res.json({ success: true, data: lots });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 11. GET /api/v1/auditoria/empleados
  public static async getEmployeeAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const logs = await db.getEmployeeAuditLogs(cadenaId);
      return res.json({ success: true, data: logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 12. POST /api/v1/auditoria/empleados
  public static async createEmployeeAuditLog(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const validation = EmployeeAuditSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de auditoría inválidos',
          detalles: validation.error.flatten(),
        });
      }

      const created = await db.addEmployeeAuditLog(cadenaId, {
        empleado: req.user?.nombre || 'Usuario Sistema',
        rol: req.user?.rol || 'GERENTE_OPERACIONES',
        ...validation.data,
      });

      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 13. GET /api/v1/tienda/inventario
  public static async getStoreInventory(req: AuthenticatedRequest, res: Response) {
    try {
      const cadenaId = resolveTenantId(req);
      const sucursalId = req.query.sucursal_id ? String(req.query.sucursal_id) : undefined;
      const items = await db.getStoreInventory(cadenaId, sucursalId);
      return res.json({ success: true, data: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 14. POST /api/v1/auth/login
  public static async login(req: AuthenticatedRequest, res: Response) {
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
      const expectedPassword = process.env.DEMO_PASSWORD || 'Password123!';

      if (!user || password !== expectedPassword) {
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

  // 15. GET /api/v1/auth/me
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    return res.json({ success: true, user: req.user });
  }

  // 16. GET /api/v1/trabajos/:id/estado
  public static async getJobStatus(req: AuthenticatedRequest, res: Response) {
    const cadenaId = resolveTenantId(req);
    const { id } = req.params;
    const job = queueService.getJob(id, cadenaId);
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

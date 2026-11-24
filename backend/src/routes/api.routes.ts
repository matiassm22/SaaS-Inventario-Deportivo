import { Router } from 'express';
import multer from 'multer';
import { ApiController } from '../controllers/api.controller.js';
import { requireAuth, optionalAuth, requireRole } from '../middlewares/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB según especificación
});

export const apiRouter = Router();

// 1. Autenticación y Perfil
apiRouter.post('/auth/login', ApiController.login);
apiRouter.get('/auth/me', requireAuth, ApiController.getProfile);

// 2. Operaciones de Negocio, Inventario, Predicciones & Órdenes
apiRouter.get('/dashboard/resumen', optionalAuth, ApiController.getDashboardSummary);
apiRouter.get('/inventario', optionalAuth, ApiController.getCatalogInventory);
apiRouter.get('/ordenes', optionalAuth, ApiController.getOrders);
apiRouter.post('/ordenes', requireAuth, requireRole(['GERENTE_OPERACIONES', 'JEFE_TIENDA']), ApiController.createOrder);
apiRouter.patch('/ordenes/:id/estado', requireAuth, requireRole(['GERENTE_OPERACIONES']), ApiController.updateOrderStatus);
apiRouter.post('/predicciones/ejecutar', requireAuth, requireRole(['GERENTE_OPERACIONES']), ApiController.runPredictions);

// 3. Ingesta de Lotes & Auditoría
apiRouter.post('/ingesta/lote', requireAuth, requireRole(['GERENTE_OPERACIONES', 'AUDITOR']), upload.single('archivo'), ApiController.ingestBatch);
apiRouter.get('/trabajos/:id/estado', requireAuth, ApiController.getJobStatus);
apiRouter.get('/integraciones/auditoria', optionalAuth, ApiController.getAuditLogs);
apiRouter.get('/auditoria/empleados', optionalAuth, ApiController.getEmployeeAuditLogs);
apiRouter.post('/auditoria/empleados', requireAuth, ApiController.createEmployeeAuditLog);

// 4. Operaciones de Tienda Física (Mobile / POS)
apiRouter.get('/tienda/inventario', optionalAuth, ApiController.getStoreInventory);
apiRouter.post('/tienda/venta', optionalAuth, ApiController.recordStoreSale);
apiRouter.patch('/tienda/inventario/:sku', requireAuth, requireRole(['GERENTE_OPERACIONES', 'JEFE_TIENDA']), ApiController.adjustStoreCount);

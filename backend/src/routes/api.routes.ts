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

// 2. Operaciones de Negocio & Dashboard
apiRouter.get('/dashboard/resumen', optionalAuth, ApiController.getDashboardSummary);
apiRouter.patch('/ordenes/:id/estado', requireAuth, requireRole(['GERENTE_OPERACIONES']), ApiController.updateOrderStatus);

// 3. Ingesta de Lotes & Auditoría
apiRouter.post('/ingesta/lote', requireAuth, requireRole(['GERENTE_OPERACIONES', 'AUDITOR']), upload.single('archivo'), ApiController.ingestBatch);
apiRouter.get('/trabajos/:id/estado', requireAuth, ApiController.getJobStatus);
apiRouter.get('/integraciones/auditoria', requireAuth, ApiController.getAuditLogs);

// 4. Operaciones de Tienda Física (Mobile / POS)
apiRouter.get('/tienda/inventario', optionalAuth, ApiController.getStoreInventory);
apiRouter.post('/tienda/venta', optionalAuth, ApiController.recordStoreSale);

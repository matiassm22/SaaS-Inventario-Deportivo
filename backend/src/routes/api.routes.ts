import { Router } from 'express';
import multer from 'multer';
import { ApiController } from '../controllers/api.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB según especificación
});

export const apiRouter = Router();

// Rutas de API v1
apiRouter.get('/dashboard/resumen', ApiController.getDashboardSummary);
apiRouter.patch('/ordenes/:id/estado', ApiController.updateOrderStatus);
apiRouter.post('/ingesta/lote', upload.single('archivo'), ApiController.ingestBatch);
apiRouter.get('/tienda/inventario', ApiController.getStoreInventory);
apiRouter.post('/tienda/venta', ApiController.recordStoreSale);
apiRouter.get('/integraciones/auditoria', ApiController.getAuditLogs);

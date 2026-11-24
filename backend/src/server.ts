import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { apiRouter } from './routes/api.routes.js';

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check y Ruta Raíz Informativa
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    service: 'SportStockAI API REST',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/v1/dashboard/resumen',
    health: '/health',
    environment: config.nodeEnv,
  });
});

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ONLINE',
    service: 'SportStockAI API Backend',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Rutas API v1
app.use('/api/v1', apiRouter);

// Manejador global de errores RFC 7807
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    type: 'https://api.sportstock.ai/errors/internal-error',
    title: 'Error Interno del Servidor',
    status: err.status || 500,
    detail: err.message || 'Ocurrió un error inesperado al procesar la solicitud.',
    instance: req.originalUrl,
  });
});

// Iniciar servidor
const host = '0.0.0.0';
app.listen(config.port, host, () => {
  console.log(`[INFO] Servidor SportStock API activo en http://${host}:${config.port}`);
  console.log(`[INFO] URL base: http://${host}:${config.port}/api/v1`);
  console.log(`[INFO] Health check: http://${host}:${config.port}/health`);
});

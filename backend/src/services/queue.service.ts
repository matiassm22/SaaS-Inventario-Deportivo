import { IngestionRow } from '../types/index.js';
import { db } from './db.service.js';

export type JobStatus = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO';

export interface BackgroundJob {
  id: string;
  tipo: 'INGESTA_MASIVA' | 'CALCULO_PREDICTIVO';
  estado: JobStatus;
  progreso: number;
  totalRegistros: number;
  registrosProcesados: number;
  creadoEn: string;
  finalizadoEn?: string;
  error?: string;
}

/**
 * Servicio de Colas y Cómputo Asíncrono (Regla 2 de PROJECT_RULES).
 * Garantiza cero bloqueos al Event Loop delegando lotes pesados a segundo plano.
 */
export class QueueService {
  private jobs: Map<string, BackgroundJob> = new Map();

  /**
   * Encola un lote de ingesta masiva sin bloquear el hilo principal de la API.
   */
  public async enqueueIngestionJob(lotCode: string, source: string, rows: IngestionRow[]): Promise<BackgroundJob> {
    const job: BackgroundJob = {
      id: lotCode,
      tipo: 'INGESTA_MASIVA',
      estado: 'PENDIENTE',
      progreso: 0,
      totalRegistros: rows.length,
      registrosProcesados: 0,
      creadoEn: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);

    // Desacoplamiento del Event Loop
    setImmediate(async () => {
      try {
        job.estado = 'EN_PROCESO';
        job.progreso = 25;

        await db.saveIngestionBatch(lotCode, source, rows);

        job.registrosProcesados = rows.length;
        job.progreso = 100;
        job.estado = 'COMPLETADO';
        job.finalizadoEn = new Date().toISOString();
      } catch (err: any) {
        job.estado = 'FALLIDO';
        job.error = err.message || 'Error en procesamiento asíncrono';
        job.finalizadoEn = new Date().toISOString();
      }
    });

    return job;
  }

  public getJob(jobId: string): BackgroundJob | undefined {
    return this.jobs.get(jobId);
  }

  public getAllJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values());
  }
}

export const queueService = new QueueService();

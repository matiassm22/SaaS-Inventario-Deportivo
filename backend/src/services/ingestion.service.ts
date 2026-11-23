import { IngestionRow, IngestionRowSchema } from '../types/index.js';

export interface IngestionResult {
  lotCode: string;
  source: string;
  totalRecords: number;
  validRecords: number;
  failedRecords: number;
  validRows: IngestionRow[];
  errors: { row: number; error: string }[];
}

export class IngestionService {
  /**
   * Procesa texto CSV delimitado por comas o punto y coma y valida con Zod.
   */
  public parseCSV(csvContent: string, sourceName = 'archivo.csv'): IngestionResult {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('El archivo CSV debe contener una fila de encabezados y al menos una fila de datos.');
    }

    const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
    const validRows: IngestionRow[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/).map((v) => v.trim());
      if (values.length < headers.length) continue;

      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx];
      });

      const parsed = IngestionRowSchema.safeParse(rowObj);
      if (parsed.success) {
        validRows.push(parsed.data);
      } else {
        errors.push({
          row: i + 1,
          error: parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join(', '),
        });
      }
    }

    const lotCode = `LT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      lotCode,
      source: sourceName,
      totalRecords: lines.length - 1,
      validRecords: validRows.length,
      failedRecords: errors.length,
      validRows,
      errors,
    };
  }

  /**
   * Procesa lotes JSON directos enviados por la API del ERP.
   */
  public parseJSONBatch(records: any[], sourceName = 'API REST ERP'): IngestionResult {
    const validRows: IngestionRow[] = [];
    const errors: { row: number; error: string }[] = [];

    records.forEach((rec, idx) => {
      const parsed = IngestionRowSchema.safeParse(rec);
      if (parsed.success) {
        validRows.push(parsed.data);
      } else {
        errors.push({
          row: idx + 1,
          error: parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join(', '),
        });
      }
    });

    const lotCode = `API-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      lotCode,
      source: sourceName,
      totalRecords: records.length,
      validRecords: validRows.length,
      failedRecords: errors.length,
      validRows,
      errors,
    };
  }
}

export const ingestionService = new IngestionService();

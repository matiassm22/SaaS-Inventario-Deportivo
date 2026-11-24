import { useMemo, useRef, useState } from 'react'
import { api, type BatchRowError } from '../services/api'
import type { BatchAuditRow, CatalogProduct } from '../types/inventory'
import { Icon } from '../components/Icons'

interface LastBatchReport {
  lotId: string
  source: string
  total: number
  processed: number
  failed: number
  errors: BatchRowError[]
}

export function IntegrationsPage({
  products,
  batchRows,
  canIngestData,
  onRequireLogin,
  onRefreshFromBackend,
  onAddBatchRow,
  onApplyPosSale,
  onIngestCsvText,
  onShowToast,
}: {
  products: CatalogProduct[]
  batchRows: BatchAuditRow[]
  canIngestData: boolean
  onRequireLogin: () => void
  onRefreshFromBackend: () => void
  onAddBatchRow: (row: BatchAuditRow) => void
  onApplyPosSale: (sales: Array<{ sku_id: string; unidades_vendidas: number; stock_remanente?: number }>, sourceLabel: string) => void
  onIngestCsvText: (csvText: string, fileName: string) => number
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploadName, setUploadName] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [discFilter, setDiscFilter] = useState<'TODAS' | 'FUTBOL' | 'RUNNING' | 'FITNESS'>('TODAS')
  const [lastBatchReport, setLastBatchReport] = useState<LastBatchReport | null>(null)
  const [jsonPayload, setJsonPayload] = useState(
    JSON.stringify(
      {
        origen: 'POS_COSTANERA_CAJA_01',
        timestamp: new Date().toISOString(),
        lote_ventas: [
          { sku_id: 'RN-011', unidades_vendidas: 2 },
          { sku_id: 'RUN-001', unidades_vendidas: 1 },
        ],
      },
      null,
      2
    )
  )
  const [apiResponse, setApiResponse] = useState<{ status: number; msg: string; tx: string } | null>(null)

  const filteredProducts = useMemo(
    () => products.filter((p) => discFilter === 'TODAS' || p.disciplina === discFilter),
    [products, discFilter]
  )

  const handleFileUpload = async (file: File) => {
    if (!canIngestData) {
      onShowToast('Requiere rol GERENTE_OPERACIONES o AUDITOR para cargar lotes CSV.', 'warning')
      onRequireLogin()
      return
    }

    setUploadName(file.name)
    const text = await file.text()
    const res = await api.uploadCsvBatch(file)

    if (!res.success && !res.offline) {
      onShowToast(res.message || 'Error al validar lote CSV en el servidor.', 'error')
      return
    }

    if (res.offline) {
      const localCount = onIngestCsvText(text, file.name)
      const lotId = `LT-${Date.now().toString().slice(-6)}`
      onAddBatchRow({
        id: lotId,
        date: 'Ahora mismo',
        source: file.name,
        records: `${localCount} SKUs`,
        status: 'Validado local',
        tone: 'success',
      })
      setLastBatchReport({
        lotId,
        source: file.name,
        total: localCount,
        processed: localCount,
        failed: 0,
        errors: [],
      })
      onShowToast(`Archivo ${file.name} procesado localmente (${localCount} filas).`, 'info')
      return
    }

    const lotId = res.lotCode || `LT-${Date.now().toString().slice(-6)}`
    const total = res.total ?? 0
    const processed = res.processed ?? 0
    const failed = res.failed ?? 0
    const errors = res.errors ?? []

    setLastBatchReport({ lotId, source: file.name, total, processed, failed, errors })
    onRefreshFromBackend()
    onShowToast(
      failed > 0
        ? `Lote ${lotId}: ${processed} filas válidas y ${failed} filas rechazadas.`
        : `Lote ${lotId} validado e ingresado (${processed} registros).`,
      failed > 0 ? 'warning' : 'success'
    )
  }

  const handleSendPosJson = async () => {
    if (!canIngestData) {
      onShowToast('Requiere rol GERENTE_OPERACIONES o AUDITOR para enviar lotes POS JSON.', 'warning')
      onRequireLogin()
      return
    }

    try {
      const parsed = JSON.parse(jsonPayload)
      const lote: Array<{ sku_id: string; unidades_vendidas: number; stock_remanente?: number }> = Array.isArray(
        parsed.lote_ventas
      )
        ? parsed.lote_ventas
        : []

      if (lote.length === 0) {
        onShowToast('El JSON debe incluir "lote_ventas" con al menos 1 ítem.', 'warning')
        return
      }

      const apiRecords = lote.map((item) => {
        const prod = products.find((p) => p.sku_id.toUpperCase() === item.sku_id.toUpperCase())
        return {
          sku_codigo: item.sku_id,
          nombre: prod?.nombre || item.sku_id,
          disciplina: prod?.disciplina || 'OTRO',
          sucursal_codigo: prod?.sucursal_id || 'SUC-01',
          fecha: new Date().toISOString().slice(0, 10),
          unidades_vendidas: Number(item.unidades_vendidas) || 0,
          stock_actual: Math.max(0, (prod?.stock_actual ?? 10) - (Number(item.unidades_vendidas) || 0)),
          stock_minimo: prod?.stock_minimo ?? 10,
          precio_unitario: prod?.precio ?? 0,
        }
      })

      const batchRes = await api.uploadJsonBatch(apiRecords)

      if (!batchRes.success && !batchRes.offline) {
        onShowToast(batchRes.message || 'El backend rechazó el lote JSON.', 'error')
        return
      }

      if (batchRes.offline) {
        onApplyPosSale(lote, parsed.origen || 'POS_CAJA_01')
      } else {
        onRefreshFromBackend()
      }

      const tx = batchRes.lotCode || `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      setApiResponse({
        status: batchRes.status || 202,
        msg: batchRes.success ? 'Sincronizado con Backend API' : 'Procesado en contingencia local',
        tx,
      })
      if (batchRes.errors && batchRes.errors.length > 0) {
        setLastBatchReport({
          lotId: tx,
          source: parsed.origen || 'POS_CAJA_01',
          total: batchRes.total ?? lote.length,
          processed: batchRes.processed ?? 0,
          failed: batchRes.failed ?? batchRes.errors.length,
          errors: batchRes.errors,
        })
      }
      onShowToast(`Venta POS procesada (${tx}) · Stock actualizado.`, 'success')
    } catch {
      onShowToast('JSON inválido: revisa la sintaxis antes de enviar.', 'error')
    }
  }

  const doSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      onRefreshFromBackend()
      onShowToast('Sincronización ERP SAP completada.', 'success')
    }, 800)
  }

  const handleExportHistory = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID Lote,Fecha,Origen,Registros,Estado']
        .concat(batchRows.map((r) => `${r.id},${r.date},${r.source},${r.records},${r.status}`))
        .join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `auditoria_inventario_sportstock_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadTemplate = () => {
    const template =
      'data:text/csv;charset=utf-8,sku_codigo,nombre,disciplina,talla,sucursal_codigo,fecha,unidades_vendidas,stock_actual,stock_minimo,precio_unitario\nRUN-001,Nike Vaporfly 3,RUNNING,42,SUC-01,2026-11-23,4,3,8,189990\nRUN-008,Cortaviento Trail Shield,RUNNING,M,SUC-01,2026-11-23,2,6,12,49990\nFUT-023,Balón Torneo Pro Match N°5,FUTBOL,Única,SUC-02,2026-11-23,5,12,18,29990\n'
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(template))
    link.setAttribute('download', 'plantilla_ingesta_inventario.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="page-wrap space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Centro de Datos B2B & Ingesta Dual</p>
          <h1 className="page-title">Integraciones, CSV & Simulador POS</h1>
          <p className="page-subtitle">
            Recepción síncrona JSON desde terminales POS, carga masiva CSV validada con Zod y sincronización ERP SAP.
          </p>
        </div>
        <div className="sync-status shrink-0">
          <span className="live-dot" />
          <div>
            <p>Conexión API Activa</p>
            <small>Sincronización cada 15 min</small>
          </div>
        </div>
      </div>

      {!canIngestData && (
        <div className="panel p-4 border-amber-300 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <Icon name="lock" size={16} className="shrink-0" />
            <span>
              <strong>Control de Acceso RBAC:</strong> La carga de planillas CSV y envío de lotes POS requiere iniciar
              sesión con perfil <strong>GERENTE_OPERACIONES</strong> o <strong>AUDITOR</strong>.
            </span>
          </div>
          <button onClick={onRequireLogin} className="primary-button h-[32px] px-3 text-xs">
            Cambiar perfil
          </button>
        </div>
      )}

      {/* REPORTE DE VALIDACIÓN DE FILAS (REGLA 4 - RESILIENCIA CSV/JSON) */}
      {lastBatchReport && (
        <div
          className={`panel p-5 space-y-3 border ${
            lastBatchReport.failed > 0
              ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5'
              : 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/5'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Reporte de Validación Zod · Lote <span className="font-mono">{lastBatchReport.lotId}</span> ({lastBatchReport.source})
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Totales: <strong>{lastBatchReport.total}</strong> · Procesados:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{lastBatchReport.processed}</strong> · Rechazados:{' '}
                <strong className={lastBatchReport.failed > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                  {lastBatchReport.failed}
                </strong>
              </p>
            </div>
            <button onClick={() => setLastBatchReport(null)} className="secondary-button text-xs py-1">
              Cerrar reporte
            </button>
          </div>

          {lastBatchReport.errors.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-slate-950">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="w-24">Fila #</th>
                    <th>Motivo de rechazo (Validación Zod)</th>
                  </tr>
                </thead>
                <tbody>
                  {lastBatchReport.errors.map((err, idx) => (
                    <tr key={`${err.row}-${idx}`}>
                      <td className="font-mono font-semibold text-red-600 dark:text-red-400">Fila {err.row}</td>
                      <td className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FILA 1: ERP SAP + VÍA 1 CSV + VÍA 2 SIMULADOR POS JSON */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="integration-icon sap">
                <span>SAP</span>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span />
              </label>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <h2 className="section-title">Sincronización ERP</h2>
                <span className="status-badge success">Conectado</span>
              </div>
              <p className="section-subtitle mt-1">SAP Business One / HANA · Conector REST Oficial</p>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 mt-5">
            <div>
              <p className="text-[11px] text-slate-500">Última sincronización</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">Hoy, 08:30</p>
            </div>
            <button onClick={doSync} disabled={syncing} className="secondary-button cursor-pointer">
              <Icon name="refresh" size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>

        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="section-title">Vía 1: Carga Planilla CSV</h2>
                <p className="section-subtitle mt-0.5">Validación Zod · Hasta 25 MB</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline shrink-0"
              >
                Plantilla .csv
              </button>
            </div>

            <button
              onClick={() => (canIngestData ? inputRef.current?.click() : onRequireLogin())}
              onDragOver={(e: any) => e.preventDefault()}
              onDrop={(e: any) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFileUpload(f)
              }}
              className={`drop-zone cursor-pointer mt-4 ${uploadName ? 'uploaded' : ''} ${!canIngestData ? 'opacity-65' : ''}`}
            >
              {uploadName ? (
                <>
                  <span className="upload-check">
                    <Icon name="check" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{uploadName}</p>
                    <small>Archivo procesado · Clic para cambiar</small>
                  </div>
                </>
              ) : (
                <>
                  <span className="upload-icon">
                    <Icon name={canIngestData ? 'cloud' : 'lock'} size={20} />
                  </span>
                  <div>
                    <p>{canIngestData ? 'Arrastra tu reporte de stock (.csv)' : 'Inicia sesión para cargar CSV'}</p>
                    <small>o haz clic para explorar en tu equipo</small>
                  </div>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e: any) => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
              }}
            />
          </div>
        </div>

        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="section-title">Vía 2: API REST POS (JSON)</h2>
              <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400">POST /api/v1/ingesta/lote</span>
            </div>
            <textarea
              value={jsonPayload}
              onChange={(e: any) => setJsonPayload(e.target.value)}
              rows={6}
              className="w-full mt-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 outline-none focus:border-emerald-500"
            />
            {apiResponse && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 flex justify-between gap-2">
                <span>HTTP {apiResponse.status} · {apiResponse.msg}</span>
                <span className="shrink-0">{apiResponse.tx}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSendPosJson}
            disabled={!canIngestData}
            className="primary-button w-full text-xs mt-3"
          >
            <Icon name={canIngestData ? 'upload' : 'lock'} size={14} />
            {canIngestData ? 'Enviar Venta POS a la API' : 'Requiere rol Gerente / Auditor'}
          </button>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS SINCRONIZADOS POR DISCIPLINA */}
      <div className="panel overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Productos Sincronizados por Ingesta Dual</h2>
            <p className="section-subtitle">Catálogo vivo del inquilino activo actualizado vía POS y CSV</p>
          </div>
          <div className="tabs">
            {(['TODAS', 'FUTBOL', 'RUNNING', 'FITNESS'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDiscFilter(d)}
                className={discFilter === d ? 'active font-semibold' : ''}
              >
                {d === 'TODAS' ? `Todas (${products.length})` : d}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Disciplina</th>
                <th className="text-right">Precio</th>
                <th className="text-center">Stock</th>
                <th>Canal de Ingesta</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.sku_id}>
                  <td className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{p.sku_id}</td>
                  <td className="font-medium text-slate-900 dark:text-slate-200">{p.nombre}</td>
                  <td>{p.tipo}</td>
                  <td>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {p.disciplina}
                    </span>
                  </td>
                  <td className="text-right font-mono">${p.precio.toLocaleString('es-CL')}</td>
                  <td className="text-center font-mono font-bold text-slate-900 dark:text-slate-200">{p.stock_actual} u.</td>
                  <td className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{p.canal_ingesta || 'REST API (POS_CAJA_01)'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDITORÍA DE LOTES RECIENTES */}
      <div className="panel overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h2 className="section-title">Auditoría de lotes recientes</h2>
            <p className="section-subtitle mt-0.5">Trazabilidad completa de cada fuente procesada en el SaaS</p>
          </div>
          <button onClick={handleExportHistory} className="secondary-button cursor-pointer text-xs self-start sm:self-auto">
            <Icon name="download" size={14} />
            Exportar historial (.csv)
          </button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ID lote</th>
                <th>Fecha / hora</th>
                <th>Origen</th>
                <th>Registros</th>
                <th>Estado</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {batchRows.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{row.id}</td>
                  <td>{row.date}</td>
                  <td>
                    <span className="source-cell">
                      <i className={row.source.startsWith('SAP') ? 'sap' : 'excel'}>
                        {row.source.startsWith('SAP') ? 'S' : 'X'}
                      </i>
                      {row.source}
                    </span>
                  </td>
                  <td className="font-mono">{row.records}</td>
                  <td>
                    <span className={`status-badge ${row.tone}`}>
                      <span className="badge-dot" />
                      {row.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">Trazado ✓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

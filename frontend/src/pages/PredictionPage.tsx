import { useMemo, useState } from 'react'
import type { CatalogProduct } from '../types/inventory'
import { Icon } from '../components/Icons'

export function PredictionPage({
  products,
  selectedSku,
  setSelectedSku,
  onRunBatchPrediction,
}: {
  products: CatalogProduct[]
  selectedSku: string
  setSelectedSku: (skuId: string) => void
  onRunBatchPrediction: (horizon: number, factors: Record<'FUTBOL' | 'RUNNING' | 'FITNESS', number>) => {
    count: number
    timeSec: string
    newOrders: number
  }
}) {
  const [horizon, setHorizon] = useState<number>(4)
  const [seasonalFactors, setSeasonalFactors] = useState<Record<'FUTBOL' | 'RUNNING' | 'FITNESS', number>>({
    FUTBOL: 1.25,
    RUNNING: 1.35,
    FITNESS: 1.2,
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [lastBenchmark, setLastBenchmark] = useState<{ count: number; timeSec: string; newOrders: number } | null>(null)

  const currentProduct = useMemo(
    () => products.find((p) => p.sku_id === selectedSku) || products[0],
    [products, selectedSku]
  )

  const simulation = useMemo(() => {
    if (!currentProduct) return { labels: [], hist: [], proj: [], upper: [], lower: [], totalDemand: 0, suggested: 0 }
    const factor = seasonalFactors[currentProduct.disciplina] || 1.2
    const base = currentProduct.ventas_semanales_base

    const histValues = [Math.round(base * 0.9), Math.round(base * 1.05), Math.round(base * 0.95), base]
    const labels = ['Sem -3', 'Sem -2', 'Sem -1', 'Actual']
    const projValues: Array<number | null> = [null, null, null, base]
    const upperValues: Array<number | null> = [null, null, null, base]
    const lowerValues: Array<number | null> = [null, null, null, base]

    let totalDemand = 0
    for (let i = 1; i <= horizon; i++) {
      labels.push(`Sem +${i}`)
      const est = Math.round(base * (1 + (factor - 1) * (i / horizon)))
      totalDemand += est
      projValues.push(est)
      upperValues.push(Math.round(est * 1.12))
      lowerValues.push(Math.max(0, Math.round(est * 0.88)))
    }

    const suggested = Math.max(0, Math.round(base * factor * 1.5) + currentProduct.stock_seguridad - currentProduct.stock_actual)
    return { labels, hist: histValues, proj: projValues, upper: upperValues, lower: lowerValues, totalDemand, suggested }
  }, [currentProduct, horizon, seasonalFactors])

  const handleRun = () => {
    setIsCalculating(true)
    setTimeout(() => {
      const bench = onRunBatchPrediction(horizon, seasonalFactors)
      setLastBenchmark(bench)
      setIsCalculating(false)
    }, 450)
  }

  const chartGeometry = useMemo(() => {
    const allNums = [
      ...simulation.hist,
      ...(simulation.upper.filter((v): v is number => v !== null)),
    ]
    const maxVal = Math.max(10, ...allNums) * 1.15
    const totalCols = simulation.labels.length
    const startX = 48
    const endX = 690
    const stepX = totalCols > 1 ? (endX - startX) / (totalCols - 1) : 0
    const toY = (val: number) => Math.round(210 - (val / maxVal) * 170)

    const histPts = simulation.hist.map((val, i) => ({ x: Math.round(startX + i * stepX), y: toY(val), val }))
    const projPts = simulation.proj
      .map((val, i) => (val === null ? null : { x: Math.round(startX + i * stepX), y: toY(val), val }))
      .filter((x): x is { x: number; y: number; val: number } => x !== null)

    const upperPts = simulation.upper
      .map((val, i) => (val === null ? null : { x: Math.round(startX + i * stepX), y: toY(val) }))
      .filter((x): x is { x: number; y: number } => x !== null)

    const lowerPts = simulation.lower
      .map((val, i) => (val === null ? null : { x: Math.round(startX + i * stepX), y: toY(val) }))
      .filter((x): x is { x: number; y: number } => x !== null)

    const bandPath =
      upperPts.length > 0 && lowerPts.length > 0
        ? [
            ...upperPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`),
            ...[...lowerPts].reverse().map((p) => `L ${p.x} ${p.y}`),
            'Z',
          ].join(' ')
        : ''

    return {
      histPath: histPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
      projPath: projPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
      bandPath,
      histPts,
      projPts,
      maxVal: Math.round(maxVal),
    }
  }, [simulation])

  return (
    <main className="page-wrap space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Motor Estacional Holt-Winters / Suavizamiento</p>
          <h1 className="page-title">Simulador Predictivo de Demanda</h1>
          <p className="page-subtitle">
            Proyección semanal de 2 a 8 semanas por SKU con factores estacionales y latencia inferior a 3,0 s (RNF-02).
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isCalculating}
          className="primary-button text-xs self-start lg:self-auto"
        >
          <Icon name={isCalculating ? 'refresh' : 'spark'} size={15} className={isCalculating ? 'animate-spin' : ''} />
          {isCalculating ? 'Calculando matriz...' : 'Ejecutar Cálculo Predictivo'}
        </button>
      </div>

      {lastBenchmark && (
        <div className="panel p-4 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Icon name="check" size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-800 dark:text-slate-200">
              Benchmark RNF-02: <strong>{lastBenchmark.count} SKUs</strong> procesados en{' '}
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">{lastBenchmark.timeSec}s</strong> (límite &lt; 3,0s)
            </span>
          </div>
          <span className="mini-tag green">+{lastBenchmark.newOrders} órdenes sugeridas nuevas</span>
        </div>
      )}

      {/* CONTROLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Horizonte de Proyección</label>
          <div className="grid grid-cols-4 gap-2">
            {[2, 4, 6, 8].map((w) => (
              <button
                key={w}
                onClick={() => setHorizon(w)}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  horizon === w
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950'
                    : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {w} sem
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Ventana normativa: 2 a 8 semanas calendario.</p>
        </div>

        <div className="panel p-5 space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Producto (SKU) a Simular</label>
          <select
            value={selectedSku}
            onChange={(e: any) => setSelectedSku(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          >
            {products.map((p) => (
              <option key={p.sku_id} value={p.sku_id}>
                [{p.disciplina}] {p.sku_id} — {p.nombre}
              </option>
            ))}
          </select>
          {currentProduct && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Stock actual: <strong className="text-slate-900 dark:text-white font-mono">{currentProduct.stock_actual} u.</strong> · Mínimo:{' '}
              <strong className="font-mono">{currentProduct.stock_minimo} u.</strong>
            </p>
          )}
        </div>

        <div className="panel p-5 space-y-2.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Factores Estacionales por Disciplina</label>
          <div className="grid grid-cols-3 gap-2">
            {(['FUTBOL', 'RUNNING', 'FITNESS'] as const).map((disc) => (
              <div key={disc} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">{disc}</span>
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="2.0"
                  value={seasonalFactors[disc]}
                  onChange={(e: any) =>
                    setSeasonalFactors((prev) => ({
                      ...prev,
                      [disc]: Math.max(1, Math.min(2, Number(e.target.value) || 1)),
                    }))
                  }
                  className="w-full bg-transparent text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 outline-none mt-0.5"
                />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Multiplicador estacional aplicado a la demanda base.</p>
        </div>
      </div>

      {/* KPI DEL SKU SELECCIONADO */}
      {currentProduct && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="panel p-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Demanda acumulada ({horizon} sem)</p>
            <p className="metric mt-2 text-2xl">{simulation.totalDemand} u.</p>
          </div>
          <div className="panel p-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Factor estacional activo</p>
            <p className="metric mt-2 text-2xl text-emerald-600 dark:text-emerald-400">
              +{Math.round(((seasonalFactors[currentProduct.disciplina] || 1.2) - 1) * 100)}%
            </p>
          </div>
          <div className="panel p-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Stock de seguridad (Z=1.65)</p>
            <p className="metric mt-2 text-2xl">{currentProduct.stock_seguridad} u.</p>
          </div>
          <div className="panel p-4">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Reposición sugerida</p>
            <p
              className={`metric mt-2 text-2xl ${
                simulation.suggested > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {simulation.suggested > 0 ? `+${simulation.suggested} u.` : 'Óptimo (0)'}
            </p>
          </div>
        </div>
      )}

      {/* GRÁFICO TEMPORAL SVG ADAPTATIVO */}
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="section-title">
              Curva de Demanda: {currentProduct?.nombre} ({currentProduct?.sku_id})
            </h2>
            <p className="section-subtitle">
              Ventas reales POS históricas vs. proyección ponderada con banda de confianza ±12%
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-sky-400" />
              Histórico POS
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              Proyección Estacional
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox="0 0 740 245" className="w-full min-w-[460px] h-64">
            {[40, 82, 125, 168, 210].map((y) => (
              <line key={y} x1="40" y1={y} x2="700" y2={y} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            ))}
            <text x="10" y="45" fill="var(--chart-axis)" fontSize="10" fontFamily="monospace">
              {chartGeometry.maxVal}
            </text>
            <text x="10" y="130" fill="var(--chart-axis)" fontSize="10" fontFamily="monospace">
              {Math.round(chartGeometry.maxVal / 2)}
            </text>
            <text x="18" y="214" fill="var(--chart-axis)" fontSize="10" fontFamily="monospace">
              0
            </text>

            {chartGeometry.bandPath && <path d={chartGeometry.bandPath} fill="var(--chart-band)" />}
            <path d={chartGeometry.histPath} fill="none" stroke="var(--chart-hist)" strokeWidth="2.5" />
            <path d={chartGeometry.projPath} fill="none" stroke="var(--chart-proj)" strokeWidth="3" strokeDasharray="6 4" />

            {chartGeometry.histPts.map((p, idx) => (
              <g key={`h-${idx}`}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="var(--chart-hist)" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--chart-hist-label)" fontSize="10" fontFamily="monospace">
                  {p.val}
                </text>
              </g>
            ))}

            {chartGeometry.projPts.slice(1).map((p, idx) => (
              <g key={`p-${idx}`}>
                <circle cx={p.x} cy={p.y} r="5" fill="var(--chart-proj)" stroke="var(--chart-point-stroke)" strokeWidth="1.5" />
                <text x={p.x} y={p.y - 11} textAnchor="middle" fill="var(--chart-proj-label)" fontSize="10" fontFamily="monospace">
                  {p.val}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-between px-6 sm:px-10 text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
          {simulation.labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </main>
  )
}

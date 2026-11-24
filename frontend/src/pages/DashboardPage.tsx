import { useMemo, useState } from 'react'
import type { AuthUser, DashboardResponse } from '../services/api'
import type { CatalogProduct, PageId, ReplenishmentOrder } from '../types/inventory'
import { BRANCHES } from '../data/seedCatalog'
import { Icon } from '../components/Icons'

interface KpiItem {
  title: string
  value: string
  suffix?: string
  meta: string
  detail: string
  tone: string
  spark: string
}

function KpiCard({ item, onClick }: { item: KpiItem; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`panel kpi-card ${onClick ? 'cursor-pointer hover:border-emerald-500/50 transition-colors' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium">{item.title}</p>
        <span className={`mini-tag ${item.tone}`}>{item.meta}</span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="metric">{item.value}</span>
        {item.suffix && <span className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{item.suffix}</span>}
      </div>
      <div className="flex items-end justify-between mt-3">
        <p className="text-[11px] text-slate-500">{item.detail}</p>
        <svg viewBox="0 0 105 28" className={`sparkline ${item.tone}`}>
          <polyline points={item.spark} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

function ForecastChart({ weeks = 4 }: { weeks?: number }) {
  const pointCount = Math.max(4, Math.min(8, weeks))
  const labels = Array.from({ length: pointCount }, (_, idx) => `S${idx + 1}`)

  const projectionPoints = useMemo(() => {
    const startX = 48
    const endX = 590
    const stepX = pointCount > 1 ? (endX - startX) / (pointCount - 1) : 0
    return labels.map((label, i) => {
      const x = Math.round(startX + i * stepX)
      const ratio = i / Math.max(1, pointCount - 1)
      const projY = Math.round(178 - ratio * 116 - Math.sin(ratio * Math.PI) * 14)
      const histY = Math.round(186 - ratio * 48)
      return { label, x, projY, histY }
    })
  }, [pointCount, labels])

  const projPath = projectionPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.projY}`)
    .join(' ')
  const histPath = projectionPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.histY}`)
    .join(' ')

  return (
    <div className="panel p-4 sm:p-5 lg:p-6 flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Proyección de demanda · Running y Fútbol</h2>
          <p className="section-subtitle mt-0.5">Ventana de {weeks} semanas vs. capacidad de reposición</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <span className="bg-emerald-600 dark:bg-emerald-400 w-2 h-2 rounded-full inline-block" />
            Proyección IA
          </span>
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="bg-slate-400 dark:bg-slate-500 w-2 h-2 rounded-full inline-block" />
            Histórico
          </span>
        </div>
      </div>

      <div className="mt-6 relative overflow-x-auto">
        <svg viewBox="0 0 640 220" className="w-full min-w-[320px] h-48 sm:h-56">
          {[40, 80, 120, 160, 200].map((y) => (
            <line key={y} x1="30" y1={y} x2="620" y2={y} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          ))}
          <path d={histPath} fill="none" stroke="var(--chart-axis)" strokeWidth="2" strokeDasharray="4 4" />
          <path d={projPath} fill="none" stroke="var(--chart-proj)" strokeWidth="3" />
          {projectionPoints.map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.projY} r="4.5" fill="var(--chart-proj)" stroke="var(--chart-point-stroke)" strokeWidth="1.5" />
              <circle cx={p.x} cy={p.histY} r="3" fill="var(--chart-axis)" />
            </g>
          ))}
        </svg>
        <div className="flex justify-between text-[11px] text-slate-500 px-4 mt-2 font-mono">
          {projectionPoints.map((l) => (
            <span key={l.label}>Semana {l.label}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 gap-2">
        <span>
          Confianza algorítmica: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">94,2%</strong>
        </span>
        <span>Modelo: Suavizamiento exponencial estacional con factor retail</span>
      </div>
    </div>
  )
}

export function DashboardPage({
  user,
  dashboardData,
  products,
  orders,
  canApproveOrders,
  selectedBranch,
  setSelectedBranch,
  onResolveOrder,
  onApproveAllOrders,
  onOpenInsight,
  onTriggerDemo,
  onNavigate,
}: {
  user: AuthUser | null
  dashboardData: DashboardResponse | null
  products: CatalogProduct[]
  orders: ReplenishmentOrder[]
  canApproveOrders: boolean
  selectedBranch: string
  setSelectedBranch: (b: string) => void
  onResolveOrder: (orderId: string, status: 'APROBADA' | 'RECHAZADA') => void
  onApproveAllOrders: () => void
  onOpenInsight: () => void
  onTriggerDemo: () => void
  onNavigate: (page: PageId) => void
}) {
  const [horizonte, setHorizonte] = useState<number>(4)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const branchProducts = useMemo(
    () => products.filter((p) => selectedBranch === 'TODAS' || p.sucursal_id === selectedBranch),
    [products, selectedBranch]
  )

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.estado === 'PENDIENTE' &&
          (selectedBranch === 'TODAS' || o.sucursal_id === selectedBranch)
      ),
    [orders, selectedBranch]
  )

  const criticalCount = useMemo(
    () => branchProducts.filter((p) => p.stock_actual === 0 || p.stock_actual <= p.stock_minimo * 0.4).length,
    [branchProducts]
  )

  const estimatedReplacementCLP = useMemo(() => {
    const sum = pendingOrders.reduce((acc, o) => {
      const prod = products.find((p) => p.sku_id === o.sku_id)
      return acc + o.cantidad_sugerida * (prod?.precio || 39990)
    }, 0)
    return `$${(sum / 1000000).toFixed(1).replace('.', ',')}M`
  }, [pendingOrders, products])

  const currentKpis: KpiItem[] = useMemo(() => {
    const branchLabel =
      selectedBranch === 'TODAS'
        ? 'Red completa (30 SKUs)'
        : BRANCHES.find((b) => b.id === selectedBranch)?.nombre || selectedBranch

    const critVal =
      selectedBranch === 'TODAS' && dashboardData
        ? Math.max(criticalCount, dashboardData.kpis.skus_quiebre_critico)
        : criticalCount

    return [
      {
        title: 'SKUs en quiebre crítico',
        value: String(critVal),
        meta: selectedBranch !== 'TODAS' ? 'Filtrado' : 'Prioridad',
        detail: branchLabel,
        tone: 'red',
        spark: '5,24 18,22 31,23 44,15 58,17 72,8 87,10 100,4',
      },
      {
        title: 'Demanda proyectada',
        value:
          horizonte === 8
            ? '+24,8%'
            : horizonte === 2
            ? '+11,2%'
            : dashboardData?.kpis.demanda_proyectada_delta || '+18,5%',
        meta: `${horizonte} sem`,
        detail: 'Fútbol, Running & Fitness',
        tone: 'green',
        spark: '5,23 18,18 31,20 44,12 58,14 72,7 87,9 100,3',
      },
      {
        title: 'Órdenes sugeridas',
        value: String(pendingOrders.length),
        suffix: 'pendientes',
        meta: 'Revisar',
        detail: `${estimatedReplacementCLP} reposición est.`,
        tone: 'amber',
        spark: '5,20 18,20 31,15 44,17 58,10 72,12 87,8 100,7',
      },
      {
        title: 'Nivel de servicio de red',
        value: dashboardData?.kpis.nivel_servicio_red || '91,4%',
        meta: 'Meta ≥95%',
        detail: '−3,6 pts bajo objetivo',
        tone: 'slate',
        spark: '5,14 18,13 31,12 44,15 58,12 72,13 87,8 100,9',
      },
    ]
  }, [selectedBranch, dashboardData, criticalCount, horizonte, pendingOrders.length, estimatedReplacementCLP])

  const firstName = user ? user.nombre.split(' ')[0] : 'Matías'

  return (
    <main className="page-wrap">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Monitoreo Predictivo en Vivo</p>
          <h1 className="page-title">Buenos días, {firstName}</h1>
          <p className="page-subtitle">
            Cadena: <strong className="text-slate-900 dark:text-white">{user ? user.cadena_nombre : 'Marathon Sports Chile'}</strong> ·{' '}
            {branchProducts.filter((p) => p.stock_actual <= p.stock_minimo).length} SKUs requieren atención de reposición.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            onClick={onTriggerDemo}
            className="primary-button text-xs h-[38px] px-3.5"
          >
            <Icon name="spark" size={14} />
            Simular Flujo Predictivo
          </button>

          <div className="relative">
            <select
              value={selectedBranch}
              onChange={(e: any) => setSelectedBranch(e.target.value)}
              className="select-pill appearance-none pr-8 cursor-pointer outline-none"
            >
              <option value="TODAS">Todas las sucursales (3)</option>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} (LT {b.lead_time_dias}d)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-3 text-slate-400">
              <Icon name="chevron" size={14} />
            </div>
          </div>

          <div className="relative">
            <select
              value={horizonte}
              onChange={(e: any) => setHorizonte(Number(e.target.value))}
              className="select-pill appearance-none pr-8 cursor-pointer outline-none"
            >
              <option value={2}>Próximas 2 semanas</option>
              <option value={4}>Próximas 4 semanas</option>
              <option value={6}>Próximas 6 semanas</option>
              <option value={8}>Próximas 8 semanas</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-3 text-slate-400">
              <Icon name="chevron" size={14} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
        <KpiCard item={currentKpis[0]} onClick={() => onNavigate('inventory')} />
        <KpiCard item={currentKpis[1]} onClick={() => onNavigate('prediction')} />
        <KpiCard item={currentKpis[2]} onClick={() => onNavigate('replenishment')} />
        <KpiCard item={currentKpis[3]} onClick={() => onNavigate('audit')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <div className="xl:col-span-7 2xl:col-span-8">
          <ForecastChart weeks={horizonte} />
        </div>

        <div className="xl:col-span-5 2xl:col-span-4">
          <div className="panel h-full min-h-[360px] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
              <div>
                <h2 className="section-title">Reabastecimiento urgente</h2>
                <p className="section-subtitle">Priorizado por riesgo y lead time de sucursal</p>
              </div>
              <button
                onClick={onApproveAllOrders}
                disabled={pendingOrders.length === 0}
                title={canApproveOrders ? 'Aprobar todas las órdenes pendientes' : 'Requiere rol GERENTE_OPERACIONES'}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-500/25 dark:border-emerald-500/30 transition-all cursor-pointer shrink-0 disabled:opacity-40"
              >
                {canApproveOrders ? `Aprobar todas (${pendingOrders.length})` : `Solo Gerencia (${pendingOrders.length})`}
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800/80 flex-1 overflow-y-auto max-h-[340px]">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Todas las órdenes urgentes para esta vista fueron gestionadas.</p>
                  <button
                    onClick={() => onNavigate('replenishment')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    Ver historial completo en Bandeja de Reposición →
                  </button>
                </div>
              ) : (
                pendingOrders.map((item) => {
                  const isExpanded = expandedOrderId === item.id
                  const level = item.stock_actual <= 3 ? 'critical' : 'warning'
                  const formula = `Demanda esperada (${item.demanda_esperada}) + Seguridad (${item.stock_seguridad}) - Stock actual (${item.stock_actual}) = ${item.cantidad_sugerida} u.`
                  return (
                    <div key={item.id} className="p-4 lg:px-5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <div className="flex gap-3">
                        <span className={`risk-bar ${level}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">{item.nombre}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {item.sucursal_nombre} · <span className="font-mono">{item.sku_id}</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">+{item.cantidad_sugerida} u.</p>
                              <p className="text-[10px] text-slate-500">{item.confidence_score}% conf.</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="season-chip">{item.evento_estacional}</span>
                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : item.id)}
                              className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline cursor-pointer"
                            >
                              {isExpanded ? 'Ocultar fórmula' : 'Ver fórmula'}
                            </button>
                            <div className="ml-auto flex items-center gap-1.5">
                              <button
                                onClick={() => onResolveOrder(item.id, 'RECHAZADA')}
                                title="Rechazar orden"
                                className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 dark:bg-slate-800 dark:hover:bg-red-500/20 dark:text-slate-400 dark:hover:text-red-300 transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                              <button
                                onClick={() => onResolveOrder(item.id, 'APROBADA')}
                                className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:hover:bg-emerald-400/20 dark:border-emerald-500/20 transition-colors cursor-pointer"
                              >
                                Aprobar orden
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2.5 p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                              {formula}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
              <span className="text-[11px] text-slate-500 font-mono">
                {orders.filter((o) => o.estado === 'APROBADA').length} aprobadas · {pendingOrders.length} pendientes
              </span>
              <button
                onClick={() => onNavigate('replenishment')}
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                Abrir bandeja completa →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel mt-4 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center border-emerald-200 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50/90 to-white dark:from-slate-900 dark:to-[#0e1c18]">
        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 grid place-items-center shrink-0">
          <Icon name="spark" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Insight Predictivo de SportStockAI</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            La demanda de Running subirá un 35% por la Maratón de Santiago. Anticipar 2 semanas el reabastecimiento
            reduce el costo de quiebre en $4,2M CLP.
          </p>
        </div>
        <button
          onClick={onOpenInsight}
          className="secondary-button sm:ml-auto shrink-0 cursor-pointer text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
        >
          Ver análisis detallado →
        </button>
      </div>
    </main>
  )
}

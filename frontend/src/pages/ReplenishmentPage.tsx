import { useMemo, useState } from 'react'
import type { OrderStatus, ReplenishmentOrder } from '../types/inventory'
import { Icon } from '../components/Icons'

export function ReplenishmentPage({
  orders,
  canApproveOrders,
  onRequireLogin,
  onResolveOrder,
  onApproveAll,
  onRunPrediction,
}: {
  orders: ReplenishmentOrder[]
  canApproveOrders: boolean
  onRequireLogin: () => void
  onResolveOrder: (orderId: string, status: 'APROBADA' | 'RECHAZADA') => void
  onApproveAll: () => void
  onRunPrediction: () => void
}) {
  const [statusFilter, setStatusFilter] = useState<'TODAS' | OrderStatus>('TODAS')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const pendingCount = useMemo(() => orders.filter((o) => o.estado === 'PENDIENTE').length, [orders])
  const approvedCount = useMemo(() => orders.filter((o) => o.estado === 'APROBADA').length, [orders])
  const rejectedCount = useMemo(() => orders.filter((o) => o.estado === 'RECHAZADA').length, [orders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const matchStatus = statusFilter === 'TODAS' || o.estado === statusFilter
      const matchQuery =
        q === '' ||
        o.id.toLowerCase().includes(q) ||
        o.sku_id.toLowerCase().includes(q) ||
        o.nombre.toLowerCase().includes(q) ||
        o.sucursal_nombre.toLowerCase().includes(q)
      return matchStatus && matchQuery
    })
  }, [orders, statusFilter, search])

  return (
    <main className="page-wrap space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Ciclo de Vida de Órdenes (RBAC Gerencia)</p>
          <h1 className="page-title">Bandeja de Órdenes de Reposición</h1>
          <p className="page-subtitle">
            Sugerencias automáticas calculadas según demanda proyectada, stock de seguridad y lead time por sucursal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={canApproveOrders ? onRunPrediction : onRequireLogin}
            className="secondary-button text-xs h-[38px] px-3.5"
          >
            <Icon name={canApproveOrders ? 'refresh' : 'lock'} size={14} />
            Recalcular Sugerencias
          </button>
          <button
            onClick={canApproveOrders ? onApproveAll : onRequireLogin}
            disabled={pendingCount === 0}
            className="primary-button text-xs h-[38px] px-4"
          >
            <Icon name={canApproveOrders ? 'check' : 'lock'} size={15} />
            {canApproveOrders ? `Aprobar Todas (${pendingCount})` : 'Requiere Gerencia'}
          </button>
        </div>
      </div>

      {!canApproveOrders && (
        <div className="panel p-3.5 border-amber-300 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Icon name="lock" size={15} className="shrink-0" />
            <span>
              <strong>RBAC:</strong> Solo el perfil <strong>GERENTE_OPERACIONES</strong> puede aprobar o rechazar órdenes.
            </span>
          </div>
          <button onClick={onRequireLogin} className="primary-button h-[30px] px-3 text-xs">
            Iniciar como Gerente
          </button>
        </div>
      )}

      {/* FILTROS Y CONTADORES */}
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[230px]">
          <Icon name="search" size={15} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            placeholder="Buscar por ID de orden, SKU, producto o sucursal..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="tabs">
          {[
            { id: 'TODAS' as const, label: `Todas (${orders.length})` },
            { id: 'PENDIENTE' as const, label: `Pendientes (${pendingCount})` },
            { id: 'APROBADA' as const, label: `Aprobadas (${approvedCount})` },
            { id: 'RECHAZADA' as const, label: `Rechazadas (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={statusFilter === tab.id ? 'active font-semibold' : ''}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA DE ÓRDENES */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ID Orden</th>
                <th>Producto & SKU</th>
                <th>Sucursal & Lead Time</th>
                <th className="text-center">Stock / Mínimo</th>
                <th className="text-center">Cantidad Sugerida</th>
                <th>Fecha Sugerida</th>
                <th className="text-center">Estado</th>
                <th className="text-right">Acción Gerencial</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">
                    No hay órdenes registradas para el filtro actual.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const isExpanded = expandedId === o.id
                  const badgeTone =
                    o.estado === 'APROBADA' ? 'success' : o.estado === 'RECHAZADA' ? 'critical' : 'warning'
                  return (
                    <tr key={o.id}>
                      <td className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">{o.id.slice(0, 12)}</td>
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{o.nombre}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {o.sku_id} · {o.tipo} · {o.confidence_score}% conf.
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : o.id)}
                          className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline mt-0.5"
                        >
                          {isExpanded ? 'Ocultar desglose' : 'Ver fórmula'}
                        </button>
                        {isExpanded && (
                          <div className="mt-1.5 p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                            Demanda ({o.demanda_esperada}) + Seguridad ({o.stock_seguridad}) − Stock ({o.stock_actual}) ={' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">{o.cantidad_sugerida} u.</strong>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{o.sucursal_nombre}</div>
                        <div className="text-[10px] text-slate-500">Lead time: {o.lead_time} días</div>
                      </td>
                      <td className="text-center font-mono font-semibold text-red-600 dark:text-red-400">
                        {o.stock_actual} / {o.stock_minimo}
                      </td>
                      <td className="text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">+{o.cantidad_sugerida} u.</td>
                      <td className="font-mono text-slate-700 dark:text-slate-300">{o.fecha_pedido}</td>
                      <td className="text-center">
                        <span className={`status-badge ${badgeTone}`}>
                          <span className="badge-dot" />
                          {o.estado}
                        </span>
                      </td>
                      <td className="text-right">
                        {o.estado === 'PENDIENTE' ? (
                          canApproveOrders ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => onResolveOrder(o.id, 'APROBADA')}
                                className="primary-button h-[28px] px-2.5 text-[10px]"
                              >
                                ✓ Aprobar
                              </button>
                              <button
                                onClick={() => onResolveOrder(o.id, 'RECHAZADA')}
                                className="secondary-button min-h-[28px] px-2 text-[10px] hover:text-red-600 dark:hover:text-red-400 hover:border-red-400 dark:hover:border-red-500/40"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 inline-flex items-center gap-1">
                              <Icon name="lock" size={12} />
                              Solo Gerencia
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Auditada por Gerencia</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

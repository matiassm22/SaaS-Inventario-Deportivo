import { useMemo, useState } from 'react'
import type { CatalogProduct, ProductCategory } from '../types/inventory'
import { BRANCHES } from '../data/seedCatalog'
import { Icon } from '../components/Icons'

type CardFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export function InventoryPage({
  products,
  selectedBranch,
  setSelectedBranch,
  onReplenishProduct,
  onSimulateProduct,
}: {
  products: CatalogProduct[]
  selectedBranch: string
  setSelectedBranch: (b: string) => void
  onReplenishProduct: (product: CatalogProduct) => void
  onSimulateProduct: (skuId: string) => void
}) {
  const [cardFilter, setCardFilter] = useState<CardFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | ProductCategory>('Todos')
  const [disciplineFilter, setDisciplineFilter] = useState<'TODAS' | 'FUTBOL' | 'RUNNING' | 'FITNESS'>('TODAS')
  const [searchQuery, setSearchQuery] = useState('')

  const branchProducts = useMemo(
    () => products.filter((p) => selectedBranch === 'TODAS' || p.sucursal_id === selectedBranch),
    [products, selectedBranch]
  )

  const metrics = useMemo(() => {
    const totalItems = branchProducts.length
    const totalUnits = branchProducts.reduce((sum, p) => sum + p.stock_actual, 0)
    const lowStock = branchProducts.filter((p) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length
    const outOfStock = branchProducts.filter((p) => p.stock_actual === 0).length
    const valorInventario = branchProducts.reduce((sum, p) => sum + p.stock_actual * p.precio, 0)
    return { totalItems, totalUnits, lowStock, outOfStock, valorInventario }
  }, [branchProducts])

  const filteredProducts = useMemo(() => {
    return branchProducts.filter((p) => {
      const matchCat = categoryFilter === 'Todos' || p.tipo === categoryFilter
      const matchDisc = disciplineFilter === 'TODAS' || p.disciplina === disciplineFilter
      const q = searchQuery.trim().toLowerCase()
      const matchSearch =
        q === '' ||
        p.nombre.toLowerCase().includes(q) ||
        p.sku_id.toLowerCase().includes(q) ||
        p.tipo.toLowerCase().includes(q)

      let matchCard = true
      if (cardFilter === 'IN_STOCK') matchCard = p.stock_actual > 0
      else if (cardFilter === 'LOW_STOCK') matchCard = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo
      else if (cardFilter === 'OUT_OF_STOCK') matchCard = p.stock_actual === 0

      return matchCat && matchDisc && matchSearch && matchCard
    })
  }, [branchProducts, categoryFilter, disciplineFilter, searchQuery, cardFilter])

  return (
    <main className="page-wrap space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Control Multi-Sucursal</p>
          <h1 className="page-title">Catálogo e Inventario en Góndola</h1>
          <p className="page-subtitle">
            30 SKUs deportivos categorizados en Fútbol, Running y Fitness con umbrales de reposición.
          </p>
        </div>

        <div className="relative self-start lg:self-auto">
          <select
            value={selectedBranch}
            onChange={(e: any) => setSelectedBranch(e.target.value)}
            className="select-pill appearance-none pr-8 cursor-pointer outline-none"
          >
            <option value="TODAS">Red Nacional Completa (3 sucursales)</option>
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} (Lead time: {b.lead_time_dias}d)
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-3 text-slate-400">
            <Icon name="chevron" size={14} />
          </div>
        </div>
      </div>

      {/* 4 TARJETAS KPI INTERACTIVAS CLICKEABLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => setCardFilter('ALL')}
          className={`panel p-5 text-left transition-all cursor-pointer ${
            cardFilter === 'ALL'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/5 border-emerald-400 dark:border-emerald-500/40'
              : 'hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Productos en catálogo</span>
            <span className="mini-tag green">{cardFilter === 'ALL' ? 'Activo' : 'Todos'}</span>
          </div>
          <div className="metric mt-3">{metrics.totalItems}</div>
          <p className="text-[11px] text-slate-500 mt-2">Calzado, Ropa y Accesorios</p>
        </button>

        <button
          onClick={() => setCardFilter(cardFilter === 'IN_STOCK' ? 'ALL' : 'IN_STOCK')}
          className={`panel p-5 text-left transition-all cursor-pointer ${
            cardFilter === 'IN_STOCK'
              ? 'ring-2 ring-sky-500 bg-sky-50/70 dark:bg-sky-500/5 border-sky-400 dark:border-sky-500/40'
              : 'hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Unidades en stock</span>
            <span className="mini-tag slate">{cardFilter === 'IN_STOCK' ? 'Filtrando' : 'Con Stock'}</span>
          </div>
          <div className="metric mt-3">{metrics.totalUnits.toLocaleString('es-CL')}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Valorización:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
              ${(metrics.valorInventario / 1000000).toFixed(1)}M
            </strong>{' '}
            CLP
          </p>
        </button>

        <button
          onClick={() => setCardFilter(cardFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`panel p-5 text-left transition-all cursor-pointer ${
            cardFilter === 'LOW_STOCK'
              ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/40'
              : 'hover:border-amber-400 dark:hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Bajo el mínimo</span>
            <span className="mini-tag amber">{cardFilter === 'LOW_STOCK' ? 'Filtrando' : 'Alerta'}</span>
          </div>
          <div className="metric text-amber-600 dark:text-amber-400 mt-3">{metrics.lowStock}</div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-2">Requiere reposición preventiva</p>
        </button>

        <button
          onClick={() => setCardFilter(cardFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
          className={`panel p-5 text-left transition-all cursor-pointer ${
            cardFilter === 'OUT_OF_STOCK'
              ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-500/10 border-red-400 dark:border-red-500/40'
              : 'hover:border-red-400 dark:hover:border-red-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-red-700 dark:text-red-300">Agotados / Quiebre</span>
            <span className="mini-tag red">{cardFilter === 'OUT_OF_STOCK' ? 'Filtrando' : 'Crítico'}</span>
          </div>
          <div className="metric text-red-600 dark:text-red-400 mt-3">{metrics.outOfStock}</div>
          <p className="text-[11px] text-red-700/80 dark:text-red-400/80 mt-2">0 unidades disponibles</p>
        </button>
      </div>

      {/* BANNER DE FILTRO ACTIVO */}
      {cardFilter !== 'ALL' && (
        <div className="panel p-3.5 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <Icon name="info" size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              Filtro activo:{' '}
              <strong>
                {cardFilter === 'IN_STOCK'
                  ? 'Productos con existencias (> 0)'
                  : cardFilter === 'LOW_STOCK'
                  ? 'Productos bajo el stock mínimo'
                  : 'Productos agotados (0 unidades)'}
              </strong>{' '}
              ({filteredProducts.length} resultados)
            </span>
          </div>
          <button onClick={() => setCardFilter('ALL')} className="secondary-button text-xs py-1">
            <Icon name="x" size={14} />
            Quitar filtro
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Icon name="search" size={15} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por producto, SKU o categoría..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Categoría:</span>
          {(['Todos', 'Calzado', 'Ropa', 'Accesorios'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Disciplina:</span>
          <div className="tabs">
            {(['TODAS', 'FUTBOL', 'RUNNING', 'FITNESS'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDisciplineFilter(d)}
                className={disciplineFilter === d ? 'active font-semibold' : ''}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLA DE INVENTARIO */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Producto & SKU</th>
                <th>Categoría</th>
                <th>Disciplina</th>
                <th className="text-right">Precio Unitario</th>
                <th>Stock vs. Mínimo</th>
                <th className="text-center">Venta Semanal</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No hay productos coincidentes</p>
                    <p className="text-xs text-slate-500 mt-1">Ajusta o limpia los filtros para ver el catálogo.</p>
                    <button
                      onClick={() => {
                        setCardFilter('ALL')
                        setSearchQuery('')
                        setCategoryFilter('Todos')
                        setDisciplineFilter('TODAS')
                      }}
                      className="primary-button text-xs mt-3"
                    >
                      Restablecer filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isAgotado = p.stock_actual === 0
                  const isBajoMin = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo
                  const isSobrestock = p.stock_actual > p.stock_minimo * 2.5

                  const maxRef = Math.max(p.stock_minimo * 2, p.stock_actual, 1)
                  const fillPercent = Math.min(100, Math.round((p.stock_actual / maxRef) * 100))

                  const barColor = isAgotado
                    ? 'bg-red-500'
                    : isBajoMin
                    ? 'bg-amber-500'
                    : isSobrestock
                    ? 'bg-sky-500'
                    : 'bg-emerald-500'

                  const badgeTone = isAgotado ? 'critical' : isBajoMin ? 'warning' : 'success'
                  const estadoLabel = isAgotado
                    ? 'Agotado'
                    : isBajoMin
                    ? 'Bajo mínimo'
                    : isSobrestock
                    ? 'Sobrestock'
                    : 'En stock'

                  const branchName = BRANCHES.find((b) => b.id === p.sucursal_id)?.codigo || p.sucursal_id

                  return (
                    <tr key={p.sku_id}>
                      <td>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{p.nombre}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.sku_id} · {branchName}
                        </div>
                      </td>
                      <td className="text-slate-700 dark:text-slate-300">{p.tipo}</td>
                      <td>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                          {p.disciplina}
                        </span>
                      </td>
                      <td className="text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        ${p.precio.toLocaleString('es-CL')}
                      </td>
                      <td>
                        <div className="flex items-center gap-3 w-44">
                          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${Math.max(isAgotado ? 5 : 10, fillPercent)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {p.stock_actual} / {p.stock_minimo}
                          </span>
                        </div>
                      </td>
                      <td className="text-center font-mono text-slate-500 dark:text-slate-400">~{p.ventas_semanales_base} u/sem</td>
                      <td>
                        <span className={`status-badge ${badgeTone}`}>
                          <span className="badge-dot" />
                          {estadoLabel}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onSimulateProduct(p.sku_id)}
                            title="Simular demanda en Motor Predictivo"
                            className="secondary-button text-[10px] min-h-[28px] px-2.5"
                          >
                            Simular
                          </button>
                          {(isAgotado || isBajoMin) && (
                            <button
                              onClick={() => onReplenishProduct(p)}
                              className="primary-button h-[28px] px-2.5 text-[10px]"
                            >
                              Reponer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3.5 px-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Mostrando <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> de {branchProducts.length} SKUs
          </span>
          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">SportStockAI · Catálogo Multi-Sucursal</span>
        </div>
      </div>
    </main>
  )
}

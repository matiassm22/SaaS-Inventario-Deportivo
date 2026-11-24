import { useMemo, useState } from 'react'
import { api } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import type { CatalogProduct, TeamMember } from '../types/inventory'
import { BRANCHES } from '../data/seedCatalog'
import { Icon } from '../components/Icons'
import { AdjustCountModal, TeamModal } from '../components/Modals'

type KpiFilter = 'ALL' | 'CRITICO' | 'PREVENTIVO' | 'OPTIMO'
type StatusTab = 'ALL' | 'CONFIRMADOS' | 'PENDIENTES'

export function StoreAppPage({
  products,
  teamMembers,
  responsibleName,
  canAdjustStore,
  onRequireLogin,
  onConfirmStockCount,
  onShowToast,
}: {
  products: CatalogProduct[]
  teamMembers: TeamMember[]
  responsibleName: string
  canAdjustStore: boolean
  onRequireLogin: () => void
  onConfirmStockCount: (skuId: string, newStock: number | null, responsible: string) => void
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
}) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const [selectedBranchId, setSelectedBranchId] = useState<string>('SUC-01')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKPI, setFilterKPI] = useState<KpiFilter>('ALL')
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL')
  const [scannedSku, setScannedSku] = useState('')
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [isPhoneFrame, setIsPhoneFrame] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [modalItem, setModalItem] = useState<CatalogProduct | null>(null)

  const currentBranch = useMemo(
    () => BRANCHES.find((b) => b.id === selectedBranchId) || BRANCHES[0],
    [selectedBranchId]
  )

  const branchItems = useMemo(() => {
    const inBranch = products.filter((p) => p.sucursal_id === selectedBranchId)
    return inBranch.length > 0 ? inBranch : products
  }, [products, selectedBranchId])

  const counts = useMemo(() => {
    const criticos = branchItems.filter((p) => p.stock_actual === 0 || p.stock_actual <= p.stock_minimo * 0.5).length
    const preventivos = branchItems.filter(
      (p) => p.stock_actual > p.stock_minimo * 0.5 && p.stock_actual <= p.stock_minimo
    ).length
    const optimos = branchItems.filter((p) => p.stock_actual > p.stock_minimo).length
    const confirmados = branchItems.filter((p) => p.conteo_confirmado).length
    return { criticos, preventivos, optimos, confirmados, total: branchItems.length }
  }, [branchItems])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return branchItems.filter((p) => {
      const matchSearch =
        q === '' ||
        p.nombre.toLowerCase().includes(q) ||
        p.sku_id.toLowerCase().includes(q) ||
        p.disciplina.toLowerCase().includes(q)

      const isCrit = p.stock_actual === 0 || p.stock_actual <= p.stock_minimo * 0.5
      const isPrev = p.stock_actual > p.stock_minimo * 0.5 && p.stock_actual <= p.stock_minimo
      const isOpt = p.stock_actual > p.stock_minimo

      let matchKpi = true
      if (filterKPI === 'CRITICO') matchKpi = isCrit
      else if (filterKPI === 'PREVENTIVO') matchKpi = isPrev
      else if (filterKPI === 'OPTIMO') matchKpi = isOpt

      let matchStatus = true
      if (statusTab === 'CONFIRMADOS') matchStatus = p.conteo_confirmado
      else if (statusTab === 'PENDIENTES') matchStatus = !p.conteo_confirmado

      return matchSearch && matchKpi && matchStatus
    })
  }, [branchItems, searchQuery, filterKPI, statusTab])

  const handleQuickConfirm = async (item: CatalogProduct) => {
    if (!canAdjustStore) {
      onShowToast('Inicia sesión como JEFE_TIENDA o GERENTE_OPERACIONES para confirmar stock.', 'warning')
      onRequireLogin()
      return
    }
    onConfirmStockCount(item.sku_id, null, responsibleName)
  }

  const handleAdjustConfirm = async (skuId: string, newCount: number) => {
    if (!canAdjustStore) {
      onShowToast('Inicia sesión como JEFE_TIENDA o GERENTE_OPERACIONES para ajustar stock.', 'warning')
      onRequireLogin()
      return
    }
    onConfirmStockCount(skuId, newCount, responsibleName)
    setModalItem(null)
  }

  const handleSimulateScan = (skuToScan?: string) => {
    const target = (skuToScan || scannedSku).trim().toUpperCase()
    if (!target) return

    setScanning(true)
    setScanMessage(null)

    setTimeout(async () => {
      setScanning(false)
      const found = products.find((i) => i.sku_id.toUpperCase() === target)
      if (found) {
        onConfirmStockCount(found.sku_id, null, responsibleName)
        setScanMessage(`✓ Código ${found.sku_id} verificado. "${found.nombre}" confirmado en góndola.`)
        onShowToast(`Escaneo verificado: ${found.sku_id}`, 'success')
        await api.recordStoreSale(found.sku_id, 0)
      } else {
        setScanMessage(`El código ${target} no corresponde a un SKU registrado en el catálogo.`)
      }
    }, 550)
  }

  return (
    <main className="page-wrap">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Módulo de Sala de Ventas</p>
          <h1 className="page-title">SportStock Móvil — Modo Tienda</h1>
          <p className="page-subtitle">
            Semáforo en tiempo real, conteo físico con ajuste manual, trazabilidad de turno y lector de código de barras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPhoneFrame((v) => !v)}
            className="hidden lg:inline-flex secondary-button text-xs h-[38px]"
          >
            <Icon name="store" size={14} />
            {isPhoneFrame ? 'Vista Expandida' : 'Vista Smartphone'}
          </button>

          <select
            value={selectedBranchId}
            onChange={(e: any) => setSelectedBranchId(e.target.value)}
            className="select-pill outline-none cursor-pointer"
          >
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 items-start">
        {/* COLUMNA IZQUIERDA: APP MÓVIL EN TIENDA (MODO CLARO Y OSCURO EN PANTALLA INTERNA) */}
        <div className={`${isPhoneFrame ? 'lg:col-span-6 flex justify-center' : 'lg:col-span-7'}`}>
          <div
            className={`w-full transition-all duration-300 ${
              isPhoneFrame
                ? 'max-w-[405px] h-[790px] bg-slate-900 rounded-[46px] p-3 border-[3px] border-slate-700 shadow-2xl flex flex-col'
                : 'panel p-4 sm:p-5 flex flex-col'
            }`}
          >
            <div
              className={`w-full flex-1 flex flex-col overflow-hidden transition-colors ${
                isPhoneFrame
                  ? 'bg-[#f8fafc] dark:bg-[#0b0f19] rounded-[36px] border border-slate-200 dark:border-slate-800/80'
                  : ''
              }`}
            >
              {/* Status bar iPhone cuando hay marco */}
              {isPhoneFrame && (
                <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-800 dark:text-slate-300 shrink-0 select-none border-b border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-transparent">
                  <span className="font-bold">09:42</span>
                  <div className="w-20 h-5 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-end px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400">5G · 100%</span>
                </div>
              )}

              {/* Contenido scrollable de la app móvil */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      SPORTSTOCK AI · MÓVIL TIENDA
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight truncate">
                      {currentBranch.nombre}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={toggleTheme}
                      title={resolvedTheme === 'dark' ? 'Modo Claro en Tienda' : 'Modo Oscuro en Tienda'}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 grid place-items-center transition-colors"
                    >
                      <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={14} />
                    </button>
                    <button
                      onClick={() => setShowTeamModal(true)}
                      className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center gap-1"
                    >
                      <Icon name="users" size={12} />
                      Turno ({teamMembers.length})
                    </button>
                  </div>
                </div>

                {/* Buscador */}
                <div className="relative">
                  <Icon name="search" size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e: any) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto, SKU o disciplina..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Banner Último Inventario & Responsable */}
                <div className="rounded-xl bg-emerald-50/80 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/25 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      Último Inventario Realizado
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">23 Nov, 09:42 hrs</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/70 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 truncate">
                      Encargado: <strong className="text-slate-900 dark:text-white">{responsibleName}</strong>
                    </span>
                    <button
                      onClick={() => setShowTeamModal(true)}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium shrink-0 ml-2"
                    >
                      Ver equipo →
                    </button>
                  </div>
                </div>

                {/* 3 Tarjetas KPI Clickeables */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFilterKPI(filterKPI === 'CRITICO' ? 'ALL' : 'CRITICO')}
                    className={`rounded-xl p-2.5 text-left border transition-all ${
                      filterKPI === 'CRITICO'
                        ? 'bg-red-50 border-red-500 ring-1 ring-red-500 dark:bg-red-500/15'
                        : 'bg-white border-slate-200 hover:border-red-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-red-500/40'
                    }`}
                  >
                    <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400">{counts.criticos}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Críticos</div>
                  </button>

                  <button
                    onClick={() => setFilterKPI(filterKPI === 'PREVENTIVO' ? 'ALL' : 'PREVENTIVO')}
                    className={`rounded-xl p-2.5 text-left border transition-all ${
                      filterKPI === 'PREVENTIVO'
                        ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 dark:bg-amber-500/15'
                        : 'bg-white border-slate-200 hover:border-amber-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-amber-500/40'
                    }`}
                  >
                    <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{counts.preventivos}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Preventivos</div>
                  </button>

                  <button
                    onClick={() => setFilterKPI(filterKPI === 'OPTIMO' ? 'ALL' : 'OPTIMO')}
                    className={`rounded-xl p-2.5 text-left border transition-all ${
                      filterKPI === 'OPTIMO'
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 dark:bg-emerald-500/15'
                        : 'bg-white border-slate-200 hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{counts.optimos}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Óptimos</div>
                  </button>
                </div>

                {/* Pestañas Todas / Confirmados / Pendientes */}
                <div className="tabs w-full">
                  <button
                    onClick={() => setStatusTab('ALL')}
                    className={`flex-1 ${statusTab === 'ALL' ? 'active font-semibold' : ''}`}
                  >
                    Todas ({counts.total})
                  </button>
                  <button
                    onClick={() => setStatusTab('CONFIRMADOS')}
                    className={`flex-1 ${
                      statusTab === 'CONFIRMADOS' ? 'active font-semibold text-emerald-700 dark:text-emerald-400' : ''
                    }`}
                  >
                    ✓ Confirmados ({counts.confirmados})
                  </button>
                  <button
                    onClick={() => setStatusTab('PENDIENTES')}
                    className={`flex-1 ${
                      statusTab === 'PENDIENTES' ? 'active font-semibold text-amber-700 dark:text-amber-400' : ''
                    }`}
                  >
                    Pendientes ({counts.total - counts.confirmados})
                  </button>
                </div>

                {/* Lista de tarjetas en sala */}
                <div className="space-y-2.5">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No hay productos para este filtro.{' '}
                      <button
                        onClick={() => {
                          setFilterKPI('ALL')
                          setStatusTab('ALL')
                          setSearchQuery('')
                        }}
                        className="text-emerald-600 dark:text-emerald-400 underline"
                      >
                        Restablecer
                      </button>
                    </div>
                  ) : (
                    filteredItems.map((item) => {
                      const isCrit = item.stock_actual === 0 || item.stock_actual <= item.stock_minimo * 0.5
                      const isPrev = !isCrit && item.stock_actual <= item.stock_minimo
                      const badgeTone = isCrit ? 'critical' : isPrev ? 'warning' : 'success'
                      const badgeLabel = isCrit ? 'Crítico' : isPrev ? 'Preventivo' : 'Óptimo'

                      return (
                        <div
                          key={item.sku_id}
                          className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                                {item.nombre}
                              </span>
                              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                {item.sku_id} · {item.disciplina}
                              </p>
                            </div>
                            <span className={`status-badge ${badgeTone} shrink-0`}>{badgeLabel}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950/70 rounded-lg px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-800/70">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400">
                              {item.conteo_confirmado ? '✓ Conteo confirmado' : '⏳ Pendiente conteo'}
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                              {item.stock_actual} u.{' '}
                              <span className="text-slate-500 font-normal">/ mín. {item.stock_minimo}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">{item.auditado_por || 'Pendiente conteo por encargado'}</span>
                            <span className="font-mono shrink-0 ml-2">{item.fecha_conteo || 'Turno actual'}</span>
                          </div>

                          {item.conteo_confirmado ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                ✓ Verificado en rack
                              </div>
                              <button
                                onClick={() => setModalItem(item)}
                                className="secondary-button min-h-[30px] px-2.5 text-[10px]"
                              >
                                Reajustar
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleQuickConfirm(item)}
                                className="primary-button h-[32px] text-[11px]"
                              >
                                ✓ Confirmar Stock
                              </button>
                              <button
                                onClick={() => setModalItem(item)}
                                className="secondary-button min-h-[32px] text-[11px]"
                              >
                                Ajustar Conteo
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Barra inferior móvil */}
              <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="live-dot" />
                  Sincronizado en vivo
                </span>
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Equipo ({teamMembers.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LECTOR DE CÓDIGO DE BARRAS FÍSICO */}
        <div className={`${isPhoneFrame ? 'lg:col-span-6' : 'lg:col-span-5'} panel p-4 sm:p-6 flex flex-col justify-between`}>
          <div>
            <h2 className="section-title">Lector de código de barras físico</h2>
            <p className="section-subtitle mt-0.5">
              Simulador interactivo EAN-13 / Code-128 integrado con el catálogo de {products.length} SKUs y la API.
            </p>

            {/* Visor óptico oscuro realista para contraste del láser */}
            <div className="scanner-frame mt-4">
              <div className="scanner-line" />
              <div className="text-center px-4 z-10">
                <Icon name="barcode" size={44} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-200 font-semibold tracking-wider">
                  {scanning ? 'LEYENDO CÓDIGO...' : 'VISOR ÓPTICO ACTIVO'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Apunta el lector láser o usa los atajos rápidos</p>
              </div>
            </div>

            {scanMessage && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs leading-relaxed ${
                  scanMessage.startsWith('✓')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300'
                    : 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300'
                }`}
              >
                {scanMessage}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">Simular lectura de código de barras:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedSku}
                  onChange={(e: any) => setScannedSku(e.target.value)}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter') handleSimulateScan()
                  }}
                  placeholder="Ej: RUN-001, FB-001, FT-026"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none uppercase font-mono focus:border-emerald-500"
                />
                <button
                  onClick={() => handleSimulateScan()}
                  disabled={scanning || !scannedSku}
                  className="primary-button text-xs py-1.5 px-3 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {scanning ? 'Escaneando...' : 'Escanear'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <span className="text-[10px] text-slate-500 self-center">Atajos:</span>
                {['RUN-001', 'RUN-008', 'FB-001', 'FUT-023', 'FT-026'].map((sku) => (
                  <button
                    key={sku}
                    onClick={() => {
                      setScannedSku(sku)
                      handleSimulateScan(sku)
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {sku}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center mt-6">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Cámara activa</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sin latencia</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Doble vía</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Nube en vivo</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Trazabilidad</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Auditoría turno</p>
            </div>
          </div>
        </div>
      </div>

      <TeamModal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} teamMembers={teamMembers} />
      <AdjustCountModal
        item={modalItem}
        responsibleName={responsibleName}
        onClose={() => setModalItem(null)}
        onConfirm={handleAdjustConfirm}
      />
    </main>
  )
}

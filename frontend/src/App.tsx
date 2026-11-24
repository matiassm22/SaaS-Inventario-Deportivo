import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, type AuthUser, type DashboardResponse } from './services/api'
import { useTheme, type ThemePreference } from './context/ThemeContext'
import type {
  BatchAuditRow,
  CatalogProduct,
  EmployeeAuditLog,
  PageId,
  ProductCategory,
  ReplenishmentOrder,
} from './types/inventory'
import {
  BRANCHES,
  INITIAL_BATCH_ROWS,
  INITIAL_CATALOG,
  INITIAL_EMPLOYEE_AUDIT_LOGS,
  INITIAL_ORDERS,
  TEAM_MEMBERS,
} from './data/seedCatalog'
import { Icon, Logo, type IconName } from './components/Icons'
import { GherkinDemoModal, InsightModal, LoginModal, SearchModal } from './components/Modals'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { PredictionPage } from './pages/PredictionPage'
import { ReplenishmentPage } from './pages/ReplenishmentPage'
import { StoreAppPage } from './pages/StoreAppPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { AuditPage } from './pages/AuditPage'
import { SettingsPage } from './pages/SettingsPage'

const STORAGE_KEYS = {
  products: 'sportstock_fused_catalog_v1',
  orders: 'sportstock_fused_orders_v1',
  audit: 'sportstock_fused_audit_v1',
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function mapApiProduct(raw: any): CatalogProduct {
  const disc = raw.disciplina === 'FUTBOL' || raw.disciplina === 'RUNNING' || raw.disciplina === 'FITNESS'
    ? raw.disciplina
    : 'FITNESS'
  const tipo: ProductCategory =
    raw.tipo === 'Calzado' || raw.tipo === 'Ropa' || raw.tipo === 'Accesorios' ? raw.tipo : 'Accesorios'
  return {
    sku_id: raw.sku_codigo || raw.sku_id,
    nombre: raw.nombre || raw.sku_codigo,
    tipo,
    disciplina: disc,
    precio: Number(raw.precio ?? 0),
    stock_actual: Number(raw.stock_actual ?? 0),
    stock_minimo: Number(raw.stock_minimo ?? 10),
    stock_seguridad: Number(raw.stock_seguridad ?? 4),
    ventas_semanales_base: Number(raw.ventas_semanales_base ?? 10),
    sucursal_id: raw.sucursal_codigo || raw.sucursal_id || 'SUC-01',
    conteo_confirmado: Boolean(raw.conteo_confirmado),
    fecha_conteo: raw.fecha_conteo,
    auditado_por: raw.auditado_por,
    canal_ingesta: raw.canal_ingesta || 'API REST',
  }
}

function mapApiOrder(raw: any): ReplenishmentOrder {
  const disc = raw.disciplina === 'FUTBOL' || raw.disciplina === 'RUNNING' || raw.disciplina === 'FITNESS'
    ? raw.disciplina
    : 'FITNESS'
  const tipo: ProductCategory =
    raw.tipo === 'Calzado' || raw.tipo === 'Ropa' || raw.tipo === 'Accesorios' ? raw.tipo : 'Accesorios'
  const estado = raw.estado === 'APROBADA' || raw.estado === 'RECHAZADA' ? raw.estado : 'PENDIENTE'
  return {
    id: raw.id,
    sku_id: raw.sku_codigo || raw.sku_id,
    nombre: raw.nombre_producto || raw.nombre || raw.sku_codigo,
    tipo,
    disciplina: disc,
    sucursal_id: raw.sucursal_codigo || raw.sucursal_id || 'SUC-01',
    sucursal_nombre: raw.sucursal_nombre || 'Sucursal',
    stock_actual: Number(raw.stock_actual ?? raw.formula_desglose?.stock_actual ?? 0),
    stock_minimo: Number(raw.stock_minimo ?? 10),
    stock_seguridad: Number(raw.formula_desglose?.stock_seguridad ?? 4),
    demanda_esperada: Number(raw.formula_desglose?.demanda_esperada ?? raw.cantidad_sugerida ?? 0),
    cantidad_sugerida: Number(raw.cantidad_sugerida ?? 0),
    fecha_pedido: raw.fecha_pedido_sugerida || raw.fecha_pedido || new Date().toISOString().slice(0, 10),
    estado,
    lead_time: Number(raw.lead_time_dias ?? raw.lead_time ?? 2),
    confidence_score: Number(raw.confidence_score ?? 90),
    evento_estacional: raw.evento_estacional || 'Pronóstico estacional',
  }
}

const NAV_PLATFORM: Array<{ id: PageId; label: string; icon: IconName }> = [
  { id: 'dashboard', label: 'Vista general', icon: 'home' },
  { id: 'inventory', label: 'Inventario', icon: 'box' },
  { id: 'prediction', label: 'Predicción', icon: 'activity' },
  { id: 'replenishment', label: 'Órdenes sugeridas', icon: 'layers' },
]

const NAV_OPERATIONS: Array<{ id: PageId; label: string; icon: IconName }> = [
  { id: 'store', label: 'Operación tienda', icon: 'store' },
  { id: 'integration', label: 'Integraciones & POS', icon: 'database' },
  { id: 'audit', label: 'Auditoría & Equipo', icon: 'users' },
  { id: 'settings', label: 'Configuración', icon: 'settings' },
]

function Sidebar({
  page,
  setPage,
  pendingOrdersCount,
  productCount,
  user,
  onOpenLogin,
  onLogout,
}: {
  page: PageId
  setPage: (p: PageId) => void
  pendingOrdersCount: number
  productCount: number
  user: AuthUser | null
  onOpenLogin: () => void
  onLogout: () => void
}) {
  const userInitials = user
    ? user.nombre
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AN'

  return (
    <aside className="hidden xl:flex w-[240px] shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-[var(--bg-sidebar)] flex-col p-4 sticky top-0 h-screen transition-colors">
      <div className="h-12 flex items-center px-2 mb-4">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-0.5">
        <div>
          <p className="eyebrow px-3 mb-2">Plataforma</p>
          <nav className="space-y-1">
            {NAV_PLATFORM.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`nav-item cursor-pointer ${page === item.id ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={17} />
                <span className="truncate">
                  {item.id === 'inventory' ? `Inventario (${productCount})` : item.label}
                </span>
                {item.id === 'replenishment' && pendingOrdersCount > 0 && (
                  <span className="nav-count">{pendingOrdersCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <p className="eyebrow px-3 mb-2">Operación y Control</p>
          <nav className="space-y-1">
            {NAV_OPERATIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`nav-item cursor-pointer ${page === item.id ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={17} />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
          <span className="live-dot" />
          Motor predictivo
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">
          Tenant: <span className="text-slate-900 dark:text-white font-medium">{user ? user.cadena_nombre : 'Marathon Sports'}</span>
        </p>
      </div>

      <div className="flex items-center gap-3 px-2 pt-4 mt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="avatar">{userInitials}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{user ? user.nombre : 'Sin sesión'}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user ? user.rol : 'Modo consulta'}</p>
        </div>
        {user ? (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="ml-auto text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer p-1"
          >
            <Icon name="logout" size={16} />
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            title="Iniciar sesión"
            className="ml-auto text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer p-1"
          >
            <Icon name="user" size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}

function MobileDrawer({
  isOpen,
  onClose,
  page,
  setPage,
  pendingOrdersCount,
  productCount,
  user,
  onOpenLogin,
  onLogout,
}: {
  isOpen: boolean
  onClose: () => void
  page: PageId
  setPage: (p: PageId) => void
  pendingOrdersCount: number
  productCount: number
  user: AuthUser | null
  onOpenLogin: () => void
  onLogout: () => void
}) {
  const { theme, setTheme } = useTheme()

  if (!isOpen) return null

  const themeOptions: Array<{ id: ThemePreference; label: string; icon: IconName }> = [
    { id: 'light', label: 'Claro', icon: 'sun' },
    { id: 'dark', label: 'Oscuro', icon: 'moon' },
    { id: 'system', label: 'Auto', icon: 'monitor' },
  ]

  return (
    <div className="fixed inset-0 z-50 xl:hidden flex">
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-72 max-w-[82vw] bg-[var(--bg-sidebar)] border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 z-10 overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <Logo />
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <Icon name="x" size={20} />
          </button>
        </div>

        <p className="eyebrow px-3 mt-4 mb-2">Plataforma</p>
        <nav className="space-y-1">
          {NAV_PLATFORM.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id)
                onClose()
              }}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.id === 'inventory' ? `Inventario (${productCount})` : item.label}</span>
              {item.id === 'replenishment' && pendingOrdersCount > 0 && (
                <span className="nav-count">{pendingOrdersCount}</span>
              )}
            </button>
          ))}
        </nav>

        <p className="eyebrow px-3 mt-5 mb-2">Operación y Control</p>
        <nav className="space-y-1">
          {NAV_OPERATIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id)
                onClose()
              }}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="eyebrow px-1 mb-2">Apariencia</p>
          <div className="tabs w-full">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={`flex-1 flex items-center justify-center gap-1 ${theme === opt.id ? 'active font-semibold' : ''}`}
              >
                <Icon name={opt.icon} size={12} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="avatar">{user ? user.nombre[0] : 'U'}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user ? user.nombre : 'Usuario Invitado'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user ? user.rol : 'Sin sesión iniciada'}</p>
            </div>
          </div>
          {user ? (
            <button
              onClick={() => {
                onLogout()
                onClose()
              }}
              className="w-full secondary-button text-xs py-2 justify-center text-red-600 dark:text-red-400"
            >
              <Icon name="logout" size={14} />
              Cerrar sesión
            </button>
          ) : (
            <button
              onClick={() => {
                onClose()
                onOpenLogin()
              }}
              className="w-full primary-button text-xs py-2 justify-center"
            >
              <Icon name="user" size={14} />
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Topbar({
  page,
  setPage,
  user,
  onOpenLogin,
  onLogout,
  onOpenSearch,
  onOpenMobileMenu,
}: {
  page: PageId
  setPage: (p: PageId) => void
  user: AuthUser | null
  onOpenLogin: () => void
  onLogout: () => void
  onOpenSearch: () => void
  onOpenMobileMenu: () => void
}) {
  const { resolvedTheme, toggleTheme } = useTheme()

  const pageTitleMap: Record<PageId, string> = {
    dashboard: 'Vista general',
    inventory: 'Inventario de tienda',
    prediction: 'Predicción de demanda',
    replenishment: 'Órdenes de reposición',
    store: 'Operación en tienda',
    integration: 'Integraciones y datos',
    audit: 'Auditoría de empleados',
    settings: 'Arquitectura y ajustes',
  }

  return (
    <header className="h-[68px] sm:h-[72px] border-b border-slate-200 dark:border-slate-800/80 bg-[var(--bg-topbar)] flex items-center px-4 sm:px-6 lg:px-7 gap-2.5 sm:gap-4 sticky top-0 z-20 backdrop-blur-xl transition-colors">
      <button
        onClick={onOpenMobileMenu}
        className="icon-button xl:hidden grid place-items-center"
        aria-label="Menú principal"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="xl:hidden">
        <Logo compact />
      </div>

      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 min-w-0">
        <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{pageTitleMap[page]}</span>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
          {user ? user.cadena_nombre : 'Marathon Sports Chile'}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        <div className="mobile-nav xl:hidden flex">
          {(
            [
              { id: 'dashboard', icon: 'home' },
              { id: 'inventory', icon: 'box' },
              { id: 'store', icon: 'store' },
              { id: 'integration', icon: 'database' },
            ] as Array<{ id: PageId; icon: IconName }>
          ).map((item) => (
            <button
              key={item.id}
              aria-label={item.id}
              className={page === item.id ? 'active' : ''}
              onClick={() => setPage(item.id)}
            >
              <Icon name={item.icon} size={16} />
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="icon-button grid place-items-center"
          title={resolvedTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label={resolvedTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>

        <button
          onClick={onOpenSearch}
          className="icon-button grid place-items-center"
          title="Buscar productos (SKU)"
          aria-label="Buscar productos"
        >
          <Icon name="search" size={17} />
        </button>

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <span className="hidden md:inline text-[11px] font-mono text-slate-700 dark:text-slate-300 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 truncate max-w-[150px]">
              {user.rol}
            </span>
            <button
              onClick={onOpenLogin}
              title="Cambiar usuario o perfil"
              className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline ml-1 cursor-pointer"
            >
              Cambiar
            </button>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="icon-button hover:text-red-500 dark:hover:text-red-400 ml-1 cursor-pointer grid place-items-center"
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        ) : (
          <button onClick={onOpenLogin} className="primary-button text-xs py-1.5 px-3 cursor-pointer">
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  )
}

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [user, setUser] = useState<AuthUser | null>(() => api.getStoredUser())
  const [selectedBranch, setSelectedBranch] = useState<string>('TODAS')
  const [selectedPredictionSku, setSelectedPredictionSku] = useState<string>('RUN-001')

  const [products, setProducts] = useState<CatalogProduct[]>(() =>
    loadFromStorage(STORAGE_KEYS.products, INITIAL_CATALOG)
  )
  const [orders, setOrders] = useState<ReplenishmentOrder[]>(() =>
    loadFromStorage(STORAGE_KEYS.orders, INITIAL_ORDERS)
  )
  const [auditLogs, setAuditLogs] = useState<EmployeeAuditLog[]>(() =>
    loadFromStorage(STORAGE_KEYS.audit, INITIAL_EMPLOYEE_AUDIT_LOGS)
  )
  const [batchRows, setBatchRows] = useState<BatchAuditRow[]>(INITIAL_BATCH_ROWS)
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)

  const [loginOpen, setLoginOpen] = useState(false)
  const [insightOpen, setInsightOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoModal, setDemoModal] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  const canApproveOrders = user?.rol === 'GERENTE_OPERACIONES'
  const canIngestData = user?.rol === 'GERENTE_OPERACIONES' || user?.rol === 'AUDITOR'
  const canAdjustStore = user?.rol === 'GERENTE_OPERACIONES' || user?.rol === 'JEFE_TIENDA'

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3800)
  }, [])

  // Sincronización completa Multi-Tenant desde Backend API (/api/v1/)
  const syncAllFromBackend = useCallback(async () => {
    const [summary, catalogRes, ordersRes, lotsRes, empLogsRes] = await Promise.all([
      api.getDashboardSummary(),
      api.getCatalog(),
      api.getOrders(),
      api.getAuditLogs(),
      api.getEmployeeAuditLogs(),
    ])

    if (summary) setDashboardData(summary)
    if (catalogRes && catalogRes.length > 0) {
      const mappedCatalog = catalogRes.map(mapApiProduct)
      setProducts(mappedCatalog)
      setSelectedPredictionSku((prev) =>
        mappedCatalog.some((p) => p.sku_id === prev) ? prev : mappedCatalog[0].sku_id
      )
    }
    if (ordersRes) {
      setOrders(ordersRes.map(mapApiOrder))
    }
    if (lotsRes) {
      setBatchRows(lotsRes as BatchAuditRow[])
    }
    if (empLogsRes) {
      setAuditLogs(empLogsRes as EmployeeAuditLog[])
    }
  }, [])

  useEffect(() => {
    syncAllFromBackend()
  }, [user, syncAllFromBackend])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(auditLogs))
  }, [auditLogs])

  const appendAuditEntry = useCallback(
    (entry: {
      tipo_gestion: string
      detalle: string
      sucursal?: string
      terminal?: string
      estado?: EmployeeAuditLog['estado']
      empleado?: string
      rol?: string
    }) => {
      const emp = entry.empleado || user?.nombre || 'Joyce Honores'
      const rol = entry.rol || user?.rol || 'GERENTE_OPERACIONES'
      const initials = emp
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
      const now = new Date()
      const timestamp = `${now.toLocaleDateString('es-CL')} ${now.toLocaleTimeString('es-CL')}`

      setAuditLogs((prev) => [
        {
          id: `LOG-${Date.now().toString().slice(-5)}`,
          timestamp,
          relativo: 'Recién',
          empleado: emp,
          rol,
          avatar: initials,
          color: 'from-emerald-600 to-teal-500',
          tipo_gestion: entry.tipo_gestion,
          sucursal: entry.sucursal || 'Red SportStock',
          terminal: entry.terminal || 'Panel Web Enterprise',
          detalle: entry.detalle,
          estado: entry.estado || 'VERIFICADO',
        },
        ...prev,
      ])
    },
    [user]
  )

  const runBatchPrediction = useCallback(
    (horizon = 4, factors: Record<'FUTBOL' | 'RUNNING' | 'FITNESS', number> = { FUTBOL: 1.25, RUNNING: 1.35, FITNESS: 1.2 }) => {
      if (!canApproveOrders) {
        showToast('Ejecutar cálculo predictivo masivo requiere rol GERENTE_OPERACIONES.', 'warning')
        setLoginOpen(true)
        return { count: products.length, timeSec: '0.00', newOrders: 0 }
      }

      const start = performance.now()
      api.runPredictions(horizon, factors).then((res) => {
        if (res.ok && res.data) {
          syncAllFromBackend()
          showToast(
            `Motor API: ${res.data.skus_analizados} SKUs analizados en ${res.data.tiempo_segundos}s (+${res.data.ordenes_generadas} órdenes).`,
            'success'
          )
        } else if (!res.offline) {
          showToast(res.error || 'El servidor rechazó la ejecución predictiva.', 'error')
        }
      })

      // Respuesta inmediata en UI si el backend estuviera offline
      const nextOrders = [...orders]
      let created = 0
      products.forEach((p) => {
        const factor = factors[p.disciplina] || 1.2
        const demandaEst = Math.round(p.ventas_semanales_base * factor * (horizon / 2))
        if (p.stock_actual <= p.stock_minimo) {
          const cantidad = Math.max(1, demandaEst + p.stock_seguridad - p.stock_actual)
          const exists = nextOrders.find((o) => o.sku_id === p.sku_id && o.estado === 'PENDIENTE')
          const branch = BRANCHES.find((b) => b.id === p.sucursal_id) || BRANCHES[0]
          if (!exists) {
            nextOrders.unshift({
              id: `ORD-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
              sku_id: p.sku_id,
              nombre: p.nombre,
              tipo: p.tipo,
              disciplina: p.disciplina,
              sucursal_id: branch.id,
              sucursal_nombre: branch.nombre,
              stock_actual: p.stock_actual,
              stock_minimo: p.stock_minimo,
              stock_seguridad: p.stock_seguridad,
              demanda_esperada: demandaEst,
              cantidad_sugerida: cantidad,
              fecha_pedido: new Date(Date.now() + branch.lead_time_dias * 86400000).toISOString().split('T')[0],
              estado: 'PENDIENTE',
              lead_time: branch.lead_time_dias,
              confidence_score: 92,
              evento_estacional: 'Pronóstico estacional',
            })
            created++
          }
        }
      })
      const timeSec = ((performance.now() - start + 180) / 1000).toFixed(2)
      setOrders(nextOrders)
      return { count: products.length, timeSec, newOrders: created }
    },
    [canApproveOrders, orders, products, syncAllFromBackend, showToast]
  )

  const handleResolveOrder = async (orderId: string, status: 'APROBADA' | 'RECHAZADA') => {
    if (!canApproveOrders) {
      showToast('Solo el perfil GERENTE_OPERACIONES puede aprobar o rechazar órdenes.', 'warning')
      setLoginOpen(true)
      return
    }

    const target = orders.find((o) => o.id === orderId)
    const res = await api.resolveOrder(orderId, status, target?.cantidad_sugerida)

    if (!res.ok && !res.offline) {
      showToast(res.error || 'No se pudo actualizar la orden en el servidor.', 'error')
      return
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, estado: status } : o)))
    if (res.ok) {
      syncAllFromBackend()
    } else {
      appendAuditEntry({
        tipo_gestion: status === 'APROBADA' ? 'Aprobación de Orden' : 'Rechazo de Orden',
        sucursal: target?.sucursal_nombre || 'Red SportStock',
        detalle: `${status === 'APROBADA' ? 'Aprobó' : 'Rechazó'} orden ${orderId} (${target?.sku_id || 'SKU'}).`,
        estado: status === 'APROBADA' ? 'APROBADO' : 'RECHAZADO',
      })
    }
    showToast(`Orden ${orderId} marcada como ${status}.`, status === 'APROBADA' ? 'success' : 'info')
  }

  const handleApproveAllOrders = async () => {
    if (!canApproveOrders) {
      showToast('Solo el perfil GERENTE_OPERACIONES puede aprobar órdenes en lote.', 'warning')
      setLoginOpen(true)
      return
    }

    const pending = orders.filter(
      (o) => o.estado === 'PENDIENTE' && (selectedBranch === 'TODAS' || o.sucursal_id === selectedBranch)
    )
    if (pending.length === 0) return

    let approved = 0
    for (const o of pending) {
      const res = await api.resolveOrder(o.id, 'APROBADA', o.cantidad_sugerida)
      if (res.ok || res.offline) {
        approved++
      } else {
        showToast(res.error || 'Error RBAC al aprobar lote.', 'error')
        return
      }
    }

    const pendingIds = new Set(pending.map((o) => o.id))
    setOrders((prev) => prev.map((o) => (pendingIds.has(o.id) ? { ...o, estado: 'APROBADA' } : o)))
    syncAllFromBackend()
    showToast(`${approved} órdenes aprobadas y enviadas a tránsito.`, 'success')
  }

  const handleReplenishProduct = async (product: CatalogProduct) => {
    if (!canAdjustStore) {
      showToast('Inicia sesión como GERENTE_OPERACIONES o JEFE_TIENDA para generar órdenes.', 'warning')
      setLoginOpen(true)
      return
    }

    const qty = Math.max(5, Math.round(product.ventas_semanales_base * 1.5) + product.stock_seguridad - product.stock_actual)
    const res = await api.createOrder({
      sku_codigo: product.sku_id,
      sucursal_id: product.sucursal_id,
      cantidad_sugerida: qty,
      evento_estacional: 'Reposición manual prioritaria',
    })

    if (!res.ok && !res.offline) {
      showToast(res.error || 'No se pudo crear la orden en el servidor.', 'error')
      return
    }

    if (res.ok) {
      await syncAllFromBackend()
      showToast(`Orden generada en servidor para ${product.sku_id}.`, 'success')
    } else {
      const branch = BRANCHES.find((b) => b.id === product.sucursal_id) || BRANCHES[0]
      setOrders((prev) => [
        {
          id: `ORD-${Date.now().toString().slice(-4)}`,
          sku_id: product.sku_id,
          nombre: product.nombre,
          tipo: product.tipo,
          disciplina: product.disciplina,
          sucursal_id: branch.id,
          sucursal_nombre: branch.nombre,
          stock_actual: product.stock_actual,
          stock_minimo: product.stock_minimo,
          stock_seguridad: product.stock_seguridad,
          demanda_esperada: Math.round(product.ventas_semanales_base * 1.5),
          cantidad_sugerida: qty,
          fecha_pedido: new Date(Date.now() + branch.lead_time_dias * 86400000).toISOString().split('T')[0],
          estado: 'PENDIENTE',
          lead_time: branch.lead_time_dias,
          confidence_score: 91,
          evento_estacional: 'Reposición manual prioritaria',
        },
        ...prev,
      ])
      showToast(`Orden generada localmente para ${product.sku_id}.`, 'info')
    }
    setPage('replenishment')
  }

  const handleConfirmStockCount = async (skuId: string, newStock: number | null, responsible: string) => {
    const current = products.find((p) => p.sku_id === skuId)
    const finalStock = newStock !== null ? newStock : (current?.stock_actual ?? 0)
    const res = await api.adjustStoreCount(skuId, finalStock, responsible, current?.sucursal_id)

    if (!res.ok && !res.offline) {
      showToast(res.error || 'Permisos insuficientes para ajustar stock en tienda.', 'error')
      return
    }

    const nowTime = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    setProducts((prev) =>
      prev.map((p) =>
        p.sku_id !== skuId
          ? p
          : {
              ...p,
              stock_actual: finalStock,
              conteo_confirmado: true,
              fecha_conteo: `Hoy, ${nowTime}`,
              auditado_por: responsible,
            }
      )
    )

    if (res.ok) {
      syncAllFromBackend()
    } else {
      appendAuditEntry({
        empleado: responsible,
        rol: user?.rol || 'JEFE_TIENDA',
        tipo_gestion: newStock !== null ? 'Ajuste Físico en Góndola' : 'Conteo Físico Verificado',
        terminal: 'App Móvil Tienda',
        detalle: `Confirmó ${current?.nombre || skuId} (${skuId}) con ${finalStock} unidades en sala.`,
        estado: 'VERIFICADO',
      })
    }
    showToast(`Conteo confirmado para ${skuId} (${finalStock} u.).`, 'success')
  }

  const handleApplyPosSale = (
    sales: Array<{ sku_id: string; unidades_vendidas: number; stock_remanente?: number }>,
    sourceLabel: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        const match = sales.find((s) => s.sku_id.toUpperCase() === p.sku_id.toUpperCase())
        if (!match) return p
        const nextStock =
          match.stock_remanente !== undefined
            ? Math.max(0, Number(match.stock_remanente))
            : Math.max(0, p.stock_actual - (Number(match.unidades_vendidas) || 0))
        return {
          ...p,
          stock_actual: nextStock,
          canal_ingesta: `REST API (${sourceLabel})`,
        }
      })
    )
    appendAuditEntry({
      tipo_gestion: 'Ingesta POS JSON',
      terminal: sourceLabel,
      detalle: `Procesó venta síncrona de ${sales.length} SKUs vía API REST.`,
      estado: 'EXITOSO',
    })
  }

  const handleIngestCsvText = (csvText: string, fileName: string): number => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return 0
    const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase())
    const skuIdx = headers.findIndex((h) => h === 'sku_codigo' || h === 'sku_id')
    const stockIdx = headers.findIndex((h) => h === 'stock_actual')
    let updated = 0

    if (skuIdx >= 0 && stockIdx >= 0) {
      const updates = new Map<string, number>()
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;]/).map((c) => c.trim())
        const sku = cols[skuIdx]
        const stock = Number(cols[stockIdx])
        if (sku && !Number.isNaN(stock)) {
          updates.set(sku.toUpperCase(), Math.max(0, stock))
          updated++
        }
      }
      setProducts((prev) =>
        prev.map((p) =>
          updates.has(p.sku_id.toUpperCase())
            ? { ...p, stock_actual: updates.get(p.sku_id.toUpperCase())!, canal_ingesta: `CSV (${fileName})` }
            : p
        )
      )
    }

    appendAuditEntry({
      tipo_gestion: 'Ingesta Masiva CSV',
      terminal: 'Portal Integraciones',
      detalle: `Procesó planilla ${fileName} (${updated || lines.length - 1} registros).`,
      estado: 'EXITOSO',
    })
    return updated || lines.length - 1
  }

  const triggerAutomatedDemo = () => {
    if (!canApproveOrders) {
      showToast('Inicia sesión como GERENTE_OPERACIONES para ejecutar el flujo predictivo.', 'warning')
      setLoginOpen(true)
      return
    }
    setDemoModal(true)
    setDemoStep(1)
    setTimeout(() => {
      setDemoStep(2)
      setTimeout(() => {
        setDemoStep(3)
        runBatchPrediction(4)
        setTimeout(() => setDemoStep(4), 900)
      }, 750)
    }, 650)
  }

  const handleResetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.products)
    localStorage.removeItem(STORAGE_KEYS.orders)
    localStorage.removeItem(STORAGE_KEYS.audit)
    setProducts(INITIAL_CATALOG)
    setOrders(INITIAL_ORDERS)
    setAuditLogs(INITIAL_EMPLOYEE_AUDIT_LOGS)
    setBatchRows(INITIAL_BATCH_ROWS)
    syncAllFromBackend()
    showToast('Datos sincronizados y restablecidos.', 'info')
  }

  const pendingOrdersCount = useMemo(() => orders.filter((o) => o.estado === 'PENDIENTE').length, [orders])
  const responsibleName = user?.nombre || 'Jorge Hormazabal'

  const content = useMemo(() => {
    switch (page) {
      case 'dashboard':
        return (
          <DashboardPage
            user={user}
            dashboardData={dashboardData}
            products={products}
            orders={orders}
            canApproveOrders={canApproveOrders}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            onResolveOrder={handleResolveOrder}
            onApproveAllOrders={handleApproveAllOrders}
            onOpenInsight={() => setInsightOpen(true)}
            onTriggerDemo={triggerAutomatedDemo}
            onNavigate={setPage}
          />
        )
      case 'inventory':
        return (
          <InventoryPage
            products={products}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            onReplenishProduct={handleReplenishProduct}
            onSimulateProduct={(skuId) => {
              setSelectedPredictionSku(skuId)
              setPage('prediction')
            }}
          />
        )
      case 'prediction':
        return (
          <PredictionPage
            products={products}
            selectedSku={selectedPredictionSku}
            setSelectedSku={setSelectedPredictionSku}
            onRunBatchPrediction={runBatchPrediction}
          />
        )
      case 'replenishment':
        return (
          <ReplenishmentPage
            orders={orders}
            canApproveOrders={canApproveOrders}
            onRequireLogin={() => setLoginOpen(true)}
            onResolveOrder={handleResolveOrder}
            onApproveAll={handleApproveAllOrders}
            onRunPrediction={() => runBatchPrediction(4)}
          />
        )
      case 'store':
        return (
          <StoreAppPage
            products={products}
            teamMembers={TEAM_MEMBERS}
            responsibleName={responsibleName}
            canAdjustStore={canAdjustStore}
            onRequireLogin={() => setLoginOpen(true)}
            onConfirmStockCount={handleConfirmStockCount}
            onShowToast={showToast}
          />
        )
      case 'integration':
        return (
          <IntegrationsPage
            products={products}
            batchRows={batchRows}
            canIngestData={canIngestData}
            onRequireLogin={() => setLoginOpen(true)}
            onRefreshFromBackend={syncAllFromBackend}
            onAddBatchRow={(row) => setBatchRows((prev) => [row, ...prev])}
            onApplyPosSale={handleApplyPosSale}
            onIngestCsvText={handleIngestCsvText}
            onShowToast={showToast}
          />
        )
      case 'audit':
        return (
          <AuditPage
            products={products}
            auditLogs={auditLogs}
            teamMembers={TEAM_MEMBERS}
            onRegisterNewAudit={async () => {
              if (!user) {
                showToast('Inicia sesión para registrar un cierre de inventario en auditoría.', 'warning')
                setLoginOpen(true)
                return
              }
              const res = await api.createEmployeeAuditLog({
                tipo_gestion: 'Cierre de Inventario Físico',
                sucursal: user.cadena_nombre,
                terminal: 'Panel Gerencial Web',
                detalle: `Conteo físico verificado sobre ${products.length} SKUs con cero discrepancias críticas.`,
                estado: 'VERIFICADO',
              })
              if (res.ok) {
                syncAllFromBackend()
              } else if (res.offline) {
                appendAuditEntry({
                  empleado: responsibleName,
                  rol: user.rol,
                  tipo_gestion: 'Cierre de Inventario Físico',
                  terminal: 'Panel Gerencial Web',
                  detalle: `Conteo físico verificado sobre ${products.length} SKUs con cero discrepancias críticas.`,
                  estado: 'VERIFICADO',
                })
              } else {
                showToast(res.error || 'No se pudo registrar auditoría.', 'error')
                return
              }
              showToast('Nuevo cierre de auditoría registrado.', 'success')
            }}
            onShowToast={showToast}
          />
        )
      case 'settings':
        return <SettingsPage onResetDemoData={handleResetDemoData} />
    }
  }, [
    page,
    user,
    dashboardData,
    products,
    orders,
    canApproveOrders,
    canIngestData,
    canAdjustStore,
    selectedBranch,
    selectedPredictionSku,
    batchRows,
    auditLogs,
    responsibleName,
    syncAllFromBackend,
  ])

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-slate-900 dark:text-slate-100 flex flex-col xl:flex-row transition-colors">
      <Sidebar
        page={page}
        setPage={setPage}
        pendingOrdersCount={pendingOrdersCount}
        productCount={products.length}
        user={user}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={() => {
          api.logout()
          setUser(null)
        }}
      />

      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        page={page}
        setPage={setPage}
        pendingOrdersCount={pendingOrdersCount}
        productCount={products.length}
        user={user}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={() => {
          api.logout()
          setUser(null)
        }}
      />

      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar
          page={page}
          setPage={setPage}
          user={user}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={() => {
            api.logout()
            setUser(null)
          }}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        {content}
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-white dark:bg-slate-900 border border-emerald-500/40 text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 max-w-sm">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === 'error'
                ? 'bg-red-500 dark:bg-red-400'
                : toast.type === 'warning'
                ? 'bg-amber-500 dark:bg-amber-400'
                : 'bg-emerald-500 dark:bg-emerald-400'
            }`}
          />
          <span>{toast.msg}</span>
        </div>
      )}

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={(newUser) => {
          setUser(newUser)
          setSelectedBranch('TODAS')
          showToast(`Sesión iniciada: ${newUser.nombre} (${newUser.cadena_nombre})`, 'success')
        }}
      />

      <InsightModal isOpen={insightOpen} onClose={() => setInsightOpen(false)} />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
        onSelectProduct={(skuId) => {
          setSelectedPredictionSku(skuId)
          setPage('prediction')
        }}
      />

      <GherkinDemoModal
        isOpen={demoModal}
        step={demoStep}
        onClose={() => setDemoModal(false)}
        onGoToOrders={() => {
          setDemoModal(false)
          setPage('replenishment')
        }}
      />
    </div>
  )
}

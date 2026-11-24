import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, type DashboardResponse, type AuthUser } from './services/api'

type IconName =
  | 'activity'
  | 'alert'
  | 'arrow'
  | 'barcode'
  | 'box'
  | 'building'
  | 'check'
  | 'chevron'
  | 'cloud'
  | 'database'
  | 'file'
  | 'home'
  | 'info'
  | 'layers'
  | 'lock'
  | 'logout'
  | 'menu'
  | 'more'
  | 'refresh'
  | 'search'
  | 'settings'
  | 'spark'
  | 'store'
  | 'upload'
  | 'user'

function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    activity: <><path d="M3 12h4l2.5-7 4 14 2.5-7h5" /></>,
    alert: <><path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2Z" /><path d="M12 9v4M12 17h.01" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    barcode: <><path d="M3 5v14M7 5v14M10 5v14M15 5v14M18 5v14M21 5v14" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /></>,
    building: <><path d="M4 21V518-3 8 3v16M8 9h2M14 9h2M8 13h2M14 13h2M9 21v-4h6v4" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    cloud: <><path d="M17.5 19H6a4 4 0 0 1-.5-8A6 6 0 0 1 17 9a5 5 0 0 1 .5 10Z" /><path d="M12 12v6M9.5 14.5 12 12l2.5 2.5" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-6h6v6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 1719 5 9-5" /></>,
    lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M3 4v6h6M21 20v-6h-6" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.91.1 1.7 0 0 0-1.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v2l-1.2.3M4 12a8 8 0 0 1 8-8" /></>,
    spark: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z" /></>,
    store: <><path d="M3 9h18l-2-6H5Z" /><path d="M5 9v12h14V9M9 21v-6h6v6" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  }
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="logo-mark"><span /><span /><span /></div>
      {!compact && <div className="font-semibold tracking-[-.04em] text-white text-[17px]">SportStock</div>}
    </div>
  )
}

type Page = 'dashboard' | 'store' | 'integration'

function LoginModal({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean; onClose: () => void; onLoginSuccess: (user: AuthUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
    const e = loginEmail || email
    const p = loginPass || password
    setError(null)
    setLoading(true)
    const res = await api.login(e, p)
    setLoading(false)
    if (res.success && res.user) {
      onLoginSuccess(res.user)
      onClose()
    } else {
      setError(res.error || 'Credenciales incorrectas.')
    }
  }

  const quickUsers = [
    { label: 'Gerente de Operaciones', name: 'Matías Muñoz', email: 'gerente@marathonsports.cl', role: 'GERENTE_OPERACIONES', tenant: 'Marathon Sports' },
    { label: 'Jefe de Tienda', name: 'Encargado Costanera', email: 'tienda@marathonsports.cl', role: 'JEFE_TIENDA', tenant: 'Marathon Sports' },
    { label: 'Auditor Financiero', name: 'Auditor Externo', email: 'auditor@marathonsports.cl', role: 'AUDITOR', tenant: 'Marathon Sports' },
    { label: 'Gerente de Operaciones', name: 'Gerencia Sparta', email: 'gerente@sparta.cl', role: 'GERENTE_OPERACIONES', tenant: 'Sparta Deportes' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel max-w-md w-full p-6 border border-slate-700 bg-slate-900 shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Logo compact />
            <div>
              <h2 className="text-sm font-semibold text-white">Autenticación Empresarial</h2>
              <p className="text-[11px] text-slate-400">Control Multi-Inquilino y Roles RBAC</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-medium text-slate-300 mb-2">Acceso rápido por perfil y tenant:</p>
          <div className="grid gap-2">
            {quickUsers.map(u => (
              <button
                key={u.email}
                onClick={() => handleLogin(u.email, 'Password123!')}
                className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-200">{u.label} · <span className="text-slate-400 font-normal">{u.name}</span></p>
                  <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700 text-emerald-400">{u.tenant}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800">
          <p className="text-xs font-medium text-slate-300 mb-2">O ingrese credenciales corporativas:</p>
          <form onSubmit={(e: any) => { e.preventDefault(); handleLogin(); }} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="usuario@cadena.cl"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full primary-button py-2.5 text-xs font-medium flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Icon name="refresh" className="animate-spin" size={14} /> : <Icon name="check" size={14} />}
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Sidebar({
  page,
  setPage,
  user,
  onOpenLogin,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  user: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}) {
  const items: { id: Page; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Vista general', icon: 'home' },
    { id: 'store', label: 'Operación tienda', icon: 'store' },
    { id: 'integration', label: 'Integraciones', icon: 'database' },
  ]

  const userInitials = user ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AN'

  return (
    <aside className="hidden xl:flex w-[232px] shrink-0 border-r border-slate-800/80 bg-[#0a0e17] flex-col p-4">
      <div className="h-14 flex items-center px-2 mb-4"><Logo /></div>
      <p className="eyebrow px-3 mb-2">Plataforma</p>
      <nav className="space-y-1">
        {items.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} className={`nav-item ${page === item.id ? 'active' : ''}`}>
            <Icon name={item.icon} size={18} />{item.label}
          </button>
        ))}
      </nav>
      <div className="mt-7">
        <p className="eyebrow px-3 mb-2">Gestión</p>
        <button className="nav-item"><Icon name="layers" size={18} />Órdenes sugeridas<span className="nav-count">6</span></button>
        <button className="nav-item"><Icon name="activity" size={18} />Predicciones</button>
        <button className="nav-item"><Icon name="settings" size={18} />Configuración</button>
      </div>
      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-200"><span className="live-dot" />Motor predictivo</div>
        <p className="text-[11px] text-slate-500 mt-1.5">Tenant: {user ? user.cadena_nombre : 'Demo activo'}</p>
      </div>
      <div className="flex items-center gap-3 px-2 pt-4 mt-3 border-t border-slate-800">
        <div className="avatar">{userInitials}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">{user ? user.nombre : 'Sin sesión'}</p>
          <p className="text-[11px] text-slate-500 truncate">{user ? user.rol : 'Haga clic para ingresar'}</p>
        </div>
        {user ? (
          <button onClick={onLogout} title="Cerrar sesión" className="ml-auto text-slate-500 hover:text-red-400">
            <Icon name="logout" size={16} />
          </button>
        ) : (
          <button onClick={onOpenLogin} title="Iniciar sesión" className="ml-auto text-emerald-400 hover:text-emerald-300">
            <Icon name="user" size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}

function Topbar({
  page,
  setPage,
  user,
  onOpenLogin,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  user: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="h-[72px] border-b border-slate-800/80 bg-[#0b0f19]/90 flex items-center px-5 lg:px-7 gap-4 sticky top-0 z-20 backdrop-blur-xl">
      <div className="xl:hidden"><Logo /></div>
      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
        <span className="font-medium text-slate-100">{page === 'dashboard' ? 'Vista general' : page === 'store' ? 'Operación en tienda' : 'Integraciones y datos'}</span>
        <span className="text-slate-700">/</span><span className="text-emerald-400 font-semibold">{user ? user.cadena_nombre : 'Marathon Sports Chile'}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="mobile-nav xl:hidden">
          {(['dashboard', 'store', 'integration'] as Page[]).map((id, i) => <button key={id} aria-label={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon name={i === 0 ? 'home' : i === 1 ? 'store' : 'database'} size={17} /></button>)}
        </div>
        <button className="icon-button hidden sm:grid"><Icon name="search" /></button>
        <button className="icon-button hidden sm:grid"><Icon name="alert" /></button>
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="hidden md:inline text-[11px] font-mono text-slate-300 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50">
              {user.rol}
            </span>
            <button onClick={onOpenLogin} title="Cambiar usuario o tenant" className="text-xs text-slate-400 hover:text-emerald-400 underline ml-1">
              Cambiar
            </button>
            <button onClick={onLogout} title="Cerrar sesión" className="icon-button text-slate-400 hover:text-red-400 ml-1">
              <Icon name="logout" size={15} />
            </button>
          </div>
        ) : (
          <button onClick={onOpenLogin} className="primary-button text-xs py-1.5 px-3">
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  )
}

function SelectPill({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return <button className="select-pill">{icon && <Icon name={icon} size={15} />}<span>{children}</span><Icon name="chevron" size={14} /></button>
}

interface KpiItem {
  title: string
  value: string
  suffix?: string
  meta: string
  detail: string
  tone: string
  spark: string
}

const kpis: KpiItem[] = [
  { title: 'SKUs en quiebre crítico', value: '14', meta: '+3', detail: 'vs. semana anterior', tone: 'red', spark: '5,24 18,22 31,23 44,15 58,17 72,8 87,10 100,4' },
  { title: 'Demanda proyectada', value: '+18,5%', meta: 'Tendencia', detail: 'Fútbol · Torneo Nacional', tone: 'green', spark: '5,23 18,18 31,20 44,12 58,14 72,7 87,9 100,3' },
  { title: 'Órdenes sugeridas', value: '6', suffix: 'pendientes', meta: 'Revisar lote', detail: '$18,4M en reposición', tone: 'amber', spark: '5,20 18,20 31,15 44,17 58,10 72,12 87,8 100,7' },
  { title: 'Nivel de servicio de red', value: '91,4%', meta: 'Meta ≥95%', detail: '−3,6 pts bajo objetivo', tone: 'slate', spark: '5,14 18,13 31,12 44,15 58,12 72,13 87,8 100,9' },
]

function KpiCard({ item }: { item: KpiItem }) {
  return (
    <div className="panel kpi-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] text-slate-400 font-medium">{item.title}</p>
        <span className={`mini-tag ${item.tone}`}>{item.meta}</span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="metric">{item.value}</span>
        {item.suffix && <span className="text-xs text-slate-400 mb-1.5">{item.suffix}</span>}
      </div>
      <div className="flex items-end justify-between mt-3">
        <p className="text-[11px] text-slate-500">{item.detail}</p>
        <svg viewBox="0 0 105 28" className={`sparkline ${item.tone}`}><polyline points={item.spark} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      </div>
    </div>
  )
}

const chartLabels = [
  { x: 48, val: '372' },
  { x: 135, val: '418' },
  { x: 225, val: '464' },
  { x: 315, val: '510' },
  { x: 400, val: '556' },
  { x: 490, val: '602' },
  { x: 580, val: '648' },
]

const chartYAxis = ['800', '1.2k', '1.6k', '2.0k', '2.4k']

function ForecastChart() {
  return (
    <div className="panel p-5 lg:p-6 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Proyección de demanda · Running y Fútbol</h2>
          <p className="section-subtitle mt-0.5">Ventana de 8 semanas vs. capacidad de reposición</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2"><span className="legend-dot bg-emerald-400" />Proyección IA</span>
          <span className="flex items-center gap-2"><span className="legend-dot bg-slate-500" />Histórico</span>
        </div>
      </div>
      <div className="mt-6 relative">
        <svg viewBox="0 0 640 240" className="w-full h-56 stroke-slate-800">
          {[40, 80, 120, 160, 200].map(y => <line key={y} x1="40" y1={y} x2="620" y2={y} strokeDasharray="3 3" />)}
          <path d="M 48 180 Q 135 160 225 150 T 400 120 T 490 85 T 580 62" fill="none" stroke="#10b981" strokeWidth="3" />
          <path d="M 48 185 Q 135 175 225 165 T 400 150 T 490 142 T 580 138" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
          {chartLabels.map(p => <circle key={p.x} cx={p.x} cy="100" r="3" fill="#10b981" />)}
        </svg>
        <div className="flex justify-between text-[11px] text-slate-500 px-6 mt-2">
          {chartLabels.map(l => <span key={l.val}>Sem {l.val}</span>)}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400">
        <span>Confianza algorítmica: <strong className="text-emerald-400 font-semibold">94,2%</strong></span>
        <span>Modelo: Holt-Winters estacional</span>
      </div>
    </div>
  )
}

interface UrgentItem {
  sku: string
  name: string
  detail: string
  qty: string
  chip: string
  confidence: number
  level: string
}

const urgent: UrgentItem[] = [
  { sku: 'RUN-001', name: 'Nike Vaporfly 3 (Talla 42)', detail: 'Costanera Center', qty: '+25 u.', chip: '+35% Maratón Santiago', confidence: 94, level: 'critical' },
  { sku: 'RUN-008', name: 'Cortaviento Trail Shield', detail: 'Costanera Center', qty: '+18 u.', chip: 'Pico estacional', confidence: 91, level: 'critical' },
  { sku: 'FUT-023', name: 'Balón Torneo Pro Match N°5', detail: 'Parque Arauco', qty: '+28 u.', chip: 'Torneo Nacional', confidence: 87, level: 'warning' },
]

function ReplenishmentList({ liveOrders }: { liveOrders?: DashboardResponse['sugerencias_urgentes'] }) {
  const [approved, setApproved] = useState<string[]>([])

  const items = useMemo(() => {
    if (liveOrders && liveOrders.length > 0) {
      return liveOrders.map((o) => ({
        sku: o.sku_codigo,
        name: o.nombre_producto,
        detail: o.sucursal_nombre,
        qty: `+${o.cantidad_sugerida} u.`,
        chip: o.evento_estacional,
        confidence: o.confidence_score,
        level: o.formula_desglose.stock_actual <= 3 ? 'critical' : 'warning',
        formula: `Demanda esperada (${o.formula_desglose.demanda_esperada}) + Seguridad (${o.formula_desglose.stock_seguridad}) - Stock actual (${o.formula_desglose.stock_actual}) = ${o.cantidad_sugerida} unidades`,
      }))
    }
    return urgent.map((u) => ({
      ...u,
      formula: 'Demanda esperada (28) + Seguridad (5) - Stock actual (8) = 25 unidades',
    }))
  }, [liveOrders])

  const handleApprove = async (sku: string) => {
    setApproved((prev) => [...prev, sku])
    await api.approveOrder(sku)
  }

  return (
    <div className="panel h-full min-h-[360px] flex flex-col">
      <div className="p-5 border-b border-slate-800 flex items-start justify-between">
        <div><h2 className="section-title">Reabastecimiento urgente</h2><p className="section-subtitle">Priorizado por riesgo y lead time</p></div>
        <button className="icon-button-small"><Icon name="more" /></button>
      </div>
      <div className="divide-y divide-slate-800/80 flex-1">
        {items.map(item => {
          const done = approved.includes(item.sku)
          return (
            <div key={item.sku} className="p-4 lg:px-5">
              <div className="flex gap-3">
                <span className={`risk-bar ${item.level}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div><p className="text-[13px] font-medium text-slate-100 truncate">{item.name}</p><p className="text-[11px] text-slate-500 mt-0.5">{item.detail} · <span className="font-mono">{item.sku}</span></p></div>
                    <div className="text-right shrink-0 group relative"><p className="font-mono text-sm font-semibold text-emerald-400">{item.qty}</p><p className="text-[10px] text-slate-500">{item.confidence}% conf.</p></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="mini-chip">{item.chip}</span>
                    <button onClick={() => handleApprove(item.sku)} disabled={done} className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${done ? 'bg-slate-800 text-slate-500' : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'}`}>
                      {done ? 'Aprobada' : 'Aprobar orden'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <button className="h-11 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors border-t border-slate-800">Ver todas las sugerencias →</button>
    </div>
  )
}

function Dashboard({ user }: { user?: AuthUser | null }) {
  const [data, setData] = useState<DashboardResponse | null>(null)

  useEffect(() => {
    let mounted = true
    api.getDashboardSummary().then((res) => {
      if (mounted && res) {
        setData(res)
      }
    })
    return () => {
      mounted = false
    }
  }, [user])

  const currentKpis: KpiItem[] = useMemo(() => {
    if (!data) return kpis
    return [
      { title: 'SKUs en quiebre crítico', value: String(data.kpis.skus_quiebre_critico), meta: '+3', detail: 'vs. semana anterior', tone: 'red', spark: '5,24 18,22 31,23 44,15 58,17 72,8 87,10 100,4' },
      { title: 'Demanda proyectada', value: data.kpis.demanda_proyectada_delta, meta: 'Tendencia', detail: 'Fútbol · Torneo Nacional', tone: 'green', spark: '5,23 18,18 31,20 44,12 58,14 72,7 87,9 100,3' },
      { title: 'Órdenes sugeridas', value: String(data.kpis.ordenes_sugeridas_count), suffix: 'pendientes', meta: 'Revisar lote', detail: `${data.kpis.monto_reposicion_estimado} en reposición`, tone: 'amber', spark: '5,20 18,20 31,15 44,17 58,10 72,12 87,8 100,7' },
      { title: 'Nivel de servicio de red', value: data.kpis.nivel_servicio_red, meta: `Meta ${data.kpis.meta_nivel_servicio}`, detail: '−3,6 pts bajo objetivo', tone: 'slate', spark: '5,14 18,13 31,12 44,15 58,12 72,13 87,8 100,9' },
    ]
  }, [data])

  const firstName = user ? user.nombre.split(' ')[0] : 'Matías'

  return (
    <main className="page-wrap">
      <div className="flex flex-col lg:flex-row lg:items-end gap-5 justify-between">
        <div>
          <p className="eyebrow text-emerald-400 mb-2">Lunes, 23 de junio</p>
          <h1 className="page-title">Buenos días, {firstName}</h1>
          <p className="page-subtitle">
            Cadena: <strong className="text-white">{user ? user.cadena_nombre : 'Marathon Sports Chile'}</strong> · Hay {data ? data.kpis.skus_quiebre_critico : '14'} SKUs que requieren tu atención esta mañana.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectPill icon="building">{user?.sucursal_id ? 'Sucursal Costanera Center' : 'Todas las sucursales (3)'}</SelectPill>
          <SelectPill>Próximas 4 semanas</SelectPill>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 mt-7">{currentKpis.map(item => <KpiCard key={item.title} item={item} />)}</div>
      <div className="grid 2xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,.85fr)] gap-4 mt-4"><ForecastChart /><ReplenishmentList liveOrders={data?.sugerencias_urgentes} /></div>
      <div className="panel mt-4 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="h-10 w-10 rounded-lg bg-emerald-400/10 text-emerald-400 grid place-items-center"><Icon name="spark" /></div>
        <div><p className="text-sm font-medium text-slate-100">Insight de SportStock</p><p className="text-xs text-slate-400 mt-1">La demanda de Running subirá un 35% por la Maratón de Santiago. Anticipar 2 semanas reduce el costo de quiebre en $4,2M.</p></div>
        <button className="secondary-button sm:ml-auto shrink-0">Ver análisis</button>
      </div>
    </main>
  )
}

interface StoreAlert {
  sku: string
  name: string
  variant: string
  current: number
  required: number
  eta: string
  status: 'critical' | 'warning'
}

const storeAlerts: StoreAlert[] = [
  { sku: 'RUN-001', name: 'Nike Vaporfly 3', variant: 'Talla 42 · Running', current: 3, required: 8, eta: 'Jueves 26', status: 'critical' },
  { sku: 'RUN-008', name: 'Cortaviento Trail Shield', variant: 'Talla M · Running', current: 6, required: 12, eta: 'Viernes 27', status: 'critical' },
  { sku: 'FUT-023', name: 'Balón Torneo Pro Match N°5', variant: 'Fútbol', current: 12, required: 18, eta: 'Lunes 30', status: 'warning' },
]

const storeFeatures = [
  { label: 'Cámara móvil activa', desc: 'Lectura continua sin retrasos de enfoque' },
  { label: 'Sincronización bidireccional', desc: 'El conteo en tienda actualiza el dashboard central' },
  { label: 'Operación offline', desc: 'Permite conteo en zonas de bodega sin cobertura' },
]

function StoreApp() {
  const [checked, setChecked] = useState<string[]>([])
  const [alertItems, setAlertItems] = useState<StoreAlert[]>(storeAlerts)

  const toggleCheck = async (sku: string) => {
    setChecked((prev) => (prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]))
    const res = await api.recordStoreSale(sku, 0)
    if (res.success && res.newStock !== undefined) {
      setAlertItems(prev => prev.map(item => item.sku === sku ? { ...item, current: res.newStock! } : item))
    }
  }

  return (
    <main className="page-wrap">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div><p className="eyebrow text-emerald-400 mb-2">Módulo de piso de venta</p><h1 className="page-title">SportStock Móvil — Modo Tienda</h1><p className="page-subtitle">Herramienta para encargados de inventario en sucursales físicas.</p></div>
        <div className="store-badge"><span className="store-indicator" />Sucursal Costanera Center</div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-8">
        <div className="panel p-5 lg:p-6 min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="status-badge critical">4 alertas</span><span className="status-badge warning">7 preventivos</span></div>
            <h2 className="section-title mt-3">Semáforo de reposición de sala</h2>
            <p className="section-subtitle mt-1">SKUs prioritarios que deben ser reabastecidos desde bodega antes de las 14:00.</p>
            <div className="divide-y divide-slate-800/80 mt-5">
              {alertItems.map(item => {
                const isDone = checked.includes(item.sku)
                return (
                  <div key={item.sku} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2"><p className="text-xs font-semibold text-slate-100">{item.name}</p><span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.status === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{item.sku}</span></div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.variant} · Stock actual: <strong className="text-slate-200">{item.current} u.</strong> (mín. {item.required} u.)</p>
                    </div>
                    <button onClick={() => toggleCheck(item.sku)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0 ${isDone ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 hover:border-slate-600 text-slate-300'}`}>
                      {isDone ? 'Confirmado' : 'Confirmar en rack'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400 mt-4"><Icon name="barcode" size={20} className="text-emerald-400 shrink-0" /><span>Usa la app en tu teléfono para escanear el código de barras del producto y registrar el conteo en tiempo real.</span></div>
        </div>
        <div className="panel p-5 lg:p-6 min-h-[380px] flex flex-col justify-between">
          <div>
            <h2 className="section-title">Lector de código de barras físico</h2>
            <p className="section-subtitle mt-1">Compatible con cámaras de smartphones y pistolas láser industriales Honeywell / Zebra.</p>
            <div className="scanner-frame mt-6">
              <div className="scanner-line" />
              <div className="text-center"><Icon name="barcode" size={48} className="text-slate-600 mx-auto mb-2" /><p className="text-xs font-mono text-slate-400">ESCANEAR EAN-13 / CODE-128</p><p className="text-[11px] text-slate-600 mt-1">Apunta la cámara al código de la caja o etiqueta</p></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-center">
            {storeFeatures.map(f => <div key={f.label}><p className="text-xs font-semibold text-slate-200">{f.label}</p><p className="text-[10px] text-slate-500 mt-0.5">{f.desc}</p></div>)}
          </div>
        </div>
      </div>
    </main>
  )
}

interface AuditRow {
  id: string
  date: string
  source: string
  records: string
  status: string
  tone: string
}

const auditRows: AuditRow[] = [
  { id: 'LT-2025-0623-01', date: 'Hoy, 08:30', source: 'SAP Business One', records: '12.458', status: 'Validado', tone: 'success' },
  { id: 'LT-2025-0622-03', date: '22 Jun, 19:15', source: 'Carga manual Excel', records: '340', status: 'Validado', tone: 'success' },
  { id: 'LT-2025-0622-02', date: '22 Jun, 08:30', source: 'SAP Business One', records: '12.391', status: 'Validado', tone: 'success' },
  { id: 'LT-2025-0621-01', date: '21 Jun, 08:30', source: 'SAP Business One', records: '12.404', status: 'Validado', tone: 'success' },
]

const dataStats: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: 'database', value: '12.458', label: 'Registros sincronizados' },
  { icon: 'check', value: '99,8%', label: 'Calidad de datos' },
  { icon: 'activity', value: '4m 12s', label: 'Tiempo de procesamiento' },
]

function Integration() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [upload, setUpload] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [rows, setRows] = useState<AuditRow[]>(auditRows)

  useEffect(() => {
    let mounted = true
    api.getAuditLogs().then((logs) => {
      if (mounted && logs && logs.length > 0) {
        setRows(logs as AuditRow[])
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    setUpload(file.name)
    const res = await api.uploadCsvBatch(file)
    if (res.success && res.lotCode) {
      setRows((prev: AuditRow[]) => [
        { id: res.lotCode!, date: 'Ahora mismo', source: file.name, records: '10 SKUs', status: 'Validado', tone: 'success' },
        ...prev,
      ])
    }
  }

  const doSync = () => { setSyncing(true); window.setTimeout(() => setSyncing(false), 1400) }
  return (
    <main className="page-wrap">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div><p className="eyebrow text-emerald-400 mb-2">Centro de datos</p><h1 className="page-title">Integraciones y carga de datos</h1><p className="page-subtitle">Mantén el motor predictivo alimentado con información confiable.</p></div>
        <div className="sync-status"><span className="live-dot" /><div><p>Sistema operativo</p><small>Última verificación hace 3 min</small></div></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-8">
        <div className="panel p-5 lg:p-6 min-h-[270px] flex flex-col">
          <div className="flex items-start justify-between">
            <div className="integration-icon sap"><span>SAP</span></div>
            <label className="switch"><input type="checkbox" defaultChecked /><span /></label>
          </div>
          <div className="mt-5"><div className="flex items-center gap-2"><h2 className="section-title">Sincronización ERP</h2><span className="status-badge success">Conectado</span></div><p className="section-subtitle mt-1.5">SAP Business One · API REST</p></div>
          <div className="mt-auto pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
            <div><p className="text-[11px] text-slate-500">Última sincronización</p><p className="text-xs text-slate-300 mt-1">Hoy, 08:30 · hace 42 minutos</p></div>
            <button onClick={doSync} disabled={syncing} className="secondary-button"><Icon name="refresh" size={14} className={syncing ? 'animate-spin' : ''} />{syncing ? 'Sincronizando' : 'Forzar ahora'}</button>
          </div>
        </div>
        <div className="panel p-5 lg:p-6 min-h-[270px]">
          <div className="flex items-center justify-between"><div><h2 className="section-title">Carga manual de planillas</h2><p className="section-subtitle mt-1.5">CSV o Excel · hasta 25 MB</p></div><div className="integration-icon"><Icon name="file" /></div></div>
          <button onClick={() => inputRef.current?.click()} onDragOver={(e: any) => e.preventDefault()} onDrop={(e: any) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }} className={`drop-zone ${upload ? 'uploaded' : ''}`}>
            {upload ? <><span className="upload-check"><Icon name="check" /></span><div><p>{upload}</p><small>Archivo validado en servidor · Haz clic para reemplazar</small></div></> : <><span className="upload-icon"><Icon name="cloud" size={22} /></span><div><p>Arrastra aquí tu reporte de stock (.csv)</p><small>o haz clic para explorar archivos</small></div></>}
          </button>
          <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e: any) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
        </div>
      </div>
      <div className="panel mt-4 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div><h2 className="section-title">Auditoría de lotes recientes</h2><p className="section-subtitle mt-1">Trazabilidad completa de cada fuente procesada</p></div>
          <button className="secondary-button"><Icon name="upload" size={14} />Exportar historial</button>
        </div>
        <div className="overflow-x-auto"><table>
          <thead><tr><th>ID lote</th><th>Fecha / hora</th><th>Origen</th><th>Registros</th><th>Estado de validación</th><th className="text-right">Acción</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id}><td className="font-mono text-[11px] text-slate-300">{row.id}</td><td>{row.date}</td><td><span className="source-cell"><i className={row.source.startsWith('SAP') ? 'sap' : 'excel'}>{row.source.startsWith('SAP') ? 'S' : 'X'}</i>{row.source}</span></td><td className="font-mono">{row.records}</td><td><span className={`status-badge ${row.tone}`}><span className="badge-dot" />{row.status}</span></td><td className="text-right"><button className="table-action">Ver detalle <Icon name="arrow" size={13} /></button></td></tr>)}</tbody>
        </table></div>
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500"><span>Mostrando {rows.length} de 128 lotes</span><button className="text-slate-300 hover:text-emerald-400">Ver historial completo →</button></div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        {dataStats.map(s => <div key={s.label} className="panel px-5 py-4 flex items-center gap-3"><div className="data-icon"><Icon name={s.icon} /></div><div><p className="font-mono text-base font-semibold text-white">{s.value}</p><p className="text-[11px] text-slate-500">{s.label}</p></div></div>)}
      </div>
    </main>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [user, setUser] = useState<AuthUser | null>(() => api.getStoredUser())
  const [loginOpen, setLoginOpen] = useState(false)

  const handleLogout = () => {
    api.logout()
    setUser(null)
  }

  const handleLoginSuccess = (newUser: AuthUser) => {
    setUser(newUser)
  }

  const content = useMemo(() => {
    if (page === 'dashboard') return <Dashboard user={user} />
    if (page === 'store') return <StoreApp />
    return <Integration />
  }, [page, user])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />
      <div className="min-w-0 flex-1">
        <Topbar
          page={page}
          setPage={setPage}
          user={user}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
        />
        {content}
      </div>
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}

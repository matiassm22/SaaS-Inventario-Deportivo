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
  | 'download'
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
  | 'x'

function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    activity: <><path d="M3 12h4l2.5-7 4 14 2.5-7h5" /></>,
    alert: <><path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2Z" /><path d="M12 9v4M12 17h.01" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    barcode: <><path d="M3 5v14M7 5v14M10 5v14M15 5v14M18 5v14M21 5v14" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M8 9h2M14 9h2M8 13h2M14 13h2M9 21v-4h6v4" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    cloud: <><path d="M17.5 19H6a4 4 0 0 1-.5-8A6 6 0 0 1 17 9a5 5 0 0 1 .5 10Z" /><path d="M12 12v6M9.5 14.5 12 12l2.5 2.5" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-6h6v6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
    lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M3 4v6h6M21 20v-6h-6" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l-1.1 1.7a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3L6.3 16.9a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4.8v-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l1.1-1.7a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4.8h4v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l1.1 1.7a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4h-.2a1.7 1.7 0 0 0-1.6 1Z" /></>,
    spark: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z" /></>,
    store: <><path d="M3 9h18l-2-6H5Z" /><path d="M5 9v12h14V9M9 21v-6h6v6" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    x: <><path d="M18 6 6 18M6 6l12 12" /></>,
  }
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="logo-mark">
        <span />
        <span />
        <span />
      </div>
      {!compact && (
        <div className="font-semibold tracking-[-.04em] text-white text-[17px] flex items-center gap-1.5">
          <span>SportStock</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-normal border border-emerald-500/20">
            AI
          </span>
        </div>
      )}
    </div>
  )
}

type Page = 'dashboard' | 'store' | 'integration'

function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: AuthUser) => void
}) {
  const [email, setEmail] = useState('gerente@marathonsports.cl')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
    const e = (loginEmail || email).trim()
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
    {
      label: 'Gerente Operaciones',
      name: 'Matías Muñoz',
      email: 'gerente@marathonsports.cl',
      role: 'GERENTE_OPERACIONES',
      tenant: 'Marathon Sports',
    },
    {
      label: 'Jefe de Tienda',
      name: 'Encargado Costanera',
      email: 'tienda@marathonsports.cl',
      role: 'JEFE_TIENDA',
      tenant: 'Costanera Center',
    },
    {
      label: 'Auditor Financiero',
      name: 'Auditor Externo',
      email: 'auditor@marathonsports.cl',
      role: 'AUDITOR',
      tenant: 'Marathon Sports',
    },
    {
      label: 'Gerencia Sparta',
      name: 'Gerencia Cadena',
      email: 'gerente@sparta.cl',
      role: 'GERENTE_OPERACIONES',
      tenant: 'Sparta Deportes',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="panel max-w-md w-full max-h-[92vh] flex flex-col border border-slate-700 bg-slate-900 shadow-2xl rounded-2xl my-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo compact />
            <div>
              <h2 className="text-sm font-semibold text-white">Autenticación Empresarial</h2>
              <p className="text-[11px] text-slate-400">Control Multi-Inquilino y Roles RBAC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 leading-relaxed flex items-start gap-2">
              <Icon name="alert" size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-300 mb-2">Acceso rápido por perfil y tenant:</p>
            <div className="grid gap-2">
              {quickUsers.map((u) => (
                <button
                  key={u.email}
                  disabled={loading}
                  onClick={() => handleLogin(u.email, 'Password123!')}
                  className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                      {u.label} · <span className="text-slate-400 font-normal">{u.name}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-emerald-400 shrink-0 border border-emerald-500/20">
                    {u.tenant}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-300 mb-2">O ingrese credenciales corporativas:</p>
            <form
              onSubmit={(e: any) => {
                e.preventDefault()
                handleLogin()
              }}
              className="space-y-3"
            >
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
                className="w-full primary-button py-2.5 text-xs font-medium flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {loading ? <Icon name="refresh" className="animate-spin" size={14} /> : <Icon name="check" size={14} />}
                {loading ? 'Verificando con servidor...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function InsightModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel max-w-lg w-full p-6 border border-slate-700 bg-slate-900 shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-400/10 text-emerald-400 grid place-items-center">
              <Icon name="spark" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Análisis Predictivo de Demanda</h2>
              <p className="text-[11px] text-slate-400">Algoritmo Holt-Winters Triple Exponencial</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="font-semibold text-emerald-300 mb-1">Evento Estacional: Maratón de Santiago 2026</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              El motor detectó un incremento de demanda proyectada de <strong>+35%</strong> en la categoría de calzado Running técnico (ej. Nike Vaporfly 3 y zapatillas de competición con placa de carbono).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center pt-2">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Costo Evitado</p>
              <p className="text-lg font-bold text-white font-mono mt-1">$4,2M CLP</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Por quiebres no ocurridos</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Lead Time Óptimo</p>
              <p className="text-lg font-bold text-white font-mono mt-1">2 semanas</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Anticipación recomendada</p>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Recomendación: Validar y aprobar las 3 órdenes sugeridas pendientes para Costanera Center y Parque Arauco antes del cierre operativo del viernes.
            </p>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="primary-button text-xs py-1.5 px-4">
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  if (!isOpen) return null

  const catalog = [
    { sku: 'RUN-001', name: 'Nike Vaporfly 3', category: 'Running', stockCostanera: 3, stockArauco: 15, stockVespucio: 8, status: 'Crítico' },
    { sku: 'RUN-008', name: 'Cortaviento Trail Shield', category: 'Running', stockCostanera: 6, stockArauco: 20, stockVespucio: 12, status: 'Crítico' },
    { sku: 'FUT-023', name: 'Balón Torneo Pro Match N°5', category: 'Fútbol', stockCostanera: 14, stockArauco: 12, stockVespucio: 18, status: 'Preventivo' },
    { sku: 'FIT-012', name: 'Polera Compresión Dry-Fit', category: 'Fitness', stockCostanera: 25, stockArauco: 30, stockVespucio: 18, status: 'Preventivo' },
    { sku: 'FUT-104', name: 'Camiseta Local Oficial 2026', category: 'Fútbol', stockCostanera: 40, stockArauco: 45, stockVespucio: 35, status: 'Óptimo' },
  ]

  const filtered = catalog.filter(
    (c) =>
      c.sku.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="panel max-w-lg w-full p-5 border border-slate-700 bg-slate-900 shadow-2xl rounded-2xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Icon name="search" size={18} className="text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
            placeholder="Buscar por SKU, nombre de producto o disciplina..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-800/70">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">No se encontraron productos para "{query}"</p>
          ) : (
            filtered.map((item) => (
              <div key={item.sku} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.sku}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.category} · Costanera: <strong className="text-slate-300">{item.stockCostanera} u.</strong> · Arauco: <strong className="text-slate-300">{item.stockArauco} u.</strong>
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    item.status === 'Crítico'
                      ? 'bg-red-500/10 text-red-400'
                      : item.status === 'Preventivo'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))
          )}
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
  page: Page
  setPage: (p: Page) => void
  user: AuthUser | null
  onOpenLogin: () => void
  onLogout: () => void
}) {
  const items: { id: Page; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Vista general', icon: 'home' },
    { id: 'store', label: 'Operación tienda', icon: 'store' },
    { id: 'integration', label: 'Integraciones', icon: 'database' },
  ]

  const userInitials = user ? user.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'AN'

  return (
    <aside className="hidden xl:flex w-[232px] shrink-0 border-r border-slate-800/80 bg-[#0a0e17] flex-col p-4">
      <div className="h-14 flex items-center px-2 mb-4">
        <Logo />
      </div>
      <p className="eyebrow px-3 mb-2">Plataforma</p>
      <nav className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`nav-item cursor-pointer ${page === item.id ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-7">
        <p className="eyebrow px-3 mb-2">Gestión</p>
        <button
          onClick={() => setPage('dashboard')}
          className="nav-item cursor-pointer"
        >
          <Icon name="layers" size={18} />
          Órdenes sugeridas
          <span className="nav-count">3</span>
        </button>
        <button
          onClick={() => setPage('dashboard')}
          className="nav-item cursor-pointer"
        >
          <Icon name="activity" size={18} />
          Predicciones
        </button>
        <button
          onClick={() => setPage('integration')}
          className="nav-item cursor-pointer"
        >
          <Icon name="settings" size={18} />
          Configuración
        </button>
      </div>
      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <span className="live-dot" />
          Motor predictivo
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 truncate">
          Tenant: <span className="text-white">{user ? user.cadena_nombre : 'Marathon Sports'}</span>
        </p>
      </div>
      <div className="flex items-center gap-3 px-2 pt-4 mt-3 border-t border-slate-800">
        <div className="avatar">{userInitials}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">{user ? user.nombre : 'Sin sesión'}</p>
          <p className="text-[11px] text-slate-400 truncate">{user ? user.rol : 'Haga clic para ingresar'}</p>
        </div>
        {user ? (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="ml-auto text-slate-400 hover:text-red-400 cursor-pointer p-1"
          >
            <Icon name="logout" size={16} />
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            title="Iniciar sesión"
            className="ml-auto text-emerald-400 hover:text-emerald-300 cursor-pointer p-1"
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
  user,
  onOpenLogin,
  onLogout,
}: {
  isOpen: boolean
  onClose: () => void
  page: Page
  setPage: (p: Page) => void
  user: AuthUser | null
  onOpenLogin: () => void
  onLogout: () => void
}) {
  if (!isOpen) return null

  const items: { id: Page; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Vista general', icon: 'home' },
    { id: 'store', label: 'Operación tienda', icon: 'store' },
    { id: 'integration', label: 'Integraciones', icon: 'database' },
  ]

  return (
    <div className="fixed inset-0 z-50 xl:hidden flex">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-72 max-w-[80vw] bg-[#0a0e17] border-r border-slate-800 flex flex-col p-4 z-10 animate-slide-right">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Logo />
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
            <Icon name="x" size={20} />
          </button>
        </div>
        <p className="eyebrow px-3 mt-4 mb-2">Plataforma</p>
        <nav className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id)
                onClose()
              }}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="avatar">{user ? user.nombre[0] : 'U'}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user ? user.nombre : 'Usuario Invitado'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user ? user.rol : 'Sin sesión iniciada'}</p>
            </div>
          </div>
          {user ? (
            <button
              onClick={() => {
                onLogout()
                onClose()
              }}
              className="w-full secondary-button text-xs py-2 justify-center text-red-400 hover:text-red-300"
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
  page: Page
  setPage: (p: Page) => void
  user: AuthUser | null
  onOpenLogin: () => void
  onLogout: () => void
  onOpenSearch: () => void
  onOpenMobileMenu: () => void
}) {
  return (
    <header className="h-[68px] sm:h-[72px] border-b border-slate-800/80 bg-[#0b0f19]/90 flex items-center px-4 sm:px-6 lg:px-7 gap-3 sm:gap-4 sticky top-0 z-20 backdrop-blur-xl">
      <button
        onClick={onOpenMobileMenu}
        className="icon-button xl:hidden grid place-items-center text-slate-300 hover:text-white"
        aria-label="Menú principal"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="xl:hidden">
        <Logo compact />
      </div>

      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 min-w-0">
        <span className="font-medium text-slate-100 truncate">
          {page === 'dashboard' ? 'Vista general' : page === 'store' ? 'Operación en tienda' : 'Integraciones y datos'}
        </span>
        <span className="text-slate-700">/</span>
        <span className="text-emerald-400 font-semibold truncate">
          {user ? user.cadena_nombre : 'Marathon Sports Chile'}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="mobile-nav xl:hidden flex">
          {(['dashboard', 'store', 'integration'] as Page[]).map((id, i) => (
            <button
              key={id}
              aria-label={id}
              className={page === id ? 'active' : ''}
              onClick={() => setPage(id)}
            >
              <Icon name={i === 0 ? 'home' : i === 1 ? 'store' : 'database'} size={16} />
            </button>
          ))}
        </div>

        <button
          onClick={onOpenSearch}
          className="icon-button grid place-items-center text-slate-400 hover:text-white"
          title="Buscar productos (SKU)"
        >
          <Icon name="search" size={17} />
        </button>

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="hidden md:inline text-[11px] font-mono text-slate-300 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50 truncate max-w-[150px]">
              {user.rol}
            </span>
            <button
              onClick={onOpenLogin}
              title="Cambiar usuario o perfil"
              className="hidden sm:inline text-xs text-slate-400 hover:text-emerald-400 underline ml-1 cursor-pointer"
            >
              Cambiar
            </button>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="icon-button text-slate-400 hover:text-red-400 ml-1 cursor-pointer grid place-items-center"
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

interface KpiItem {
  title: string
  value: string
  suffix?: string
  meta: string
  detail: string
  tone: string
  spark: string
}

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
        <svg viewBox="0 0 105 28" className={`sparkline ${item.tone}`}>
          <polyline points={item.spark} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

function ForecastChart({ weeks = 4 }: { weeks?: number }) {
  const chartLabels = [
    { x: 48, val: 'S1' },
    { x: 135, val: 'S2' },
    { x: 225, val: 'S3' },
    { x: 315, val: 'S4' },
    { x: 400, val: 'S5' },
    { x: 490, val: 'S6' },
    { x: 580, val: 'S7' },
  ]

  return (
    <div className="panel p-4 sm:p-5 lg:p-6 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Proyección de demanda · Running y Fútbol</h2>
          <p className="section-subtitle mt-0.5">Ventana de {weeks} semanas vs. capacidad de reposición</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2">
            <span className="legend-dot bg-emerald-400 w-2 h-2 rounded-full inline-block" />
            Proyección IA
          </span>
          <span className="flex items-center gap-2">
            <span className="legend-dot bg-slate-500 w-2 h-2 rounded-full inline-block" />
            Histórico
          </span>
        </div>
      </div>
      <div className="mt-6 relative overflow-x-auto">
        <svg viewBox="0 0 640 220" className="w-full min-w-[320px] h-48 sm:h-56 stroke-slate-800">
          {[40, 80, 120, 160, 200].map((y) => (
            <line key={y} x1="30" y1={y} x2="630" y2={y} strokeDasharray="3 3" />
          ))}
          <path d="M 48 180 Q 135 160 225 150 T 400 120 T 490 85 T 580 62" fill="none" stroke="#10b981" strokeWidth="3" />
          <path d="M 48 185 Q 135 175 225 165 T 400 150 T 490 142 T 580 138" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
          {chartLabels.map((p) => (
            <circle key={p.x} cx={p.x} cy="100" r="3.5" fill="#10b981" />
          ))}
        </svg>
        <div className="flex justify-between text-[11px] text-slate-500 px-4 mt-2 font-mono">
          {chartLabels.map((l) => (
            <span key={l.val}>Semana {l.val}</span>
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400 gap-2">
        <span>
          Confianza algorítmica: <strong className="text-emerald-400 font-semibold">94,2%</strong>
        </span>
        <span>Modelo: Holt-Winters estacional con factor retail</span>
      </div>
    </div>
  )
}

function ReplenishmentList({
  liveOrders,
  sucursalFilter = 'TODAS',
}: {
  liveOrders?: DashboardResponse['sugerencias_urgentes']
  sucursalFilter?: string
}) {
  const [approved, setApproved] = useState<string[]>([])
  const [expandedSku, setExpandedSku] = useState<string | null>(null)
  const [batchApproved, setBatchApproved] = useState(false)

  const items = useMemo(() => {
    let base = liveOrders && liveOrders.length > 0
      ? liveOrders.map((o) => ({
          sku: o.sku_codigo,
          name: o.nombre_producto,
          detail: o.sucursal_nombre,
          qty: `+${o.cantidad_sugerida} u.`,
          chip: o.evento_estacional,
          confidence: o.confidence_score,
          level: o.formula_desglose.stock_actual <= 3 ? 'critical' : 'warning',
          formula: `Demanda esperada (${o.formula_desglose.demanda_esperada}) + Seguridad (${o.formula_desglose.stock_seguridad}) - Stock actual (${o.formula_desglose.stock_actual}) = ${o.cantidad_sugerida} unidades`,
        }))
      : [
          { sku: 'RUN-001', name: 'Nike Vaporfly 3 (Talla 42)', detail: 'Sucursal Costanera Center', qty: '+25 u.', chip: '+35% Maratón Santiago', confidence: 94, level: 'critical', formula: 'Demanda (28) + Seguridad (5) - Stock actual (3) = 25 u.' },
          { sku: 'RUN-008', name: 'Cortaviento Trail Shield', detail: 'Sucursal Costanera Center', qty: '+18 u.', chip: 'Pico estacional abrigo', confidence: 91, level: 'critical', formula: 'Demanda (20) + Seguridad (4) - Stock actual (6) = 18 u.' },
          { sku: 'FUT-023', name: 'Balón Torneo Pro Match N°5', detail: 'Sucursal Parque Arauco', qty: '+28 u.', chip: 'Torneo Nacional 2026', confidence: 87, level: 'warning', formula: 'Demanda (34) + Seguridad (6) - Stock actual (12) = 28 u.' },
        ]

    if (sucursalFilter !== 'TODAS') {
      base = base.filter((i) => i.detail.toLowerCase().includes(sucursalFilter.toLowerCase()))
    }

    return base
  }, [liveOrders, sucursalFilter])

  const handleApprove = async (sku: string) => {
    setApproved((prev) => [...prev, sku])
    await api.approveOrder(sku)
  }

  const handleApproveAll = async () => {
    const allSkus = items.map((i) => i.sku)
    setApproved((prev) => Array.from(new Set([...prev, ...allSkus])))
    setBatchApproved(true)
    for (const sku of allSkus) {
      await api.approveOrder(sku)
    }
    setTimeout(() => setBatchApproved(false), 4000)
  }

  return (
    <div className="panel h-full min-h-[360px] flex flex-col">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Reabastecimiento urgente</h2>
          <p className="section-subtitle">Priorizado por riesgo y lead time de sucursal</p>
        </div>
        <button
          onClick={handleApproveAll}
          disabled={items.every((i) => approved.includes(i.sku))}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer shrink-0 disabled:opacity-40"
        >
          Aprobar todas ({items.length})
        </button>
      </div>

      {batchApproved && (
        <div className="mx-4 mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
          <Icon name="check" size={15} />
          <span>Todas las órdenes fueron aprobadas y reflejadas en stock en tránsito.</span>
        </div>
      )}

      <div className="divide-y divide-slate-800/80 flex-1 overflow-y-auto max-h-[340px]">
        {items.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">No hay órdenes pendientes para esta sucursal.</p>
        ) : (
          items.map((item) => {
            const done = approved.includes(item.sku)
            const isExpanded = expandedSku === item.sku
            return (
              <div key={item.sku} className="p-4 lg:px-5 hover:bg-slate-800/20 transition-colors">
                <div className="flex gap-3">
                  <span className={`risk-bar ${item.level}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-100 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {item.detail} · <span className="font-mono">{item.sku}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-semibold text-emerald-400">{item.qty}</p>
                        <p className="text-[10px] text-slate-500">{item.confidence}% conf.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="mini-chip">{item.chip}</span>
                      <button
                        onClick={() => setExpandedSku(isExpanded ? null : item.sku)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                      >
                        {isExpanded ? 'Ocultar fórmula' : 'Ver fórmula'}
                      </button>
                      <button
                        onClick={() => handleApprove(item.sku)}
                        disabled={done}
                        className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          done
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 border border-emerald-500/20'
                        }`}
                      >
                        {done ? 'Aprobada ✓' : 'Aprobar orden'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2.5 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
                        {item.formula}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="p-3 border-t border-slate-800 text-center">
        <span className="text-[11px] text-slate-500 font-mono">
          {items.filter((i) => approved.includes(i.sku)).length} de {items.length} órdenes aprobadas
        </span>
      </div>
    </div>
  )
}

function Dashboard({
  user,
  onOpenInsight,
}: {
  user?: AuthUser | null
  onOpenInsight: () => void
}) {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [sucursal, setSucursal] = useState<string>('TODAS')
  const [horizonte, setHorizonte] = useState<number>(4)

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
    const isFiltered = sucursal !== 'TODAS'
    const criticosCount = isFiltered ? (sucursal.includes('Costanera') ? 2 : 1) : (data?.kpis.skus_quiebre_critico || 2)
    const ordenesCount = isFiltered ? (sucursal.includes('Costanera') ? 2 : 1) : (data?.kpis.ordenes_sugeridas_count || 3)

    return [
      {
        title: 'SKUs en quiebre crítico',
        value: String(criticosCount),
        meta: isFiltered ? 'Filtrado' : '+3',
        detail: isFiltered ? `En ${sucursal}` : 'vs. semana anterior',
        tone: 'red',
        spark: '5,24 18,22 31,23 44,15 58,17 72,8 87,10 100,4',
      },
      {
        title: 'Demanda proyectada',
        value: horizonte === 8 ? '+24,8%' : horizonte === 2 ? '+11,2%' : (data?.kpis.demanda_proyectada_delta || '+18,5%'),
        meta: 'Tendencia',
        detail: 'Fútbol & Running 2026',
        tone: 'green',
        spark: '5,23 18,18 31,20 44,12 58,14 72,7 87,9 100,3',
      },
      {
        title: 'Órdenes sugeridas',
        value: String(ordenesCount),
        suffix: 'pendientes',
        meta: 'Revisar',
        detail: isFiltered ? '$12,1M en reposición' : `${data?.kpis.monto_reposicion_estimado || '$18,4M'} reposición`,
        tone: 'amber',
        spark: '5,20 18,20 31,15 44,17 58,10 72,12 87,8 100,7',
      },
      {
        title: 'Nivel de servicio de red',
        value: data?.kpis.nivel_servicio_red || '91,4%',
        meta: 'Meta ≥95%',
        detail: '−3,6 pts bajo objetivo',
        tone: 'slate',
        spark: '5,14 18,13 31,12 44,15 58,12 72,13 87,8 100,9',
      },
    ]
  }, [data, sucursal, horizonte])

  const firstName = user ? user.nombre.split(' ')[0] : 'Matías'

  return (
    <main className="page-wrap">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
        <div>
          <p className="eyebrow text-emerald-400 mb-1.5">Monitoreo Predictivo en Vivo</p>
          <h1 className="page-title">Buenos días, {firstName}</h1>
          <p className="page-subtitle">
            Cadena: <strong className="text-white">{user ? user.cadena_nombre : 'Marathon Sports Chile'}</strong> · Hay{' '}
            {data ? data.kpis.skus_quiebre_critico : 2} SKUs que requieren atención inmediata en sucursales.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="relative">
            <select
              value={sucursal}
              onChange={(e: any) => setSucursal(e.target.value)}
              className="select-pill appearance-none pr-8 cursor-pointer outline-none"
            >
              <option value="TODAS">Todas las sucursales (3)</option>
              <option value="Costanera">Costanera Center</option>
              <option value="Arauco">Parque Arauco</option>
              <option value="Vespucio">Plaza Vespucio</option>
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
              <option value={8}>Próximas 8 semanas</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-3 text-slate-400">
              <Icon name="chevron" size={14} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
        {currentKpis.map((item) => (
          <KpiCard key={item.title} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <div className="xl:col-span-7 2xl:col-span-8">
          <ForecastChart weeks={horizonte} />
        </div>
        <div className="xl:col-span-5 2xl:col-span-4">
          <ReplenishmentList liveOrders={data?.sugerencias_urgentes} sucursalFilter={sucursal} />
        </div>
      </div>

      <div className="panel mt-4 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center border-emerald-500/20 bg-gradient-to-r from-slate-900 to-[#0e1c18]">
        <div className="h-10 w-10 rounded-lg bg-emerald-400/10 text-emerald-400 grid place-items-center shrink-0">
          <Icon name="spark" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Insight Predictivo de SportStockAI</p>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            La demanda de Running subirá un 35% por la Maratón de Santiago. Anticipar 2 semanas el reabastecimiento reduce el costo de quiebre en $4,2M CLP.
          </p>
        </div>
        <button
          onClick={onOpenInsight}
          className="secondary-button sm:ml-auto shrink-0 cursor-pointer text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
        >
          Ver análisis detallado →
        </button>
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

function StoreApp() {
  const [checked, setChecked] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning'>('all')
  const [scannedSku, setScannedSku] = useState('')
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const [alertItems, setAlertItems] = useState<StoreAlert[]>([
    { sku: 'RUN-001', name: 'Nike Vaporfly 3', variant: 'Talla 42 · Running', current: 3, required: 8, eta: 'Jueves 26', status: 'critical' },
    { sku: 'RUN-008', name: 'Cortaviento Trail Shield', variant: 'Talla M · Running', current: 6, required: 12, eta: 'Viernes 27', status: 'critical' },
    { sku: 'FUT-023', name: 'Balón Torneo Pro Match N°5', variant: 'Fútbol', current: 12, required: 18, eta: 'Lunes 30', status: 'warning' },
    { sku: 'FIT-012', name: 'Polera Compresión Dry-Fit', variant: 'Talla L · Fitness', current: 18, required: 20, eta: 'Martes 01', status: 'warning' },
  ])

  const filteredItems = useMemo(() => {
    if (activeTab === 'critical') return alertItems.filter((i) => i.status === 'critical')
    if (activeTab === 'warning') return alertItems.filter((i) => i.status === 'warning')
    return alertItems
  }, [alertItems, activeTab])

  const toggleCheck = async (sku: string) => {
    setChecked((prev) => (prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]))
    const res = await api.recordStoreSale(sku, 0)
    if (res.success && res.newStock !== undefined) {
      setAlertItems((prev) =>
        prev.map((item) => (item.sku === sku ? { ...item, current: res.newStock! } : item))
      )
    }
  }

  const handleSimulateScan = async (skuToScan?: string) => {
    const target = (skuToScan || scannedSku).trim().toUpperCase()
    if (!target) return

    setScanning(true)
    setScanMessage(null)

    setTimeout(async () => {
      setScanning(false)
      const found = alertItems.find((i) => i.sku.toUpperCase() === target)
      if (found) {
        setChecked((prev) => Array.from(new Set([...prev, found.sku])))
        setScanMessage(`✓ Código ${found.sku} verificado. "${found.name}" marcado en rack.`)
        await api.recordStoreSale(found.sku, 0)
      } else {
        setScanMessage(`El código ${target} no corresponde a los SKUs en alerta de esta sucursal.`)
      }
    }, 700)
  }

  return (
    <main className="page-wrap">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-400 mb-1.5">Módulo de Sala de Ventas</p>
          <h1 className="page-title">SportStock Móvil — Modo Tienda</h1>
          <p className="page-subtitle">Sincronización de reposición en sala y verificación física de inventario.</p>
        </div>
        <div className="store-badge shrink-0">
          <span className="store-indicator" />
          Sucursal Costanera Center
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
        <div className="lg:col-span-7 panel p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="status-badge critical">2 críticos</span>
                <span className="status-badge warning">2 preventivos</span>
              </div>
              <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${activeTab === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveTab('critical')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${activeTab === 'critical' ? 'bg-red-500/20 text-red-400 font-medium' : 'text-slate-400'}`}
                >
                  Críticos
                </button>
                <button
                  onClick={() => setActiveTab('warning')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${activeTab === 'warning' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-400'}`}
                >
                  Preventivos
                </button>
              </div>
            </div>

            <h2 className="section-title">Semáforo de reposición de sala</h2>
            <p className="section-subtitle mt-0.5">Prioridad de reposición desde bodega antes del horario de alta afluencia.</p>

            <div className="divide-y divide-slate-800/80 mt-4">
              {filteredItems.map((item) => {
                const isDone = checked.includes(item.sku)
                return (
                  <div key={item.sku} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-100 truncate">{item.name}</p>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            item.status === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {item.sku}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {item.variant} · Stock actual: <strong className="text-slate-200">{item.current} u.</strong> (mínimo: {item.required} u.)
                      </p>
                    </div>
                    <button
                      onClick={() => toggleCheck(item.sku)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0 cursor-pointer ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-700 hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      {isDone ? '✓ Confirmado' : 'Confirmar en rack'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400 mt-4">
            <Icon name="barcode" size={20} className="text-emerald-400 shrink-0" />
            <span>
              {checked.length} de {alertItems.length} SKUs verificados físicamente en el rack de ventas hoy.
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 panel p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="section-title">Lector de código de barras físico</h2>
            <p className="section-subtitle mt-0.5">
              Simulador interactivo EAN-13 / Code-128 integrado con la base de datos de la tienda.
            </p>

            <div className="scanner-frame mt-4">
              <div className="scanner-line" />
              <div className="text-center px-4 z-10">
                <Icon name="barcode" size={44} className="text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-300 font-semibold tracking-wider">
                  {scanning ? 'LEYENDO CÓDIGO...' : 'VISOR ÓPTICO ACTIVO'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Apunta el lector láser o usa los atajos rápidos</p>
              </div>
            </div>

            {scanMessage && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs leading-relaxed ${
                  scanMessage.startsWith('✓')
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                }`}
              >
                {scanMessage}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 mb-2">Simular lectura de código de barras:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedSku}
                  onChange={(e: any) => setScannedSku(e.target.value)}
                  placeholder="Ej: RUN-001, RUN-008"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none uppercase font-mono"
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
                {['RUN-001', 'RUN-008', 'FUT-023'].map((sku) => (
                  <button
                    key={sku}
                    onClick={() => {
                      setScannedSku(sku)
                      handleSimulateScan(sku)
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700 cursor-pointer"
                  >
                    {sku}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-center mt-4">
            <div>
              <p className="text-xs font-semibold text-slate-200">Cámara activa</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sin latencia</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Doble vía</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Nube en vivo</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Modo offline</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Bodega / rack</p>
            </div>
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

function Integration() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [upload, setUpload] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [rows, setRows] = useState<AuditRow[]>([
    { id: 'LT-2026-1122-04', date: 'Hoy, 08:30', source: 'SAP Business One', records: '12.458', status: 'Validado', tone: 'success' },
    { id: 'LT-2026-1122-03', date: 'Ayer, 18:12', source: 'stock_semanal.xlsx', records: '4.862', status: 'Validado con alertas', tone: 'warning' },
    { id: 'LT-2026-1121-02', date: '21 Nov, 08:30', source: 'SAP Business One', records: '12.391', status: 'Validado', tone: 'success' },
    { id: 'LT-2026-1120-01', date: '20 Nov, 08:30', source: 'SAP Business One', records: '12.404', status: 'Validado', tone: 'success' },
  ])

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
        {
          id: res.lotCode!,
          date: 'Ahora mismo',
          source: file.name,
          records: '10 SKUs',
          status: 'Validado',
          tone: 'success',
        },
        ...prev,
      ])
    }
  }

  const doSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 1400)
  }

  const handleExportHistory = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID Lote,Fecha,Origen,Registros,Estado']
        .concat(rows.map((r) => `${r.id},${r.date},${r.source},${r.records},${r.status}`))
        .join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `auditoria_inventario_sportstock_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadTemplate = () => {
    const template =
      'data:text/csv;charset=utf-8,cadena_id,sucursal_codigo,sku_codigo,stock_actual,stock_minimo,lead_time_dias\n11111111-1111-1111-1111-111111111111,SUC-01,RUN-001,3,8,2\n11111111-1111-1111-1111-111111111111,SUC-01,RUN-008,6,12,2\n11111111-1111-1111-1111-111111111111,SUC-02,FUT-023,12,18,3\n'
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(template))
    link.setAttribute('download', 'plantilla_ingesta_inventario.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main className="page-wrap">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-400 mb-1.5">Centro de Datos B2B</p>
          <h1 className="page-title">Integraciones y Carga de Lotes</h1>
          <p className="page-subtitle">Alimentación continua para el motor predictivo y auditoría trazable.</p>
        </div>
        <div className="sync-status shrink-0">
          <span className="live-dot" />
          <div>
            <p>Conexión API Activa</p>
            <small>Sincronización cada 15 min</small>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="panel p-4 sm:p-6 flex flex-col justify-between">
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
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <h2 className="section-title">Sincronización ERP</h2>
                <span className="status-badge success">Conectado</span>
              </div>
              <p className="section-subtitle mt-1">SAP Business One / HANA · Conector REST Oficial</p>
            </div>
          </div>
          <div className="pt-5 border-t border-slate-800 flex items-center justify-between gap-3 mt-6">
            <div>
              <p className="text-[11px] text-slate-500">Última sincronización</p>
              <p className="text-xs text-slate-300 mt-0.5">Hoy, 08:30 · hace 42 minutos</p>
            </div>
            <button
              onClick={doSync}
              disabled={syncing}
              className="secondary-button cursor-pointer"
            >
              <Icon name="refresh" size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          </div>
        </div>

        <div className="panel p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Carga manual de planillas</h2>
                <p className="section-subtitle mt-1">Archivos CSV o Excel · Hasta 25 MB por lote</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                title="Descargar plantilla CSV oficial"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                Descargar plantilla .csv
              </button>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(e: any) => e.preventDefault()}
              onDrop={(e: any) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFileUpload(f)
              }}
              className={`drop-zone cursor-pointer ${upload ? 'uploaded' : ''}`}
            >
              {upload ? (
                <>
                  <span className="upload-check">
                    <Icon name="check" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{upload}</p>
                    <small>Archivo validado en servidor · Haz clic para cambiarlo</small>
                  </div>
                </>
              ) : (
                <>
                  <span className="upload-icon">
                    <Icon name="cloud" size={22} />
                  </span>
                  <div>
                    <p>Arrastra aquí tu reporte de stock (.csv)</p>
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
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h2 className="section-title">Auditoría de lotes recientes</h2>
            <p className="section-subtitle mt-0.5">Trazabilidad completa de cada fuente procesada en el SaaS</p>
          </div>
          <button
            onClick={handleExportHistory}
            className="secondary-button cursor-pointer text-xs self-start sm:self-auto"
          >
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-[11px] text-slate-300">{row.id}</td>
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
                    <span className="text-[11px] text-emerald-400 font-mono">Trazado ✓</span>
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

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [user, setUser] = useState<AuthUser | null>(() => api.getStoredUser())
  const [loginOpen, setLoginOpen] = useState(false)
  const [insightOpen, setInsightOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    api.logout()
    setUser(null)
  }

  const handleLoginSuccess = (newUser: AuthUser) => {
    setUser(newUser)
  }

  const content = useMemo(() => {
    if (page === 'dashboard') {
      return <Dashboard user={user} onOpenInsight={() => setInsightOpen(true)} />
    }
    if (page === 'store') {
      return <StoreApp />
    }
    return <Integration />
  }, [page, user])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col xl:flex-row">
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        page={page}
        setPage={setPage}
        user={user}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar
          page={page}
          setPage={setPage}
          user={user}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        {content}
      </div>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <InsightModal isOpen={insightOpen} onClose={() => setInsightOpen(false)} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

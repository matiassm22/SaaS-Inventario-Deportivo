import { useEffect, useState } from 'react'
import { api, type AuthUser } from '../services/api'
import type { CatalogProduct, TeamMember } from '../types/inventory'
import { BRANCHES } from '../data/seedCatalog'
import { Icon, Logo } from './Icons'

export function LoginModal({
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
      tenant: 'Marathon Sports',
    },
    {
      label: 'Jefe de Tienda',
      name: 'Encargado Costanera',
      email: 'tienda@marathonsports.cl',
      tenant: 'Costanera Center',
    },
    {
      label: 'Auditor Financiero',
      name: 'Auditor Externo',
      email: 'auditor@marathonsports.cl',
      tenant: 'Marathon Sports',
    },
    {
      label: 'Gerencia Sparta',
      name: 'Gerencia Cadena',
      email: 'gerente@sparta.cl',
      tenant: 'Sparta Deportes',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="panel max-w-md w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl my-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo compact />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Autenticación Empresarial</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Control Multi-Inquilino y Roles RBAC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 leading-relaxed flex items-start gap-2">
              <Icon name="alert" size={16} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Acceso rápido por perfil y tenant:</p>
            <div className="grid gap-2">
              {quickUsers.map((u) => (
                <button
                  key={u.email}
                  disabled={loading}
                  onClick={() => handleLogin(u.email, 'Password123!')}
                  className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {u.label} · <span className="text-slate-500 dark:text-slate-400 font-normal">{u.name}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-500/20">
                    {u.tenant}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">O ingrese credenciales corporativas:</p>
            <form
              onSubmit={(e: any) => {
                e.preventDefault()
                handleLogin()
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="usuario@cadena.cl"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
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

export function InsightModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="panel max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 grid place-items-center">
              <Icon name="spark" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Análisis Predictivo de Demanda</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Algoritmo Suavizamiento Exponencial Estacional</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Evento Estacional: Maratón de Santiago 2026</p>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              El motor detectó un incremento de demanda proyectada de <strong>+35%</strong> en la categoría de calzado
              Running técnico (ej. Nike Vaporfly 3 y zapatillas de competición con placa de carbono).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center pt-2">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Costo Evitado</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1">$4,2M CLP</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Por quiebres no ocurridos</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Lead Time Óptimo</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1">2 semanas</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Anticipación recomendada</p>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Recomendación: Validar y aprobar las órdenes sugeridas pendientes para Costanera Center y Parque Arauco
              antes del cierre operativo semanal.
            </p>
          </div>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="primary-button text-xs py-1.5 px-4">
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export function SearchModal({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}: {
  isOpen: boolean
  onClose: () => void
  products: CatalogProduct[]
  onSelectProduct: (skuId: string) => void
}) {
  const [query, setQuery] = useState('')
  if (!isOpen) return null

  const filtered = products
    .filter(
      (c) =>
        c.sku_id.toLowerCase().includes(query.toLowerCase()) ||
        c.nombre.toLowerCase().includes(query.toLowerCase()) ||
        c.disciplina.toLowerCase().includes(query.toLowerCase()) ||
        c.tipo.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 12)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="panel max-w-xl w-full p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Icon name="search" size={18} className="text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
            placeholder="Buscar en los 30 SKUs por código, nombre, tipo o disciplina..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-3 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">No se encontraron productos para "{query}"</p>
          ) : (
            filtered.map((item) => {
              const status =
                item.stock_actual === 0 ? 'Crítico' : item.stock_actual <= item.stock_minimo ? 'Preventivo' : 'Óptimo'
              const branch = BRANCHES.find((b) => b.id === item.sucursal_id)?.nombre || item.sucursal_id
              return (
                <button
                  key={item.sku_id}
                  onClick={() => {
                    onSelectProduct(item.sku_id)
                    onClose()
                  }}
                  className="w-full text-left py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-200 truncate">{item.nombre}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        {item.sku_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {item.disciplina} · {item.tipo} · {branch}:{' '}
                      <strong className="text-slate-900 dark:text-slate-200">{item.stock_actual} u.</strong> (mín. {item.stock_minimo})
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded shrink-0 ${
                      status === 'Crítico'
                        ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                        : status === 'Preventivo'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    }`}
                  >
                    {status}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export function GherkinDemoModal({
  isOpen,
  step,
  onClose,
  onGoToOrders,
}: {
  isOpen: boolean
  step: number
  onClose: () => void
  onGoToOrders: () => void
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="panel max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl space-y-4">
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded">
              Flujo Verificable · Criterio RNF-02
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-1.5">Criterio de Aceptación (Gherkin)</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              step >= 1
                ? 'bg-emerald-50 border-emerald-300 text-slate-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={step >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}>
                {step >= 2 ? '✓' : '●'}
              </span>
              <span>
                <strong>Dado:</strong> Catálogo con SKUs bajo el umbral estacional mínimo en góndola
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border transition-all ${
              step >= 3
                ? 'bg-emerald-50 border-emerald-300 text-slate-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={step >= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}>
                {step >= 4 ? '✓' : '●'}
              </span>
              <span>
                <strong>Cuando:</strong> Se ejecuta el motor predictivo con factor estacional (&lt; 3,0 s)
              </span>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border transition-all ${
              step >= 4
                ? 'bg-sky-50 border-sky-300 text-slate-900 dark:bg-sky-500/10 dark:border-sky-500/40 dark:text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={step >= 4 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}>
                {step >= 4 ? '✓' : '●'}
              </span>
              <span>
                <strong>Entonces:</strong> Se generan órdenes de reposición persistidas en la bandeja gerencial
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          {step >= 4 ? (
            <button onClick={onGoToOrders} className="primary-button text-xs px-4 py-2">
              Ver órdenes en bandeja
              <Icon name="arrow" size={14} />
            </button>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Icon name="refresh" size={14} className="animate-spin text-emerald-600 dark:text-emerald-400" />
              Ejecutando algoritmo predictivo...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function TeamModal({
  isOpen,
  onClose,
  teamMembers,
}: {
  isOpen: boolean
  onClose: () => void
  teamMembers: TeamMember[]
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="panel rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl max-h-[85vh] flex flex-col gap-4">
        <div className="flex justify-between items-start shrink-0">
          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded">
              Auditoría de Personal
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-1.5">Equipo & Últimas Gestiones</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Personal activo y trazabilidad de turno</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="bg-emerald-50 dark:bg-slate-800/60 border border-emerald-200 dark:border-slate-700 rounded-xl p-3 shrink-0">
          <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
            Último inventario cerrado: 23/11/2026 · 09:42:15
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
            Responsables: Joyce Honores (Aprobó) & Jorge Hormazabal (Contó)
          </div>
        </div>

        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {teamMembers.map((m) => (
            <div key={m.nombre} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${m.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                  >
                    {m.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{m.nombre}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">{m.rol}</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                  {m.estado}
                </span>
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">Última gestión realizada:</span>
                <span className="text-slate-800 dark:text-slate-200">{m.ultima_gestion}</span>
                <div className="text-[9px] font-mono text-slate-500 mt-1">
                  {m.fecha_gestion} · {m.sucursal}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="secondary-button w-full py-2.5 text-xs shrink-0">
          Cerrar detalle de personal
        </button>
      </div>
    </div>
  )
}

export function AdjustCountModal({
  item,
  responsibleName,
  onClose,
  onConfirm,
}: {
  item: CatalogProduct | null
  responsibleName: string
  onClose: () => void
  onConfirm: (skuId: string, newCount: number) => void
}) {
  const [count, setCount] = useState<number>(item?.stock_actual ?? 0)

  useEffect(() => {
    if (item) {
      setCount(item.stock_actual)
    }
  }, [item])

  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
      <div className="panel rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded">
              {item.sku_id}
            </span>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5">{item.nombre}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
          <span className="text-slate-600 dark:text-slate-400">Stock mínimo requerido:</span>
          <strong className="font-mono text-slate-900 dark:text-slate-200">{item.stock_minimo} unidades</strong>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Responsable del conteo:</span>
            <strong className="text-slate-900 dark:text-white">{responsibleName}</strong>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-600 dark:text-slate-400">Disciplina / Tipo:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {item.disciplina} · {item.tipo}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Conteo físico verificado en góndola:</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount((c) => Math.max(0, c - 1))}
              className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white flex items-center justify-center"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              value={count}
              onChange={(e: any) => setCount(Math.max(0, Number(e.target.value) || 0))}
              className="flex-1 text-center font-mono font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => setCount((c) => c + 1)}
              className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button onClick={onClose} className="secondary-button flex-1 py-2.5 text-xs">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(item.sku_id, count)}
            className="primary-button flex-1 py-2.5 text-xs"
          >
            Confirmar y Pedir
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useTheme, type ThemePreference } from '../context/ThemeContext'
import { Icon, type IconName } from '../components/Icons'

export function SettingsPage({ onResetDemoData }: { onResetDemoData: () => void }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [health, setHealth] = useState<{ checking: boolean; online: boolean; url: string; latencyMs?: number }>({
    checking: true,
    online: false,
    url: api.getApiBaseUrl(),
  })

  const check = async () => {
    setHealth((prev) => ({ ...prev, checking: true }))
    const res = await api.checkHealth()
    setHealth({ checking: false, ...res })
  }

  useEffect(() => {
    check()
  }, [])

  const themeChoices: Array<{ id: ThemePreference; title: string; desc: string; icon: IconName }> = [
    {
      id: 'light',
      title: 'Modo Claro',
      desc: 'Ideal para sala de ventas con luz natural o presentaciones en proyector.',
      icon: 'sun',
    },
    {
      id: 'dark',
      title: 'Modo Oscuro',
      desc: 'Diseñado para monitoreo prolongado en centros de operaciones y baja luz.',
      icon: 'moon',
    },
    {
      id: 'system',
      title: 'Automático (Sistema)',
      desc: 'Se adapta automáticamente a la preferencia de Windows, macOS, iOS o Android.',
      icon: 'monitor',
    },
  ]

  const tables = [
    { t: 'cadenas', k: 'id (PK), nombre, rut, tier', d: 'Aislamiento Multi-Inquilino (RLS)' },
    { t: 'sucursales', k: 'id (PK), cadena_id, codigo, nombre, lead_time_dias', d: 'Puntos de venta y tiempos de despacho' },
    { t: 'productos_sku', k: 'id (PK), cadena_id, sku_codigo, disciplina, precios', d: 'Catálogo deportivo normalizado' },
    { t: 'inventario_tienda', k: 'id (PK), sucursal_id, sku_id, stock_actual, stock_minimo', d: 'Existencias en tiempo real por sucursal' },
    { t: 'ventas_historicas', k: 'id (PK), sucursal_id, sku_id, fecha, unidades, monto', d: 'Demanda POS (Ley N° 21.719 sin PII)' },
    { t: 'ordenes_reposicion', k: 'id (PK), sucursal_id, sku_id, cantidad, estado, auditoría', d: 'Ciclo de aprobación gerencial' },
  ]

  return (
    <main className="page-wrap space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Arquitectura & Gobernanza</p>
          <h1 className="page-title">Configuración, Apariencia & BD Cloud</h1>
          <p className="page-subtitle">
            Preferencias de tema Claro/Oscuro, estado del gateway API, esquema relacional 3FN y Ley N° 21.719.
          </p>
        </div>

        <button onClick={onResetDemoData} className="secondary-button text-xs h-[38px] self-start sm:self-auto">
          <Icon name="refresh" size={14} />
          Restablecer Datos Demo Locales
        </button>
      </div>

      {/* APARIENCIA E INTERFAZ (MODO CLARO / OSCURO / SISTEMA) */}
      <div className="panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="section-title">Apariencia e Interfaz (Web Computador y Móvil)</h2>
            <p className="section-subtitle">
              Sincronizado entre todas las pestañas y vistas de escritorio y tienda móvil.
            </p>
          </div>
          <span className="status-badge success">
            <span className="badge-dot" />
            Activo: {resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {themeChoices.map((choice) => {
            const active = theme === choice.id
            return (
              <button
                key={choice.id}
                onClick={() => setTheme(choice.id)}
                className={`text-left rounded-xl p-4 border transition-all cursor-pointer ${
                  active
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg grid place-items-center ${
                      active
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Icon name={choice.icon} size={18} />
                  </div>
                  {active && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Seleccionado
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{choice.title}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{choice.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ESTADO DEL BACKEND */}
      <div className="panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="feature-icon">
            <Icon name="database" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="section-title">Estado del Servidor API REST (/api/v1)</h2>
              <span className={`status-badge ${health.checking ? 'warning' : health.online ? 'success' : 'warning'}`}>
                <span className="badge-dot" />
                {health.checking ? 'Verificando...' : health.online ? `Online (${health.latencyMs} ms)` : 'Modo Contingencia Local'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">{health.url}</p>
          </div>
        </div>
        <button onClick={check} className="secondary-button text-xs">
          <Icon name="refresh" size={14} className={health.checking ? 'animate-spin' : ''} />
          Probar conexión
        </button>
      </div>

      {/* TABLAS 3FN SUPABASE */}
      <div className="panel p-5 space-y-4">
        <div>
          <h2 className="section-title">Modelo Relacional 3FN (Supabase PostgreSQL Cloud)</h2>
          <p className="section-subtitle">100% protegido con Row-Level Security (RLS) por cadena_id</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tables.map((item) => (
            <div key={item.t} className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
              <div className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">{item.t}</div>
              <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{item.k}</div>
              <div className="text-[11px] text-slate-500">{item.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPLIANCE LEY 21.719 */}
      <div className="panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-emerald-200 dark:border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="feature-icon">
            <Icon name="shield" size={18} />
          </div>
          <div>
            <h2 className="section-title">Cumplimiento Ley N° 21.719 (Protección de Datos Personales Chile)</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              SportStockAI opera bajo arquitectura B2B libre de PII de consumidores finales: solo procesa SKUs, sucursales,
              unidades vendidas y montos agregados.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

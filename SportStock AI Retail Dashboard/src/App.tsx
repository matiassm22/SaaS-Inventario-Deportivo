import { useMemo, useRef, useState } from 'react'
import { api } from './services/api'

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
  const paths: Record<IconName, React.ReactNode> = {
    activity: <><path d="M3 12h4l2.5-7 4 14 2.5-7h5" /></>,
    alert: <><path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2Z" /><path d="M12 9v4M12 17h.01" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    barcode: <><path d="M3 5v14M7 5v14M10 5v14M15 5v14M18 5v14M21 5v14" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /></>,
    building: <><path d="M4 21V5l8-3 8 3v16M8 9h2M14 9h2M8 13h2M14 13h2M9 21v-4h6v4" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <><path d="m8 10 4 4 4-4" /></>,
    cloud: <><path d="M17.5 19H6a4 4 0 0 1-.5-8A6 6 0 0 1 17 9a5 5 0 0 1 .5 10Z" /><path d="M12 12v6M9.5 14.5 12 12l2.5 2.5" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-6h6v6" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M3 4v6h6M21 20v-6h-6" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
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

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const items: { id: Page; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Vista general', icon: 'home' },
    { id: 'store', label: 'Operación tienda', icon: 'store' },
    { id: 'integration', label: 'Integraciones', icon: 'database' },
  ]
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
        <p className="text-[11px] text-slate-500 mt-1.5">Actualizado hoy, 08:30 hrs</p>
      </div>
      <div className="flex items-center gap-3 px-2 pt-4 mt-3 border-t border-slate-800">
        <div className="avatar">MG</div>
        <div className="min-w-0"><p className="text-xs font-medium text-slate-200 truncate">Matías González</p><p className="text-[11px] text-slate-500">Gerente de Operaciones</p></div>
        <Icon name="more" className="ml-auto text-slate-500" />
      </div>
    </aside>
  )
}

function Topbar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <header className="h-[72px] border-b border-slate-800/80 bg-[#0b0f19]/90 flex items-center px-5 lg:px-7 gap-4 sticky top-0 z-20 backdrop-blur-xl">
      <div className="xl:hidden"><Logo /></div>
      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
        <span className="font-medium text-slate-100">{page === 'dashboard' ? 'Vista general' : page === 'store' ? 'Operación en tienda' : 'Integraciones y datos'}</span>
        <span className="text-slate-700">/</span><span>Marathon Sports Chile</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="mobile-nav xl:hidden">
          {(['dashboard', 'store', 'integration'] as Page[]).map((id, i) => <button key={id} aria-label={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon name={i === 0 ? 'home' : i === 1 ? 'store' : 'database'} size={17} /></button>)}
        </div>
        <button className="icon-button hidden sm:grid"><Icon name="search" /></button>
        <button className="icon-button hidden sm:grid"><Icon name="alert" /></button>
        <div className="avatar sm:hidden">MG</div>
      </div>
    </header>
  )
}

function SelectPill({ icon, children }: { icon?: IconName; children: React.ReactNode }) {
  return <button className="select-pill">{icon && <Icon name={icon} size={15} />}<span>{children}</span><Icon name="chevron" size={14} /></button>
}

const kpis = [
  { title: 'SKUs en quiebre crítico', value: '14', meta: '+3', detail: 'vs. semana anterior', tone: 'red', spark: '5,24 18,22 31,23 44,15 58,17 72,8 87,10 100,4' },
  { title: 'Demanda proyectada', value: '+18,5%', meta: 'Tendencia', detail: 'Fútbol · Torneo Nacional', tone: 'green', spark: '5,23 18,18 31,20 44,12 58,14 72,7 87,9 100,3' },
  { title: 'Órdenes sugeridas', value: '6', suffix: 'pendientes', meta: 'Revisar lote', detail: '$18,4M en reposición', tone: 'amber', spark: '5,20 18,20 31,15 44,17 58,10 72,12 87,8 100,7' },
  { title: 'Nivel de servicio de red', value: '91,4%', meta: 'Meta ≥95%', detail: '−3,6 pts bajo objetivo', tone: 'slate', spark: '5,14 18,13 31,12 44,15 58,12 72,13 87,8 100,9' },
]

function KpiCard({ item }: { item: typeof kpis[number] }) {
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

function ForecastChart() {
  const [discipline, setDiscipline] = useState('Todas')
  return (
    <div className="panel h-full min-h-[360px] p-5 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div><h2 className="section-title">Demanda semanal</h2><p className="section-subtitle">Venta histórica vs. pronóstico predictivo</p></div>
        <div className="tabs">{['Todas', 'Fútbol', 'Running', 'Fitness'].map(x => <button key={x} onClick={() => setDiscipline(x)} className={discipline === x ? 'active' : ''}>{x}</button>)}</div>
      </div>
      <div className="flex gap-5 mt-5 text-[11px] text-slate-400">
        <span className="flex items-center gap-2"><i className="legend-line solid" />Venta histórica real</span>
        <span className="flex items-center gap-2"><i className="legend-line dashed" />Pronóstico predictivo</span>
      </div>
      <div className="mt-4 h-[245px] relative">
        <svg viewBox="0 0 690 260" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="forecast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10b981" stopOpacity=".22" /><stop offset="1" stopColor="#10b981" stopOpacity="0" /></linearGradient>
          </defs>
          {[25, 80, 135, 190, 245].map(y => <line key={y} x1="45" y1={y} x2="680" y2={y} stroke="#1f2937" strokeWidth="1" />)}
          <line x1="350" y1="15" x2="350" y2="245" stroke="#334155" strokeDasharray="3 5" />
          <text x="355" y="22" fill="#64748b" fontSize="10">HOY</text>
          <path d="M350 140 C390 119,410 128,440 96 S500 78,530 88 S580 50,620 61 S655 34,680 42 L680 245 L350 245Z" fill="url(#forecast)" />
          <path d="M48 190 C80 177,105 182,135 157 S190 169,225 130 S280 143,315 117 S338 130,350 140" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
          <path d="M350 140 C390 119,410 128,440 96 S500 78,530 88 S580 50,620 61 S655 34,680 42" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="8 7" />
          {[['48','372'],['135','418'],['225','464'],['315','510'],['400','556'],['490','602'],['580','648']].map(([x, val]) => <text key={x} x={x} y="258" fill="#64748b" fontSize="10">{val}</text>)}
          {['800', '1.2k', '1.6k', '2.0k', '2.4k'].map((v, i) => <text key={v} x="3" y={249 - i * 55} fill="#64748b" fontSize="10">{v}</text>)}
          <circle cx="680" cy="42" r="5" fill="#0b0f19" stroke="#10b981" strokeWidth="3" />
        </svg>
        <div className="chart-tooltip"><span>Pronóstico sem. 6</span><strong>2.328 u.</strong><small>94% fiabilidad</small></div>
      </div>
    </div>
  )
}

const urgent = [
  { sku: 'RUN-001', name: 'Nike Vaporfly 3', detail: 'Talla 42 · Costanera Center', qty: '+25 u.', chip: '+35% Maratón Stgo.', confidence: 94, level: 'critical' },
  { sku: 'RUN-008', name: 'Cortaviento Trail Shield', detail: 'Costanera Center', qty: '+18 u.', chip: 'Pico estacional', confidence: 91, level: 'critical' },
  { sku: 'FUT-023', name: 'Balón Torneo Pro Match N°5', detail: 'Parque Arauco', qty: '+28 u.', chip: 'Torneo Nacional', confidence: 87, level: 'warning' },
]

function ReplenishmentList() {
  const [approved, setApproved] = useState<string[]>([])

  const handleApprove = async (sku: string) => {
    setApproved((prev) => [...prev, sku])
    // Llamada reactiva a la API REST (persistencia en DB)
    await api.approveOrder(sku)
  }

  return (
    <div className="panel h-full min-h-[360px] flex flex-col">
      <div className="p-5 border-b border-slate-800 flex items-start justify-between">
        <div><h2 className="section-title">Reabastecimiento urgente</h2><p className="section-subtitle">Priorizado por riesgo y lead time</p></div>
        <button className="icon-button small"><Icon name="more" /></button>
      </div>
      <div className="divide-y divide-slate-800/80 flex-1">
        {urgent.map(item => {
          const done = approved.includes(item.sku)
          return <div key={item.sku} className="p-4 lg:px-5">
            <div className="flex gap-3">
              <span className={`risk-bar ${item.level}`} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <div><p className="text-[13px] font-medium text-slate-100 truncate">{item.name}</p><p className="text-[11px] text-slate-500 mt-0.5">{item.sku} · {item.detail}</p></div>
                  <div className="text-right shrink-0 group relative"><p className="font-mono text-sm font-semibold text-emerald-400">{item.qty}</p><p className="text-[10px] text-slate-500 underline decoration-dotted cursor-help">Cantidad sugerida</p><div className="formula-tip">Demanda esperada (28) + Seguridad (5) − Stock actual (8) = <b>25 unidades</b></div></div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="season-chip"><Icon name="spark" size={11} />{item.chip}</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{item.confidence}% fiable</span>
                </div>
                <div className="confidence"><span style={{ width: `${item.confidence}%` }} /></div>
                <button disabled={done} onClick={() => handleApprove(item.sku)} className={`approve-button ${done ? 'done' : ''}`}>{done ? <><Icon name="check" size={14} />Pedido aprobado</> : <>Aprobar pedido<Icon name="arrow" size={14} /></>}</button>
              </div>
            </div>
          </div>
        })}
      </div>
      <button className="h-11 text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors border-t border-slate-800">Ver todas las sugerencias →</button>
    </div>
  )
}

function Dashboard() {
  return (
    <main className="page-wrap">
      <div className="flex flex-col lg:flex-row lg:items-end gap-5 justify-between">
        <div><p className="eyebrow text-emerald-400 mb-2">Lunes, 23 de junio</p><h1 className="page-title">Buenos días, Matías</h1><p className="page-subtitle">Hay 14 SKUs que requieren tu atención esta mañana.</p></div>
        <div className="flex flex-wrap gap-2"><SelectPill icon="building">Todas las sucursales (3)</SelectPill><SelectPill>Próximas 4 semanas</SelectPill></div>
      </div>
      <div className="grid sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 mt-7">{kpis.map(item => <KpiCard key={item.title} item={item} />)}</div>
      <div className="grid 2xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,.85fr)] gap-4 mt-4"><ForecastChart /><ReplenishmentList /></div>
      <div className="panel mt-4 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="h-10 w-10 rounded-lg bg-emerald-400/10 text-emerald-400 grid place-items-center"><Icon name="spark" /></div>
        <div><p className="text-sm font-medium text-slate-100">Insight de SportStock</p><p className="text-xs text-slate-400 mt-1">La demanda de Running subirá un 35% por la Maratón de Santiago. Anticipar 2 semanas reduce el costo de quiebre en $4,2M.</p></div>
        <button className="secondary-button sm:ml-auto shrink-0">Ver análisis</button>
      </div>
    </main>
  )
}

const storeAlerts = [
  { level: 'critical', title: 'Nike Vaporfly 3', variant: 'Talla 42 · Running', stock: 3, min: 8, eta: 'Jueves 26', sku: 'RUN-001' },
  { level: 'critical', title: 'Cortaviento Trail Shield', variant: 'Talla M · Running', stock: 6, min: 12, eta: 'Viernes 27', sku: 'RUN-008' },
  { level: 'warning', title: 'Balón Torneo Pro Match N°5', variant: 'Fútbol', stock: 12, min: 18, eta: 'Lunes 30', sku: 'FUT-023' },
]

function StoreApp() {
  const [counted, setCounted] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [scan, setScan] = useState(false)
  const filtered = storeAlerts.filter(x => x.title.toLowerCase().includes(query.toLowerCase()))
  return (
    <main className="page-wrap store-page">
      <div className="hidden lg:block mb-7"><p className="eyebrow text-emerald-400 mb-2">Vista móvil · operación en piso</p><h1 className="page-title">App de inventario en tienda</h1><p className="page-subtitle">Alertas claras para actuar sin dejar el pasillo.</p></div>
      <div className="phone-stage">
        <div className="phone">
          <div className="phone-status"><span>9:41</span><div className="phone-notch" /><span className="flex items-center gap-1"><i className="signal" /><i className="wifi" /><i className="battery" /></span></div>
          <div className="phone-header">
            <div className="flex items-center justify-between"><Logo /><button className="phone-avatar">MG</button></div>
            <button className="location-select"><Icon name="store" size={15} />Sucursal Costanera Center<Icon name="chevron" size={14} /></button>
            <div className="mt-5"><p className="text-[20px] font-semibold tracking-tight text-white">Hola, Matías</p><p className="text-xs text-slate-400 mt-1">Turno mañana · 08:00–16:00</p></div>
          </div>
          <div className="phone-content">
            <div className="status-counters">
              <div><span className="status-dot red" /><b>4</b><small>Críticos</small></div>
              <div><span className="status-dot amber" /><b>7</b><small>Preventivos</small></div>
              <div><span className="status-dot green" /><b>142</b><small>Óptimos</small></div>
            </div>
            <div className="search-box"><Icon name="search" size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar SKU o producto" /><button onClick={() => setScan(true)}><Icon name="barcode" size={20} /></button></div>
            <div className="flex items-end justify-between mt-6 mb-3"><div><p className="text-[15px] text-white font-semibold">Prioridad para hoy</p><p className="text-[11px] text-slate-500 mt-0.5">{filtered.length} tareas ordenadas por urgencia</p></div><button className="text-[11px] text-emerald-400 font-medium">Ver todas</button></div>
            <div className="space-y-3">
              {filtered.map(item => {
                const done = counted.includes(item.sku)
                return <div className="alert-card" key={item.sku}>
                  <div className="flex items-center justify-between"><span className={`status-badge ${item.level}`}>{item.level === 'critical' ? 'Quiebre inminente' : 'Preventivo'}</span><span className="text-[10px] text-slate-500 font-mono">{item.sku}</span></div>
                  <p className="text-[14px] text-slate-100 font-semibold mt-3">{item.title}</p><p className="text-[11px] text-slate-500 mt-0.5">{item.variant}</p>
                  <div className="stock-row"><div><small>Stock actual</small><b className={item.level === 'critical' ? 'text-red-400' : 'text-amber-400'}>{item.stock} u.</b></div><i /><div><small>Mínimo requerido</small><b>{item.min} u.</b></div></div>
                  <div className="arrival"><Icon name="box" size={14} /><span>Reposición estimada</span><b>{item.eta}</b></div>
                  <button disabled={done} onClick={() => setCounted([...counted, item.sku])} className={`rack-button ${done ? 'done' : ''}`}>{done ? <><Icon name="check" size={15} />Conteo confirmado</> : 'Confirmar conteo en rack'}</button>
                </div>
              })}
            </div>
          </div>
          <div className="phone-nav"><button className="active"><Icon name="home" /><span>Inicio</span></button><button><Icon name="search" /><span>Buscar</span></button><button className="scan-main" onClick={() => setScan(true)}><Icon name="barcode" size={24} /></button><button><Icon name="box" /><span>Stock</span></button><button><Icon name="user" /><span>Perfil</span></button></div>
          {scan && <div className="scanner-overlay" onClick={() => setScan(false)}><button className="close-scan">Cerrar</button><div className="scan-frame"><span /><span /><span /><span /><i /></div><p>Centra el código de barras dentro del marco</p><small>Toca en cualquier lugar para cerrar</small></div>}
        </div>
        <div className="hidden lg:block max-w-[370px]">
          <span className="eyebrow text-emerald-400">Diseñado para el piso</span><h2 className="text-3xl font-semibold tracking-[-.04em] text-white mt-4 leading-tight">Menos menús.<br />Más acciones resueltas.</h2><p className="text-sm text-slate-400 leading-6 mt-5">La app ordena las tareas por impacto, confirma stock físico y mantiene al equipo alineado con el pronóstico central.</p>
          <div className="mt-8 space-y-5">{[['barcode','Escaneo instantáneo','Encuentra cualquier SKU sin digitar códigos.'],['alert','Alertas con contexto','Stock, mínimo y fecha de reposición en una vista.'],['check','Cierre operativo','Cada conteo queda confirmado para todo el equipo.']].map(([icon,title,copy]) => <div key={title} className="flex gap-4"><div className="feature-icon"><Icon name={icon as IconName} /></div><div><p className="text-sm font-medium text-slate-100">{title}</p><p className="text-xs text-slate-500 mt-1 leading-5">{copy}</p></div></div>)}</div>
        </div>
      </div>
    </main>
  )
}

const auditRows = [
  { id: 'LT-2025-0623-04', date: '23 Jun, 08:30', source: 'SAP Business One', records: '12.458', status: 'Validado', tone: 'success' },
  { id: 'LT-2025-0622-03', date: '22 Jun, 18:12', source: 'stock_semanal.xlsx', records: '4.862', status: 'Validado con alertas', tone: 'warning' },
  { id: 'LT-2025-0622-02', date: '22 Jun, 08:30', source: 'SAP Business One', records: '12.391', status: 'Validado', tone: 'success' },
  { id: 'LT-2025-0621-01', date: '21 Jun, 08:30', source: 'SAP Business One', records: '12.404', status: 'Validado', tone: 'success' },
]

function Integration() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [upload, setUpload] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [rows, setRows] = useState(auditRows)

  const handleFileUpload = async (file: File) => {
    setUpload(file.name)
    const res = await api.uploadCsvBatch(file)
    if (res.success && res.lotCode) {
      setRows((prev) => [
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
          <button onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }} className={`drop-zone ${upload ? 'uploaded' : ''}`}>
            {upload ? <><span className="upload-check"><Icon name="check" /></span><div><p>{upload}</p><small>Archivo validado en servidor · Haz clic para reemplazar</small></div></> : <><span className="upload-icon"><Icon name="cloud" size={22} /></span><div><p>Arrastra aquí tu reporte de stock (.csv)</p><small>o haz clic para explorar archivos</small></div></>}
          </button>
          <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
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
        {[['database','12.458','Registros sincronizados'],['check','99,8%','Calidad de datos'],['activity','4m 12s','Tiempo de procesamiento']].map(([icon,value,label]) => <div key={label} className="panel px-5 py-4 flex items-center gap-3"><div className="data-icon"><Icon name={icon as IconName} /></div><div><p className="font-mono text-base font-semibold text-white">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div></div>)}
      </div>
    </main>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const content = useMemo(() => page === 'dashboard' ? <Dashboard /> : page === 'store' ? <StoreApp /> : <Integration />, [page])
  return <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex"><Sidebar page={page} setPage={setPage} /><div className="min-w-0 flex-1"><Topbar page={page} setPage={setPage} />{content}</div></div>
}

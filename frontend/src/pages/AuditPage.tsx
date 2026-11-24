import { useMemo, useState } from 'react'
import type { CatalogProduct, EmployeeAuditLog, TeamMember } from '../types/inventory'
import { Icon } from '../components/Icons'

export function AuditPage({
  products,
  auditLogs,
  teamMembers,
  onRegisterNewAudit,
  onShowToast,
}: {
  products: CatalogProduct[]
  auditLogs: EmployeeAuditLog[]
  teamMembers: TeamMember[]
  onRegisterNewAudit: () => void
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
}) {
  const [search, setSearch] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('TODOS')

  const auditedCount = useMemo(() => products.filter((p) => p.conteo_confirmado).length, [products])
  const optimalUnits = useMemo(
    () => products.filter((p) => p.stock_actual > p.stock_minimo).reduce((acc, p) => acc + p.stock_actual, 0),
    [products]
  )
  const replenishSkus = useMemo(() => products.filter((p) => p.stock_actual <= p.stock_minimo).length, [products])

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return auditLogs.filter((log) => {
      const matchSearch =
        q === '' ||
        log.empleado.toLowerCase().includes(q) ||
        log.tipo_gestion.toLowerCase().includes(q) ||
        log.detalle.toLowerCase().includes(q)
      const matchEmp = employeeFilter === 'TODOS' || log.empleado === employeeFilter
      return matchSearch && matchEmp
    })
  }, [auditLogs, search, employeeFilter])

  const handleDownloadActa = () => {
    const rows = [
      'ID,FechaHora,Empleado,Rol,TipoGestion,Sucursal,Terminal,Estado,Detalle',
      ...filteredLogs.map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.empleado}","${l.rol}","${l.tipo_gestion}","${l.sucursal}","${l.terminal}","${l.estado}","${l.detalle.replace(/"/g, '""')}"`
      ),
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Acta_Auditoría_SportStock_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    onShowToast('Acta de auditoría descargada en formato CSV.', 'success')
  }

  return (
    <main className="page-wrap space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-600 dark:text-emerald-400 mb-1.5">Trazabilidad ISO 27001 & Ley N° 21.719</p>
          <h1 className="page-title">Auditoría de Empleados & Inventario</h1>
          <p className="page-subtitle">
            Registro inmutable de conteos físicos, aprobaciones gerenciales, ajustes de merma e ingestas de datos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadActa} className="secondary-button text-xs h-[38px]">
            <Icon name="download" size={14} />
            Descargar Acta (.csv)
          </button>
          <button onClick={onRegisterNewAudit} className="primary-button text-xs h-[38px]">
            <Icon name="clipboard" size={14} />
            Registrar Cierre de Conteo
          </button>
        </div>
      </div>

      {/* TARJETA DESTACADA: ÚLTIMO INVENTARIO REALIZADO */}
      <div className="panel p-5 sm:p-6 border-emerald-200 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 to-white dark:from-slate-900 dark:to-[#0d1917]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="status-badge success">
            <span className="badge-dot" />
            Último Inventario Físico Sincronizado
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Cumplimiento Ley 21.719 · Trazabilidad B2B</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-2 lg:border-r border-slate-200 dark:border-slate-800 pr-4">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Fecha y Sucursal</span>
            <p className="text-base font-semibold text-slate-900 dark:text-white">Sucursal Costanera Center (SUC-01)</p>
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">23/11/2026 · 09:42:15 hrs (Turno Mañana)</p>
          </div>

          <div className="space-y-2 lg:border-r border-slate-200 dark:border-slate-800 pr-4">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Responsables del Cierre</span>
            <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-950/70 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-900 dark:text-white font-medium">Joyce Honores</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Gerente Operaciones</span>
            </div>
            <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-950/70 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-900 dark:text-white font-medium">Jorge Hormazabal</span>
              <span className="text-sky-600 dark:text-sky-400 text-[11px]">Encargado de Tienda</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center items-center">
            <div className="bg-white dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Auditados</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {auditedCount} / {products.length}
              </span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/25">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">Óptimos</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">{optimalUnits} u.</span>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-200 dark:border-red-500/25">
              <span className="text-[10px] text-red-700 dark:text-red-400 block">A reponer</span>
              <span className="text-sm font-bold text-red-700 dark:text-red-300 font-mono">{replenishSkus} SKUs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="panel p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Personal activo</p>
          <p className="metric mt-2 text-2xl">{teamMembers.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Costanera, Arauco y Vespucio</p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Gestiones registradas</p>
          <p className="metric mt-2 text-2xl text-emerald-600 dark:text-emerald-400">{auditLogs.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Conteos, órdenes e ingestas</p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Cobertura de auditoría</p>
          <p className="metric mt-2 text-2xl">100%</p>
          <p className="text-[11px] text-slate-500 mt-1">Usuario, fecha y terminal</p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Tiempo promedio conteo</p>
          <p className="metric mt-2 text-2xl">18 min</p>
          <p className="text-[11px] text-slate-500 mt-1">Por sucursal</p>
        </div>
      </div>

      {/* TABLA DE AUDITORÍA */}
      <div className="panel overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Historial de Auditoría & Trazabilidad de Empleados</h2>
            <p className="section-subtitle">Cada aprobación, conteo físico o carga de lote se registra automáticamente.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[210px]">
              <Icon name="search" size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Buscar empleado o acción..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={employeeFilter}
              onChange={(e: any) => setEmployeeFilter(e.target.value)}
              className="select-pill outline-none cursor-pointer h-[34px]"
            >
              <option value="TODOS">Todos los empleados</option>
              {teamMembers.map((m) => (
                <option key={m.nombre} value={m.nombre}>
                  {m.nombre} ({m.rol})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Fecha & Hora</th>
                <th>Empleado Responsable</th>
                <th>Tipo de Gestión</th>
                <th>Detalle del Cambio</th>
                <th>Sucursal / Terminal</th>
                <th className="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap">
                    <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{log.timestamp}</div>
                    <div className="text-[10px] text-slate-500">{log.relativo}</div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full bg-gradient-to-tr ${log.color} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}
                      >
                        {log.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{log.empleado}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{log.rol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 dark:bg-slate-800 dark:text-sky-300 dark:border-slate-700">
                      {log.tipo_gestion}
                    </span>
                  </td>
                  <td className="max-w-md text-slate-700 dark:text-slate-300">{log.detalle}</td>
                  <td className="whitespace-nowrap">
                    <div className="text-slate-800 dark:text-slate-200">{log.sucursal}</div>
                    <div className="text-[10px] font-mono text-slate-500">{log.terminal}</div>
                  </td>
                  <td className="text-center whitespace-nowrap">
                    <span className={`status-badge ${log.estado === 'RECHAZADO' ? 'critical' : 'success'}`}>
                      <span className="badge-dot" />
                      {log.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EQUIPO ASIGNADO */}
      <div className="panel p-5 space-y-4">
        <h2 className="section-title">Equipo de Trabajo Asignado</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {teamMembers.map((emp) => (
            <div key={emp.nombre} className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${emp.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                >
                  {emp.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{emp.nombre}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{emp.rol}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <span className="text-[10px] text-slate-500 block">Última gestión:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium block truncate">{emp.ultima_gestion}</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{emp.fecha_gestion}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

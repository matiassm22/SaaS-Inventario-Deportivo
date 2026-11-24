import type { ReactNode } from 'react'

export type IconName =
  | 'activity'
  | 'alert'
  | 'arrow'
  | 'barcode'
  | 'box'
  | 'building'
  | 'check'
  | 'chevron'
  | 'clipboard'
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
  | 'monitor'
  | 'moon'
  | 'more'
  | 'refresh'
  | 'search'
  | 'settings'
  | 'shield'
  | 'spark'
  | 'store'
  | 'sun'
  | 'upload'
  | 'user'
  | 'users'
  | 'x'

export function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    activity: <><path d="M3 12h4l2.5-7 4 14 2.5-7h5" /></>,
    alert: <><path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2Z" /><path d="M12 9v4M12 17h.01" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    barcode: <><path d="M3 5v14M7 5v14M10 5v14M15 5v14M18 5v14M21 5v14" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4Z" /><path d="m4 7v10l8 4 8-4V7M12 11v10" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M8 9h2M14 9h2M8 13h2M14 13h2M9 21v-4h6v4" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    clipboard: <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h4" /></>,
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
    monitor: <><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L3 10M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M3 4v6h6M21 20v-6h-6" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l-1.1 1.7a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3L6.3 16.9a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4.8v-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l1.1-1.7a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V4.8h4v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l1.1 1.7a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4h-.2a1.7 1.7 0 0 0-1.6 1Z" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z" /></>,
    store: <><path d="M3 9h18l-2-6H5Z" /><path d="M5 9v12h14V9M9 21v-6h6v6" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2m-7.07-15.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
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

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="logo-mark">
        <span />
        <span />
        <span />
      </div>
      {!compact && (
        <div className="font-semibold tracking-[-.04em] text-slate-900 dark:text-white text-[17px] flex items-center gap-1.5">
          <span>SportStock</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 font-normal dark:border-emerald-500/20">
            AI
          </span>
        </div>
      )}
    </div>
  )
}

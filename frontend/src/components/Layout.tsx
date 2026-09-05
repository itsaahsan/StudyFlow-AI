import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, CalendarDays, Timer, BarChart3, Settings as SettingsIcon, Sun, Moon, Sparkles, Info } from 'lucide-react'
import type { Store } from '../store'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/about', label: 'About', icon: Info },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
]

export default function Layout({ store, children }: { store: Store; children: React.ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-6 px-4 py-4 sm:px-6">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card md:flex dark:border-white/10 dark:bg-white/[.03] dark:shadow-none">
        <button onClick={() => nav('/dashboard')} className="mb-5 flex items-center gap-2.5 rounded-2xl px-2 py-1 text-left" aria-label="StudyFlow home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Sparkles size={18} /></span>
          <span><span className="block text-sm font-extrabold leading-tight">StudyFlow AI</span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">Demo intelligence mode</span></span>
        </button>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}>
              <l.icon size={18} />{l.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn-ghost mt-3 w-full" onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
          {store.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}{store.theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-10">
        <header className="mb-5 flex items-center justify-between md:hidden">
          <span className="flex items-center gap-2 font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"><Sparkles size={16} /></span>StudyFlow AI</span>
          <button className="btn-ghost !px-3 !py-2" onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{store.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
        </header>
        {children}
        <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-pop backdrop-blur md:hidden dark:border-white/10 dark:bg-[#14171f]/95" aria-label="Mobile">
          {links.slice(0, 5).map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold ${isActive ? 'text-brand-600 dark:text-white' : 'text-slate-400'}`}>
              <l.icon size={19} />{l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

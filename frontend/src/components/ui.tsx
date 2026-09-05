import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ShieldCheck, Eye } from 'lucide-react'
import type { Task } from '../lib/types'
import { daysUntil, remaining } from '../lib/planner'

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const }
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.section {...fadeUp} className={`card p-5 sm:p-6 ${className}`}>{children}</motion.section>
}

export function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-100">{kicker}</p>
      <h2 className="mt-1 text-lg font-bold">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  )
}

export function RiskChip({ level }: { level: 'Safe' | 'Watch' | 'At Risk' }) {
  const map = {
    Safe: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
    Watch: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    'At Risk': 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20'
  } as const
  const Icon = level === 'Safe' ? ShieldCheck : level === 'Watch' ? Eye : AlertTriangle
  return <span className={`chip ring-1 ${map[level]}`}><Icon size={13} />{level}</span>
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
    </div>
  )
}

export function DueLabel({ task }: { task: Task }) {
  const d = daysUntil(task.due_date)
  if (d === null) return <span className="text-xs text-slate-400">No due date</span>
  const label = d < 0 ? 'Overdue' : d <= 1 ? 'Due tomorrow' : `Due in ${Math.ceil(d)} days`
  const cls = d <= 1 ? 'text-rose-600 dark:text-rose-300' : d <= 3 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'
  return <span className={`text-xs font-semibold ${cls}`}>{label} · ~{remaining(task)} min left</span>
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center dark:border-white/10 dark:bg-white/[.02]">
      <CheckCircle2 className="mb-3 text-brand-500" size={28} />
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-modal="true" aria-label={label}>
      <motion.div initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.25 }} onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-lg p-6 shadow-pop dark:bg-[#14171f]">
        {children}
      </motion.div>
    </motion.div>
  )
}

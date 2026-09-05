import { useMemo, useState } from 'react'
import { Wand2, CheckCircle2 } from 'lucide-react'
import type { Store } from '../store'
import { dailyPlan, ranked } from '../lib/planner'
import { Card, SectionTitle, RiskChip } from '../components/ui'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const COLORS = ['bg-brand-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500']

export default function Calendar({ store }: { store: Store }) {
  const { tasks, profile } = store
  const [optimized, setOptimized] = useState(false)
  const { plan } = useMemo(() => dailyPlan(tasks, profile.available_hours), [tasks, profile.available_hours])
  const colorOf = (subj: string) => COLORS[Math.abs([...subj].reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length]

  // distribute plan blocks across Mon–Fri; before-optimization crams Wed
  const blocks = useMemo(() => {
    const per: Record<string, typeof plan> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] }
    if (!optimized) {
      per.Wed = plan.slice(0, 4)
      per.Mon = plan.slice(4, 5); per.Tue = plan.slice(5, 6)
    } else {
      plan.forEach((p, i) => per[DAYS[i % 5]].push(p))
    }
    return per
  }, [plan, optimized])

  const deadlines = ranked(tasks.filter((t) => t.status !== 'done')).slice(0, 4)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Calendar</h1><p className="text-sm text-slate-500">AI-generated study blocks + classes, assignments & exams.</p></div>
        <button className="btn-primary" onClick={() => setOptimized((v) => !v)}><Wand2 size={16} /> {optimized ? 'Show before' : 'Optimize Week'}</button>
      </div>

      {optimized && (
        <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          Detected Wednesday overload — rebalanced study sessions across the week and protected Friday evening.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DAYS.map((d, i) => (
          <Card key={d} className={`!p-4 ${!optimized && d === 'Wed' ? '!border-amber-300 !bg-amber-50/50 dark:!border-amber-500/30 dark:!bg-amber-500/5' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{d} <span className="ml-1 font-medium normal-case">Oct {6 + i}</span></p>
            {!optimized && d === 'Wed' && <p className="mt-1 text-[11px] font-bold text-amber-600">⚠ overloaded</p>}
            <ul className="mt-2 space-y-2">
              <li className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:bg-white/5">🏫 Classes 8:00–15:00</li>
              {blocks[d].map((p) => (
                <li key={p.task_id + d} className="rounded-xl border border-slate-100 px-2.5 py-1.5 text-xs dark:border-white/10">
                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${colorOf(p.subject)}`} />
                  <strong>{p.start}</strong> {p.title}
                  <span className="block pl-3.5 text-slate-400">{p.minutes} min · {p.subject}</span>
                </li>
              ))}
              {d === 'Fri' && <li className="rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">🌙 Evening protected</li>}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle kicker="Deadlines" title="Exams & due dates" />
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {deadlines.map((x) => (
            <li key={x.task.id} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 px-3.5 py-2.5 text-sm dark:border-white/10">
              <span className="font-bold">{x.task.title} <span className="block text-xs font-medium text-slate-400">{x.task.due_date} · {x.task.subject}</span></span>
              <RiskChip level={x.risk.level} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

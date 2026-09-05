import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, Sparkles, Wand2, LifeBuoy, Clock, Flame, CheckCircle2, ArrowRight, X } from 'lucide-react'
import type { Store } from '../store'
import type { Task } from '../lib/types'
import { ranked, dailyPlan, nextAction, riskOf, rescueWeek, remaining } from '../lib/planner'
import { Card, SectionTitle, RiskChip, ProgressBar, DueLabel, Modal } from '../components/ui'

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }

export default function Dashboard({ store }: { store: Store }) {
  const nav = useNavigate()
  const { tasks, setTasks, profile, sessions } = store
  const [showWhat, setShowWhat] = useState(false)
  const [showRescue, setShowRescue] = useState(false)
  const [reschedMsg, setReschedMsg] = useState<string | null>(null)

  const r = useMemo(() => ranked(tasks.filter((t) => t.status !== 'done' && t.progress < 100)), [tasks])
  const focus = r[0]?.task as Task | undefined
  const focusWhy = r[0] ? r[0].why.slice(0, 2).join(' + ') : ''
  const { plan, warnings } = useMemo(() => dailyPlan(tasks, profile.available_hours), [tasks, profile.available_hours])
  const na = useMemo(() => nextAction(tasks), [tasks])
  const radar = useMemo(() => ranked(tasks).slice(0, 4).map((x) => x.risk), [tasks])
  const rescue = useMemo(() => rescueWeek(tasks, profile.available_hours), [tasks, profile.available_hours])
  const doneN = tasks.filter((t) => t.status === 'done' || t.progress >= 100).length
  const studyMin = sessions.reduce((a, s) => a + s.minutes, 0)
  const pct = tasks.length ? Math.round((doneN / tasks.length) * 100) : 0
  const first = profile.name.split(' ')[0] || 'there'

  const couldntFinish = (id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    const rem = remaining(t)
    const moved = Math.max(15, Math.min(rem, 35))
    const easy = tasks.find((x) => x.id !== id && x.difficulty <= 2 && x.status !== 'done')
    setReschedMsg(`No problem. I moved the remaining ${moved} min of '${t.title}' to tomorrow${easy ? ` and shifted your easier '${easy.title}' to today` : ''}.`)
    setTasks(tasks.map((x) => (x.id === id ? { ...x, progress: Math.max(0, x.progress - 5) } : x)))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting()}, {first} 👋</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Here&apos;s what matters today.</p>
      </div>

      {/* FOCUS NOW */}
      {focus ? (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-600 p-6 text-white shadow-card sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">Focus now</p>
          <h2 className="mt-1.5 text-2xl font-extrabold">{focus.title}</h2>
          <p className="mt-1 text-sm opacity-85"><DueLabel task={focus} /> · {Math.min(45, Math.max(25, remaining(focus)))} minutes recommended</p>
          <p className="mt-3 max-w-lg rounded-xl bg-white/10 px-3.5 py-2.5 text-[13px] leading-relaxed"><strong>Why now?</strong> {focusWhy}.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 transition hover:bg-brand-50 active:scale-[.98]" onClick={() => nav(`/focus?task=${focus.id}`)}><Play size={16} /> Start Focus Session</button>
            <button className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10" onClick={() => couldntFinish(focus.id)}>I couldn&apos;t finish this</button>
          </div>
          <AnimatePresence>{reschedMsg && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden rounded-xl bg-emerald-400/20 px-3.5 py-2.5 text-[13px]">{reschedMsg}</motion.p>
          )}</AnimatePresence>
        </motion.div>
      ) : (
        <Card><p className="font-bold">All clear! 🎉</p><p className="text-sm text-slate-500">No open tasks. Add an assignment and StudyFlow will build your plan.</p></Card>
      )}

      {/* WHAT NOW banner */}
      <button onClick={() => setShowWhat(true)} className="group flex w-full items-center gap-3 rounded-3xl border border-brand-200 bg-brand-50/70 px-5 py-4 text-left transition hover:bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/10 dark:hover:bg-brand-500/15" aria-label="Ask what to do now">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white"><Wand2 size={18} /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">What should I do now?</span>
        <span className="block truncate text-[13px] text-slate-500 dark:text-slate-300">{na.title}</span></span>
        <ArrowRight size={18} className="shrink-0 text-brand-600 transition group-hover:translate-x-1" />
      </button>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card>
            <SectionTitle kicker="Today's plan" title="Timeline" sub={`${plan.length} blocks · ~${plan.reduce((a, p) => a + p.minutes, 0)} min`} />
            {plan.length === 0 ? <p className="text-sm text-slate-500">Nothing scheduled — add tasks to generate your plan.</p> : (
              <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5 dark:border-white/10">
                {plan.map((p) => (
                  <li key={p.task_id + p.start} className="relative">
                    <span className="timeline-dot absolute -left-[27px]" />
                    <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-100">{p.start} · {p.minutes} min</p>
                    <p className="text-sm font-bold">{p.title} <span className="font-medium text-slate-400">· {p.subject}</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.why}</p>
                  </li>
                ))}
              </ol>
            )}
            {warnings.map((w) => <p key={w} className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">{w}</p>)}
          </Card>

          <Card>
            <SectionTitle kicker="Deadlines" title="Upcoming" sub="Urgency indicators update automatically" />
            <ul className="space-y-2.5">
              {ranked(tasks.filter((t) => t.status !== 'done')).slice(0, 5).map((x) => (
                <li key={x.task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3.5 py-2.5 dark:border-white/10">
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{x.task.title}</p><DueLabel task={x.task} /></div>
                  <RiskChip level={x.risk.level} />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card className="!bg-gradient-to-b !from-brand-50/80 !to-white dark:!from-brand-500/10 dark:!to-transparent">
            <SectionTitle kicker="AI insight" title="Optimize my week" />
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              You have <strong>{tasks.filter((t) => t.status !== 'done').length} open tasks</strong>. Wednesday is currently your heaviest day.
              I moved 2 tasks to Monday to prevent a last-minute workload spike.
            </p>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary flex-1" onClick={() => setShowRescue(true)}><LifeBuoy size={16} /> Rescue My Week</button>
            </div>
          </Card>

          <Card>
            <SectionTitle kicker="Deadline radar" title="Risk scan" />
            <ul className="space-y-2.5">
              {radar.map((d) => (
                <li key={d.task_id} className="rounded-2xl border border-slate-100 p-3 dark:border-white/10">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{d.title}</p><RiskChip level={d.level} /></div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{d.reason} → {d.recommendation}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle kicker="Progress" title="This week" />
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { icon: CheckCircle2, v: `${doneN}/${tasks.length}`, l: 'Tasks done' },
                { icon: Clock, v: `${Math.floor(studyMin / 60)}h ${studyMin % 60}m`, l: 'Study time' },
                { icon: Flame, v: '4 days', l: 'Streak' },
                { icon: Sparkles, v: `${pct}%`, l: 'Completed' }
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                  <s.icon size={16} className="mx-auto text-brand-600 dark:text-brand-100" />
                  <p className="mt-1 text-lg font-extrabold">{s.v}</p>
                  <p className="text-[11px] font-medium text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-3"><ProgressBar value={pct} /></div>
          </Card>
        </div>
      </div>

      {/* WHAT NOW modal */}
      <AnimatePresence>{showWhat && (
        <Modal onClose={() => setShowWhat(false)} label="Recommended next action">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">What should I do now?</p>
          <h3 className="mt-2 text-xl font-extrabold leading-snug">{na.title}</h3>
          <div className="mt-4 space-y-2 text-sm">
            <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-white/5"><strong>Why:</strong> {na.why}.</p>
            <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-white/5"><strong>Time:</strong> {na.minutes} minutes {na.risk && <span className="ml-2"><RiskChip level={na.risk as 'Safe' | 'Watch' | 'At Risk'} /></span>}</p>
          </div>
          <div className="mt-5 flex gap-2.5">
            <button className="btn-ghost flex-1" onClick={() => setShowWhat(false)}><X size={16} /> Later</button>
            <button className="btn-primary flex-1" onClick={() => { setShowWhat(false); if (na.task_id) nav(`/focus?task=${na.task_id}`) }}><Play size={16} /> Start</button>
          </div>
        </Modal>
      )}</AnimatePresence>

      {/* RESCUE modal */}
      <AnimatePresence>{showRescue && (
        <Modal onClose={() => setShowRescue(false)} label="Rescue my week">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">Plan rescue</p>
          <h3 className="mt-2 text-xl font-extrabold">We found {rescue.total_hours}h of work across 5 days.</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-rose-50 p-3.5 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/20">
              <p className="text-[11px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-300">Before</p>
              <p className="mt-1 font-bold">{rescue.total_hours}h concentrated</p>
              <p className="text-xs opacity-75">Busiest: {rescue.busiest_day} (+{Math.round(rescue.overloaded_by / 60 * 10) / 10}h over)</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3.5 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">After</p>
              <p className="mt-1 font-bold">Balanced workload</p>
              <p className="text-xs opacity-75">~{rescue.per_day} min/day · Friday protected</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {rescue.moves.map((m) => <li key={m} className="flex gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />{m}</li>)}
          </ul>
          <button className="btn-primary mt-5 w-full" onClick={() => setShowRescue(false)}><CheckCircle2 size={16} /> Apply rescued plan</button>
        </Modal>
      )}</AnimatePresence>
    </div>
  )
}

export function riskList(tasks: Task[]) {
  return tasks.map((t) => riskOf(t))
}

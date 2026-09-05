import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Pause, Check, SkipForward, RotateCcw } from 'lucide-react'
import type { Store } from '../store'
import { remaining } from '../lib/planner'
import { Card, SectionTitle, ProgressBar } from '../components/ui'

export default function Focus({ store }: { store: Store }) {
  const { tasks, setTasks, sessions, setSessions } = store
  const [params] = useSearchParams()
  const open = tasks.filter((t) => t.status !== 'done' && t.progress < 100)
  const initial = tasks.find((t) => t.id === params.get('task')) ?? open[0]
  const [taskId, setTaskId] = useState<string | undefined>(initial?.id)
  const task = tasks.find((t) => t.id === taskId) ?? open[0]
  const total = 25 * 60
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const subtask = task?.subtasks.find((s) => !s.done)?.title ?? task?.title ?? 'No task selected'

  useEffect(() => {
    if (running) timer.current = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [running])
  useEffect(() => { if (left === 0) { setRunning(false); setDone(true) } }, [left])
  useEffect(() => { setLeft(total); setDone(false); setRunning(false); setFeedback(null) }, [taskId]) // eslint-disable-line

  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  const elapsed = Math.round((total - left) / 60)

  const finish = (fb?: string) => {
    if (!task) return
    const mins = Math.max(5, elapsed || 25)
    const bump = Math.max(10, Math.min(50, Math.round((mins / Math.max(1, task.estimated_minutes)) * 100)))
    setTasks(tasks.map((x) => {
      if (x.id !== task.id) return x
      const progress = Math.min(100, x.progress + bump)
      let est = x.estimated_minutes
      if (fb === 'hard') est = Math.round(est * 1.15)
      if (fb === 'easy') est = Math.round(est * 0.9)
      return { ...x, progress, estimated_minutes: est, status: progress >= 100 ? 'done' as const : x.status }
    }))
    setSessions([...sessions, { minutes: mins, subject: task.subject }])
    setFeedback(fb ?? 'done'); setDone(true); setRunning(false)
  }

  const ring = useMemo(() => {
    const p = 1 - left / total, r = 88, c = 2 * Math.PI * r
    return { c, off: c * (1 - p) }
  }, [left, total])

  if (!task) return <Card><SectionTitle kicker="Focus mode" title="All done!" /><p className="text-sm text-slate-500">No open tasks. Add an assignment to start focusing.</p></Card>

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Focus mode · distraction-free</p>
        <h1 className="mt-1 text-2xl font-extrabold">{task.title}</h1>
        <p className="text-sm text-slate-500">Current step: <strong className="text-slate-700 dark:text-slate-200">{subtask}</strong> · ~{remaining(task)} min left total</p>
      </div>

      <Card className="flex flex-col items-center !p-8 text-center">
        <div className="relative" role="timer" aria-label={`${mm} minutes ${ss} seconds remaining`}>
          <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="88" fill="none" strokeWidth="12" className="stroke-slate-100 dark:stroke-white/10" />
            <circle cx="100" cy="100" r="88" fill="none" stroke="#6366f1" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={ring.c} strokeDashoffset={ring.off} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <p className="absolute inset-0 flex items-center justify-center font-mono text-5xl font-extrabold tabular-nums">{mm}:{ss}</p>
        </div>
        <div className="mt-4 w-full max-w-xs"><ProgressBar value={task.progress} /></div>
        {!done ? (
          <div className="mt-5 flex gap-2.5">
            <button className="btn-primary !px-6" onClick={() => setRunning((v) => !v)} aria-label={running ? 'Pause' : 'Start'}>
              {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {left < total ? 'Resume' : 'Start'}</>}
            </button>
            <button className="btn-ghost" onClick={() => finish()}><Check size={16} /> Finish</button>
            <button className="btn-ghost" onClick={() => { const i = open.findIndex((t) => t.id === task.id); setTaskId(open[(i + 1) % open.length]?.id) }} aria-label="Skip task"><SkipForward size={16} /> Skip</button>
          </div>
        ) : (
          <div className="mt-5 w-full">
            <p className="text-lg font-extrabold">Nice work. 🎉</p>
            {!feedback || feedback === 'done' ? <p className="text-sm text-slate-500">Session logged ({Math.max(5, elapsed || 25)} min). How difficult was this?</p> : null}
            <div className="mt-3 flex justify-center gap-2">
              {['Easy', 'Normal', 'Hard'].map((f) => (
                <button key={f} onClick={() => finish(f.toLowerCase())}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${feedback === f.toLowerCase() ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'}`}>{f}</button>
              ))}
            </div>
            {feedback && <p className="mt-3 text-xs text-slate-400">Feedback saved — future estimates will adapt. <button className="font-bold text-brand-600" onClick={() => { setLeft(total); setDone(false); setFeedback(null) }}><RotateCcw size={12} className="mr-1 inline" />New session</button></p>}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle kicker="Up next" title="Queue" sub="Tap to switch focus target" />
        <ul className="space-y-1.5">
          {open.slice(0, 4).map((t) => (
            <li key={t.id}><button onClick={() => setTaskId(t.id)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${t.id === task.id ? 'bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/10 dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
              <span>{t.title}</span><span className="text-xs text-slate-400">~{remaining(t)} min</span>
            </button></li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

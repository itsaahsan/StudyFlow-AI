import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react'
import type { Store } from '../store'
import type { Task } from '../lib/types'
import { priorityScore, remaining } from '../lib/planner'
import { Card, SectionTitle, RiskChip, ProgressBar, DueLabel, Empty, Modal } from '../components/ui'
import { riskList } from './Dashboard'

type Filter = 'All' | 'Today' | 'Upcoming' | 'At Risk' | 'Completed'

export default function Tasks({ store }: { store: Store }) {
  const { tasks, setTasks, profile } = store
  const [filter, setFilter] = useState<Filter>('All')
  const [editing, setEditing] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const risks = Object.fromEntries(riskList(tasks).map((d) => [d.task_id, d.level]))
    let list = [...tasks]
    if (filter === 'Today') list = list.filter((t) => { const d = t.due_date; if (!d) return false; const today = new Date().toISOString().slice(0, 10); const tom = new Date(Date.now() + 86400000).toISOString().slice(0, 10); return (d === today || d === tom) && t.status !== 'done' })
    if (filter === 'Upcoming') list = list.filter((t) => t.status !== 'done')
    if (filter === 'At Risk') list = list.filter((t) => risks[t.id] === 'At Risk')
    if (filter === 'Completed') list = list.filter((t) => t.status === 'done' || t.progress >= 100)
    return list.map((t) => ({ t, score: priorityScore(t).score })).sort((a, b) => b.score - a.score).map((x) => x.t)
  }, [tasks, filter])

  const toggleDone = (t: Task) => {
    const done = !(t.status === 'done' || t.progress >= 100)
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, status: done ? 'done' as const : 'todo' as const, progress: done ? 100 : Math.min(90, x.progress) } : x)))
  }
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Tasks</h1><p className="text-sm text-slate-500">Prioritized by deadline, effort, difficulty & importance — not just due dates.</p></div>
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Add Assignment</button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Task filters">
        {(['All', 'Today', 'Upcoming', 'At Risk', 'Completed'] as Filter[]).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${filter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty title="No tasks here." body="Add your first assignment and StudyFlow will build your plan." action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Add Assignment</button>} />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((t) => {
              const done = t.status === 'done' || t.progress >= 100
              const { score, why } = priorityScore(t)
              return (
                <motion.li key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                  className={`card !p-4 ${done ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <GripVertical size={16} className="mt-1 shrink-0 cursor-grab text-slate-300" aria-hidden />
                    <button onClick={() => toggleDone(t)} aria-label={done ? `Reopen ${t.title}` : `Complete ${t.title}`}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-brand-500'}`}>
                      {done && <Check size={14} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm font-bold ${done ? 'line-through' : ''}`}>{t.title}</p>
                        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{t.subject}</span>
                        <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-100 dark:ring-brand-500/20">★ {score}</span>
                      </div>
                      <DueLabel task={t} />
                      <p className="mt-0.5 truncate text-xs text-slate-400" title={why.join('; ')}>Why: {why.slice(0, 2).join('; ')}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="w-40 max-w-full"><ProgressBar value={t.progress} /></div>
                        <span className="text-xs font-semibold text-slate-500">{t.progress}%</span>
                        <input type="range" min={0} max={100} step={5} value={t.progress} aria-label={`${t.title} progress`}
                          onChange={(e) => { const v = Number(e.target.value); setTasks(tasks.map((x) => (x.id === t.id ? { ...x, progress: v, status: v >= 100 ? 'done' as const : 'todo' as const } : x))) }}
                          className="w-28 accent-indigo-600" />
                      </div>
                      {t.subtasks.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {t.subtasks.map((s) => (
                            <li key={s.id} className="flex items-center gap-2 text-xs">
                              <button aria-label={`Toggle subtask ${s.title}`} onClick={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, subtasks: x.subtasks.map((q) => (q.id === s.id ? { ...q, done: !q.done } : q)) } : x)))}
                                className={`flex h-4 w-4 items-center justify-center rounded border ${s.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>{s.done && <Check size={11} />}</button>
                              <span className={s.done ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}>{s.title} · {s.estimated_minutes}m</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`}><Pencil size={15} /></button>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => remove(t.id)} aria-label={`Delete ${t.title}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {(creating || editing) && (
          <TaskForm
            subjects={profile.subjects}
            initial={editing ?? undefined}
            onClose={() => { setCreating(false); setEditing(null) }}
            onSave={(t) => {
              if (editing) setTasks(tasks.map((x) => (x.id === editing.id ? { ...editing, ...t } : x)))
              else setTasks([{ id: `t-${Date.now().toString(36)}`, status: 'todo', subtasks: [], ...t } as Task, ...tasks])
              setCreating(false); setEditing(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function TaskForm({ initial, subjects, onSave, onClose }: {
  initial?: Task; subjects: string[];
  onSave: (t: Omit<Task, 'id' | 'status' | 'subtasks' | 'progress'> & { progress: number }) => void;
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? subjects[0] ?? 'General')
  const [type, setType] = useState<Task['type']>(initial?.type ?? 'assignment')
  const [due, setDue] = useState(initial?.due_date ?? new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [est, setEst] = useState(initial?.estimated_minutes ?? 60)
  const [diff, setDiff] = useState(initial?.difficulty ?? 3)
  const [imp, setImp] = useState(initial?.importance ?? 3)
  const [prog, setProg] = useState(initial?.progress ?? 0)
  return (
    <Modal onClose={onClose} label={initial ? 'Edit task' : 'Create task'}>
      <h3 className="text-lg font-extrabold">{initial ? 'Edit task' : 'New assignment'}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="tf-title">Title</label><input id="tf-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology Research Paper" autoFocus /></div>
        <div><label className="label" htmlFor="tf-subject">Subject</label>
          <select id="tf-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>{subjects.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label" htmlFor="tf-type">Type</label>
          <select id="tf-type" className="input" value={type} onChange={(e) => setType(e.target.value as Task['type'])}>{['assignment', 'quiz', 'exam', 'project', 'reading', 'extracurricular'].map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="label" htmlFor="tf-due">Deadline</label><input id="tf-due" type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} /></div>
        <div><label className="label" htmlFor="tf-est">Estimated minutes: {est}</label><input id="tf-est" type="range" min={15} max={360} step={15} value={est} onChange={(e) => setEst(Number(e.target.value))} className="w-full accent-indigo-600" /></div>
        <div><label className="label" htmlFor="tf-diff">Difficulty: {diff}/5</label><input id="tf-diff" type="range" min={1} max={5} value={diff} onChange={(e) => setDiff(Number(e.target.value))} className="w-full accent-indigo-600" /></div>
        <div><label className="label" htmlFor="tf-imp">Importance: {imp}/5</label><input id="tf-imp" type="range" min={1} max={5} value={imp} onChange={(e) => setImp(Number(e.target.value))} className="w-full accent-indigo-600" /></div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn-ghost flex-1" onClick={onClose}><X size={15} /> Cancel</button>
        <button className="btn-primary flex-1" disabled={!title.trim()} onClick={() => onSave({ title: title.trim(), subject, type, due_date: due, estimated_minutes: est, difficulty: diff, importance: imp, progress: prog })}><Check size={15} /> {initial ? 'Save' : 'Create & auto-plan'}</button>
      </div>
      {est >= 120 && <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-100">Large task detected — StudyFlow will auto-split this into smaller sessions.</p>}
      <span className="hidden">{remaining({ estimated_minutes: est, progress: prog } as Task)}</span>
    </Modal>
  )
}

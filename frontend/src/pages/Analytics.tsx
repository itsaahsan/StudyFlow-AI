import { useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import type { Store } from '../store'
import { ranked, remaining, nextAction } from '../lib/planner'
import { Card, SectionTitle, ProgressBar } from '../components/ui'

export default function Analytics({ store }: { store: Store }) {
  const { tasks, sessions, profile } = store
  const done = tasks.filter((t) => t.status === 'done' || t.progress >= 100).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
  const studyMin = sessions.reduce((a, s) => a + s.minutes, 0)
  const bySubject = useMemo(() => {
    const m: Record<string, number> = {}
    tasks.forEach((t) => { m[t.subject] = (m[t.subject] ?? 0) + remaining(t) })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [tasks])
  const maxSub = Math.max(1, ...bySubject.map(([, v]) => v))
  const week = [42, 65, 38, 80, 55, 70, 48]
  const top = ranked(tasks.filter((t) => t.status !== 'done'))[0]

  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: `Hi ${profile.name.split(' ')[0] || 'there'}! I'm your StudyFlow Assistant — ask me about your schedule.` }
  ])
  const [draft, setDraft] = useState('')
  const ask = (q: string) => {
    const m = q.toLowerCase()
    let reply = `Based on your workload, focus on '${top?.task.title ?? 'review'}' next. Want me to start a focus session?`
    if (m.includes('tonight') || m.includes('today') || m.includes('next') || m.includes('what should')) { const na = nextAction(tasks); reply = `${na.title} Why: ${na.why}.` }
    else if (m.includes('why')) reply = top ? `'${top.task.title}' is top priority because ${top.why.join('; ').toLowerCase()} — ~${remaining(top.task)} min left.` : 'No open tasks!'
    else if (m.includes('fit') || m.includes('tomorrow')) reply = top ? `Yes — '${top.task.title}' needs ~${remaining(top.task)} min. A 45-min block tomorrow afternoon works; the rest shifts to the day after.` : 'Tomorrow is free!'
    else if (m.includes('risk') || m.includes('behind')) { const r = ranked(tasks).find((x) => x.risk.level === 'At Risk'); reply = r ? `Deadline Radar: '${r.task.title}' is At Risk — ${r.risk.reason}` : 'Nothing is At Risk right now. Nice pacing.' }
    else if (m.includes('move')) reply = "Done — I moved that to your lightest slot and protected your focus blocks."
    setMsgs((p) => [...p, { me: true, text: q }, { me: false, text: reply }])
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1><p className="text-sm text-slate-500">Understand your workload — supportively, never judgmentally.</p></div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { v: `${Math.floor(studyMin / 60)}h ${studyMin % 60}m`, l: 'Weekly study time' },
          { v: `${pct}%`, l: 'Completion rate' },
          { v: `${done}/${tasks.length}`, l: 'Completed vs open' },
          { v: 'Evening', l: 'Most productive' }
        ].map((s) => (
          <Card key={s.l} className="!p-4 text-center"><p className="text-xl font-extrabold">{s.v}</p><p className="text-xs text-slate-500">{s.l}</p></Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle kicker="Study time" title="Daily minutes" />
          <div className="flex h-32 items-end gap-2" role="img" aria-label="Bar chart of daily study minutes">
            {week.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className={`w-full rounded-lg ${i === 3 ? 'bg-brand-500' : 'bg-brand-500/25'}`} style={{ height: `${(v / 90) * 100}%` }} title={`${v} min`} />
                <span className="text-[10px] font-semibold text-slate-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Workload trend: Wednesday spike detected — Rescue recommended.</p>
        </Card>

        <Card>
          <SectionTitle kicker="Workload" title="Minutes remaining by subject" />
          <ul className="space-y-2.5">
            {bySubject.map(([s, v]) => (
              <li key={s}><div className="mb-1 flex justify-between text-xs font-semibold"><span>{s}</span><span className="text-slate-400">{v} min</span></div><ProgressBar value={Math.round((v / maxSub) * 100)} /></li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="!border-brand-200 !bg-gradient-to-b !from-brand-50/80 !to-white dark:!border-brand-500/20 dark:!from-brand-500/10 dark:!to-transparent">
        <SectionTitle kicker="AI weekly review" title="Supportive, never judgmental 💜" />
        <ul className="space-y-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <li>✅ You completed <strong>{pct}%</strong> of your planned work this week.</li>
          <li>📈 Math improved the most — great consistency.</li>
          <li>📅 Your Friday workload is consistently high.</li>
          <li>💡 Consider starting long assignments 1–2 days earlier.</li>
        </ul>
      </Card>

      <Card>
        <SectionTitle kicker="StudyFlow Assistant" title="Ask about your schedule" sub="Knows your real tasks — not a generic chatbot" />
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3 dark:bg-white/5" aria-live="polite">
          {msgs.map((m, i) => (
            <p key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.me ? 'ml-auto bg-brand-600 text-white' : 'bg-white ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10'}`}>{m.text}</p>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['What should I work on tonight?', 'Why is Biology my highest priority?', 'Am I at risk of falling behind?'].map((q) => (
            <button key={q} onClick={() => ask(q)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">{q}</button>
          ))}
        </div>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { ask(draft.trim()); setDraft('') } }}>
          <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about your schedule…" aria-label="Ask the assistant" />
          <button className="btn-primary" type="submit" aria-label="Send"><Send size={16} /></button>
        </form>
      </Card>
    </div>
  )
}

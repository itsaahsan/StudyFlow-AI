import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import type { Store } from '../store'
import { demoTasks, demoProfile } from '../lib/seed'

export function Login() {
  const nav = useNavigate()
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white"><Sparkles size={20} /></span>
        <h1 className="mt-4 text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Log in to your academic command center.</p>
        <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); nav('/dashboard') }}>
          <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" required placeholder="alex@school.edu" autoComplete="email" /></div>
          <div><label className="label" htmlFor="pw">Password</label><input id="pw" className="input" type="password" required placeholder="••••••••" autoComplete="current-password" /></div>
          <button className="btn-primary w-full !py-3" type="submit">Log in <ArrowRight size={16} /></button>
        </form>
        <button onClick={() => nav('/dashboard')} className="btn-ghost mt-3 w-full">Try Demo instead — no account needed</button>
        <p className="mt-4 text-center text-xs text-slate-400">New here? <Link to="/onboarding" className="font-semibold text-brand-600 hover:underline">Set up your study plan</Link></p>
      </div>
    </div>
  )
}

const GRADES = ['Middle School', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University']
const SUBJECT_OPTS = ['Mathematics', 'Biology', 'History', 'Computer Science', 'English', 'Chemistry', 'Physics', 'Art']

export function Onboarding({ store }: { store: Store }) {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(store.profile.name === 'Alex Morgan' ? '' : store.profile.name)
  const [grade, setGrade] = useState('Grade 11')
  const [subjects, setSubjects] = useState<string[]>(['Mathematics', 'Biology', 'History'])
  const [hours, setHours] = useState(3)

  const toggle = (s: string) => setSubjects((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  const steps = ['Your name', 'Subjects', 'Study time']
  const done = () => {
    store.setProfile({ ...demoProfile, name: name.trim() || 'Alex', grade, subjects: subjects.length ? subjects : demoProfile.subjects, available_hours: hours })
    if (!store.tasks.length) store.setTasks(demoTasks())
    nav('/dashboard')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <div className="mb-6 flex gap-2" aria-hidden>{steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10'}`} />)}</div>
      <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{steps[step]}</p>
      {step === 0 && (<>
        <h1 className="mt-2 text-3xl font-extrabold">What should we call you?</h1>
        <input className="input mt-5 !py-3.5 !text-base" placeholder="e.g. Alex" value={name} onChange={(e) => setName(e.target.value)} aria-label="Student name" autoFocus />
        <label className="label mt-5" htmlFor="grade">Grade / year</label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Grade">
          {GRADES.map((g) => <button key={g} role="radio" aria-checked={grade === g} onClick={() => setGrade(g)} className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${grade === g ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'}`}>{g}</button>)}
        </div>
      </>)}
      {step === 1 && (<>
        <h1 className="mt-2 text-3xl font-extrabold">Which subjects are you taking?</h1>
        <p className="mt-1 text-sm text-slate-500">Pick at least one — you can change these later.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {SUBJECT_OPTS.map((s) => <button key={s} onClick={() => toggle(s)} aria-pressed={subjects.includes(s)} className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${subjects.includes(s) ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-white' : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'}`}>{s}</button>)}
        </div>
      </>)}
      {step === 2 && (<>
        <h1 className="mt-2 text-3xl font-extrabold">How much can you study daily?</h1>
        <div className="card mt-5 p-6 text-center">
          <p className="text-5xl font-extrabold text-brand-600">{hours}h</p>
          <input type="range" min={1} max={6} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-4 w-full accent-indigo-600" aria-label="Available study hours per day" />
          <p className="mt-2 text-sm text-slate-500">Preferred: afternoons & evenings (change in Settings)</p>
        </div>
      </>)}
      <div className="mt-7 flex gap-3">
        {step > 0 && <button className="btn-ghost flex-1" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 2
          ? <button className="btn-primary flex-1 !py-3" onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></button>
          : <button className="btn-primary flex-1 !py-3" onClick={done}>Build my command center <ArrowRight size={16} /></button>}
      </div>
      <button className="mt-3 text-sm font-semibold text-slate-400 hover:text-slate-600" onClick={() => { store.resetDemo(); nav('/dashboard') }}>Skip and use demo data →</button>
      {useMemo(() => null, [])}
    </div>
  )
}

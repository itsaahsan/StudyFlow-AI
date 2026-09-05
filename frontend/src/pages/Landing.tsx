import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Radar, Timer, BarChart3, Wand2, PlayCircle, Check } from 'lucide-react'
import type { Store } from '../store'

export default function Landing({ store }: { store: Store }) {
  const nav = useNavigate()
  const demo = () => { store.resetDemo(); nav('/dashboard') }
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="flex items-center gap-2 font-extrabold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Sparkles size={18} /></span>StudyFlow AI</span>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">Log in</Link>
          <button onClick={demo} className="btn-primary">Try Demo</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-2">
          <div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-100 dark:ring-brand-500/20">
              <Wand2 size={13} /> Adaptive Academic Planner
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              Schoolwork, finally under control.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-4 max-w-md text-base text-slate-600 sm:text-lg dark:text-slate-300">
              StudyFlow AI turns assignments, exams, and deadlines into an adaptive plan that tells you exactly what to do next.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 flex flex-wrap gap-3">
              <button onClick={demo} className="btn-primary !px-6 !py-3 text-base">Build My Study Plan <ArrowRight size={17} /></button>
              <a href="#how" className="btn-ghost !px-6 !py-3 text-base"><PlayCircle size={17} /> See How It Works</a>
            </motion.div>
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Students don&apos;t need another list of things to do. They need to know what matters most <em>right now</em>.</p>
          </div>

          {/* product preview */}
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="card overflow-hidden p-0" aria-label="StudyFlow dashboard preview">
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-semibold text-slate-400">studyflow.ai/dashboard</span>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-4 text-white">
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Focus now</p>
                <p className="mt-1 font-bold">Biology Research Paper</p>
                <p className="text-xs opacity-80">Due tomorrow · 45 minutes recommended</p>
                <span className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-700">Start Focus Session</span>
              </div>
              {[['08:00', 'Mathematics problem set', 'w-3/4'], ['09:00', 'Biology research', 'w-2/3'], ['10:00', 'History reading', 'w-1/2']].map(([t, s]) => (
                <div key={t} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm dark:border-white/10">
                  <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-100">{t}</span>
                  <span className="font-medium">{s}</span>
                </div>
              ))}
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
                <strong>AI Insight:</strong> Wednesday is your heaviest day — I moved 2 tasks to Monday.
              </div>
            </div>
          </motion.div>
        </section>

        <section id="how" className="grid gap-4 py-8 sm:grid-cols-3">
          {[
            { icon: Sparkles, t: 'Capture everything', d: 'Assignments, exams, projects and deadlines in one calm place — or start instantly with demo data.' },
            { icon: Radar, t: 'AI prioritizes', d: 'Deadline, effort, difficulty and importance fuse into one score — with plain-English reasons why.' },
            { icon: Timer, t: 'Focus & adapt', d: 'Timed focus sessions, Deadline Radar risk alerts, and one-tap rescheduling when life happens.' }
          ].map((f) => (
            <div key={f.t} className="card p-6">
              <f.icon className="text-brand-600" size={22} />
              <h3 className="mt-3 font-bold">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{f.d}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 py-6 sm:grid-cols-2">
          <div className="card p-6">
            <Radar className="text-rose-500" size={22} />
            <h3 className="mt-3 font-bold">Deadline Radar</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Safe · Watch · At Risk. StudyFlow scans your workload and warns you days before a task becomes a last-minute panic.</p>
          </div>
          <div className="card p-6">
            <BarChart3 className="text-emerald-500" size={22} />
            <h3 className="mt-3 font-bold">Progress analytics</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Study time, completion rate, subject workload and a supportive weekly AI review — never judgmental.</p>
          </div>
        </section>

        <section className="card my-10 overflow-hidden p-0">
          <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-600 p-8 text-center text-white sm:p-12">
            <h2 className="mx-auto max-w-xl text-2xl font-extrabold sm:text-3xl">Turn school chaos into a plan that actually works.</h2>
            <ul className="mx-auto mt-5 max-w-md space-y-2 text-left text-sm">
              {[['What should I do now?', 'One clear next action, always.'], ['Rescue My Week', 'Rebalance overload in one click.'], ['Focus mode', 'Distraction-free timed sessions.']].map(([t, d]) => (
                <li key={t} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5"><Check size={16} /><strong>{t}</strong><span className="opacity-80">— {d}</span></li>
              ))}
            </ul>
            <button onClick={demo} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-brand-700 transition hover:bg-brand-50">Try the Live Demo <ArrowRight size={17} /></button>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-2 pb-10 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <span>StudyFlow AI · CSC Back-to-School Hackathon · Built solo with AI assistance (see AI_DISCLOSURE.md)</span>
          <Link to="/about" className="font-semibold text-brand-600 hover:underline dark:text-brand-100">About the project</Link>
        </footer>
      </main>
    </div>
  )
}

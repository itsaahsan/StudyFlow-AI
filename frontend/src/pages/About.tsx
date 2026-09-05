import { Link } from 'react-router-dom'
import { ArrowLeft, ListTodo, Brain, CalendarCheck, Timer } from 'lucide-react'
import { Card } from '../components/ui'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"><ArrowLeft size={15} /> Back to dashboard</Link>
      <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">CSC Back-to-School Hackathon</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">The problem isn&apos;t knowing what to do. It&apos;s knowing what to do <em>next</em>.</h1></div>

      <Card>
        <h2 className="font-extrabold">THE PROBLEM</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Students have assignments, quizzes, exams, projects and activities scattered across different places. They know WHAT they need to do but not WHAT to do first, HOW MUCH time to spend, or whether they&apos;re falling behind.</p>
      </Card>
      <Card>
        <h2 className="font-extrabold">THE INSIGHT</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Knowing what needs to be done isn&apos;t enough. Students need help deciding what to do next — with reasons they can trust.</p>
      </Card>
      <Card>
        <h2 className="font-extrabold">THE SOLUTION</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">StudyFlow AI continuously converts workload into an adaptive action plan: prioritize → schedule → focus → feedback → re-plan.</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="!bg-slate-50 dark:!bg-white/5">
          <p className="flex items-center gap-2 text-sm font-bold"><ListTodo size={16} /> Traditional</p>
          <p className="mt-1 font-mono text-xs text-slate-500">To-do list → student decides everything.</p>
        </Card>
        <Card className="!border-brand-200 !bg-brand-50/60 dark:!border-brand-500/20 dark:!bg-brand-500/10">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-white"><Brain size={16} /> StudyFlow</p>
          <p className="mt-1 font-mono text-xs text-brand-700/80 dark:text-brand-100/80">Workload → AI analyzes → priorities → schedule → feedback → adaptive schedule.</p>
        </Card>
      </div>
      <Card>
        <h2 className="flex items-center gap-2 font-extrabold"><CalendarCheck size={17} /> Signature moments</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
          <li><strong>“What should I do now?”</strong> — exactly one recommended next action with WHY + TIME.</li>
          <li><strong>Deadline Radar</strong> — Safe / Watch / At Risk scanning before panic sets in.</li>
          <li><strong>Rescue My Week</strong> — one-click rebalance with before/after view.</li>
          <li><strong className="inline-flex items-center gap-1"><Timer size={14} /> Focus mode</strong> — timed sessions whose difficulty feedback improves future estimates.</li>
        </ul>
      </Card>
      <p className="pb-6 text-center text-xs text-slate-400">Built solo for the CSC Back-to-School Hackathon · AI tools used for brainstorming, UI iteration, code assistance, debugging & docs — see AI_DISCLOSURE.md</p>
    </div>
  )
}

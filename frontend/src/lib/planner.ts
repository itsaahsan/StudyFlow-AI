import type { Task, PlanItem, NextAction, RadarItem } from './types'

const dayMs = 86400000
export const todayISO = () => { const d = new Date(); return d.toISOString().slice(0, 10) }
export function daysUntil(due?: string | null): number | null {
  if (!due) return null
  const t = new Date(todayISO() + 'T12:00:00').getTime()
  const d = new Date(due.slice(0, 10) + 'T12:00:00').getTime()
  return (d - t) / dayMs + 0.5
}
export const remaining = (t: Task) => Math.max(0, Math.round(t.estimated_minutes * (1 - t.progress / 100)))

function urgency(days: number | null): number {
  if (days === null) return 8
  if (days < 0) return 40
  if (days <= 1) return 38
  if (days <= 2) return 32
  if (days <= 3) return 27
  if (days <= 5) return 22
  if (days <= 7) return 18
  if (days <= 14) return 10
  return 5
}

export function priorityScore(t: Task): { score: number; why: string[] } {
  if (t.status === 'done' || t.progress >= 100) return { score: 0, why: ['Completed.'] }
  const rem = remaining(t), days = daysUntil(t.due_date)
  const u = urgency(days)
  const effort = Math.min(15, (rem / 180) * 15)
  const diff = t.difficulty * 3, imp = t.importance * 3
  let pressure = 0
  if (days !== null && days >= 0) pressure = Math.min(10, (rem / Math.max(1, (days + 1) * 60)) * 10)
  const score = Math.max(1, Math.min(100, u + effort + diff + imp + pressure))
  const why: string[] = []
  if (days === null) why.push('No due date set, so urgency is low')
  else if (days < 0) why.push('Overdue — needs immediate attention')
  else if (days <= 1) why.push('Due within 24 hours')
  else if (days <= 3) why.push(`Due in ~${Math.ceil(days)} days`)
  else why.push(`Due in ~${Math.ceil(days)} days`)
  if (rem >= 150) why.push(`Large workload (~${rem} min left) — start early`)
  else if (rem <= 30) why.push(`Quick win (~${rem} min left)`)
  if (t.difficulty >= 4) why.push('High difficulty — needs focused time')
  if (t.importance >= 4) why.push('High importance for your grade')
  if (pressure >= 6) why.push('Workload density is high for the time left')
  return { score: Math.round(score * 10) / 10, why }
}

export function riskOf(t: Task): RadarItem {
  const rem = remaining(t), days = daysUntil(t.due_date)
  if (t.status === 'done' || t.progress >= 100)
    return { task_id: t.id, title: t.title, level: 'Safe', reason: 'Completed.', recommendation: 'Keep the streak going.' }
  if (days === null)
    return { task_id: t.id, title: t.title, level: 'Safe', reason: 'No deadline set.', recommendation: 'Set a due date so Deadline Radar can protect it.' }
  if (days < 0)
    return { task_id: t.id, title: t.title, level: 'At Risk', reason: `Overdue with ~${rem} min still remaining.`, recommendation: 'Do a 25-minute focus session right now.' }
  if (days <= 2.5 && rem >= 120 && t.progress < 50)
    return { task_id: t.id, title: t.title, level: 'At Risk', reason: `${rem} min estimated, ${Math.max(1, Math.round(days))} days left, only ${t.progress}% complete.`, recommendation: 'Start a 45-minute research session today.' }
  if (days <= 3 && rem >= 180)
    return { task_id: t.id, title: t.title, level: 'At Risk', reason: `${rem} min estimated with ~${Math.ceil(days)} days remaining.`, recommendation: 'Split it into smaller sessions starting today.' }
  const cap = 180 * Math.max(0.5, days)
  if (rem / cap > 0.5 || (days <= 5 && t.progress < 30 && rem > 90))
    return { task_id: t.id, title: t.title, level: 'Watch', reason: `${rem} min left over ~${Math.max(1, Math.ceil(days))} days.`, recommendation: 'Schedule one focused session in the next 2 days.' }
  return { task_id: t.id, title: t.title, level: 'Safe', reason: `${rem} min left with ~${Math.max(1, Math.ceil(days))} days to go.`, recommendation: 'On track — keep it in the daily plan.' }
}

export function ranked(tasks: Task[]) {
  return tasks
    .map((t) => ({ task: t, ...priorityScore(t), risk: riskOf(t) }))
    .sort((a, b) => b.score - a.score)
}

export function dailyPlan(tasks: Task[], hours = 3): { plan: PlanItem[]; warnings: string[] } {
  const open = tasks.filter((t) => t.status !== 'done' && t.progress < 100)
  const r = ranked(open)
  const budget = Math.round(hours * 60)
  const plan: PlanItem[] = []
  const warnings: string[] = []
  let used = 0, mins = 16 * 60
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  for (const x of r) {
    const rem = remaining(x.task)
    if (rem <= 0) continue
    const chunk = Math.min(rem, rem > 45 ? 45 : rem)
    if (used + chunk > budget) {
      warnings.push(`Not enough time today for all of '${x.task.title}' — remainder moved to tomorrow.`)
      continue
    }
    plan.push({ task_id: x.task.id, title: x.task.title, subject: x.task.subject, start: fmt(mins), minutes: chunk, priority_score: x.score, why: x.why.slice(0, 2).join('; ') })
    used += chunk; mins += chunk + 10
  }
  if (used > budget * 0.95) warnings.push("Today is packed — try 'Rescue My Week' to rebalance.")
  return { plan, warnings }
}

export function nextAction(tasks: Task[]): NextAction {
  const open = tasks.filter((t) => t.status !== 'done' && t.progress < 100)
  if (!open.length) return { title: "You're all caught up!", why: 'No open tasks. Review notes or get ahead.', minutes: 20, task_id: null }
  const top = ranked(open)[0]
  const rem = remaining(top.task)
  const sub = top.task.subtasks.find((s) => !s.done)?.title
  const minutes = Math.min(45, Math.max(20, Math.min(rem, rem > 60 ? 25 : rem)))
  return {
    title: sub ? `Spend the next ${minutes} minutes on '${sub}' (${top.task.title}).` : `Spend the next ${minutes} minutes on '${top.task.title}' (${top.task.subject}).`,
    why: top.why.slice(0, 2).join('; '), minutes, task_id: top.task.id,
    priority_score: top.score, risk: top.risk.level
  }
}

export interface Rescue { total_hours: number; busiest_day: string; busiest_minutes: number; overloaded_by: number; moves: string[]; per_day: number }
export function rescueWeek(tasks: Task[], hours = 3): Rescue {
  const open = tasks.filter((t) => t.status !== 'done' && t.progress < 100)
  const total = open.reduce((a, t) => a + remaining(t), 0)
  const byDay: Record<string, number> = {}
  open.forEach((t) => { const k = t.due_date ?? 'unscheduled'; byDay[k] = (byDay[k] ?? 0) + remaining(t) })
  const entries = Object.entries(byDay).sort((a, b) => b[1] - a[1])
  const busiest_day = entries[0]?.[0] ?? '—', busiest_minutes = entries[0]?.[1] ?? 0
  const moves: string[] = []
  for (const t of [...open].sort((a, b) => remaining(a) - remaining(b))) {
    const rem = remaining(t)
    if (rem >= 120) moves.push(`Split '${t.title}' into ${Math.max(2, Math.min(4, Math.floor(rem / 60)))} sessions (~${Math.floor(rem / Math.max(2, Math.min(4, Math.floor(rem / 60))))} min each).`)
    else if (t.importance <= 2) moves.push(`Moved '${t.title}' earlier — low priority, flexible.`)
    if (moves.length >= 4) break
  }
  if (!moves.length && open.length) moves.push(`Rebalanced '${open[0].title}' to protect your lightest day.`)
  moves.push('Friday evening protected.')
  return { total_hours: Math.round((total / 60) * 10) / 10, busiest_day, busiest_minutes, overloaded_by: Math.max(0, busiest_minutes - Math.round(hours * 60)), moves: moves.slice(0, 5), per_day: Math.round(total / 5) }
}

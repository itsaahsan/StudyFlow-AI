import type { Profile, Task } from './types'

const iso = (plusDays: number) => {
  const d = new Date(); d.setDate(d.getDate() + plusDays)
  return d.toISOString().slice(0, 10)
}
let n = 0
const id = (p: string) => `${p}-${Date.now().toString(36)}${(n++).toString(36)}`

export const demoProfile: Profile = {
  name: 'Alex Morgan', grade: 'Grade 11',
  subjects: ['Mathematics', 'Biology', 'History', 'Computer Science', 'English'],
  available_hours: 3, preferred_times: ['afternoon', 'evening']
}

export function demoTasks(): Task[] {
  return [
    { id: id('t'), title: 'Mathematics Problem Set', subject: 'Mathematics', type: 'assignment', due_date: iso(1), estimated_minutes: 90, difficulty: 4, importance: 5, progress: 40, status: 'todo', subtasks: [
      { id: id('st'), title: 'Review chapter 7', estimated_minutes: 20, done: true },
      { id: id('st'), title: 'Solve odd problems', estimated_minutes: 45, done: false },
      { id: id('st'), title: 'Check answers', estimated_minutes: 25, done: false } ] },
    { id: id('t'), title: 'Biology Research Paper', subject: 'Biology', type: 'project', due_date: iso(2), estimated_minutes: 240, difficulty: 5, importance: 5, progress: 30, status: 'todo', subtasks: [
      { id: id('st'), title: 'Choose topic', estimated_minutes: 30, done: true },
      { id: id('st'), title: 'Research sources', estimated_minutes: 45, done: false },
      { id: id('st'), title: 'Create outline', estimated_minutes: 30, done: false },
      { id: id('st'), title: 'Draft introduction', estimated_minutes: 45, done: false },
      { id: id('st'), title: 'Complete analysis', estimated_minutes: 60, done: false },
      { id: id('st'), title: 'Review & submit', estimated_minutes: 30, done: false } ] },
    { id: id('t'), title: 'History Reading Ch. 12', subject: 'History', type: 'reading', due_date: iso(1), estimated_minutes: 45, difficulty: 2, importance: 3, progress: 0, status: 'todo', subtasks: [] },
    { id: id('t'), title: 'Computer Science Project', subject: 'Computer Science', type: 'project', due_date: iso(5), estimated_minutes: 300, difficulty: 4, importance: 4, progress: 55, status: 'in_progress', subtasks: [
      { id: id('st'), title: 'Design schema', estimated_minutes: 60, done: true },
      { id: id('st'), title: 'Build API', estimated_minutes: 90, done: false },
      { id: id('st'), title: 'Build UI', estimated_minutes: 90, done: false },
      { id: id('st'), title: 'Test & polish', estimated_minutes: 60, done: false } ] },
    { id: id('t'), title: 'English Essay Draft', subject: 'English', type: 'assignment', due_date: iso(4), estimated_minutes: 120, difficulty: 3, importance: 4, progress: 10, status: 'todo', subtasks: [
      { id: id('st'), title: 'Thesis statement', estimated_minutes: 25, done: false },
      { id: id('st'), title: 'Outline', estimated_minutes: 30, done: false },
      { id: id('st'), title: 'First draft', estimated_minutes: 65, done: false } ] },
    { id: id('t'), title: 'Chemistry Lab Report', subject: 'Chemistry', type: 'project', due_date: iso(2), estimated_minutes: 210, difficulty: 4, importance: 5, progress: 15, status: 'todo', subtasks: [
      { id: id('st'), title: 'Research methods', estimated_minutes: 50, done: false },
      { id: id('st'), title: 'Analyze results', estimated_minutes: 60, done: false },
      { id: id('st'), title: 'Write discussion', estimated_minutes: 60, done: false },
      { id: id('st'), title: 'Final review', estimated_minutes: 40, done: false } ] }
  ]
}

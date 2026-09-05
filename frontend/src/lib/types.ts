export interface Subtask { id: string; title: string; estimated_minutes: number; done: boolean }
export interface Task {
  id: string; title: string; subject: string;
  type: 'assignment' | 'quiz' | 'exam' | 'project' | 'reading' | 'extracurricular';
  due_date?: string | null; estimated_minutes: number;
  difficulty: number; importance: number; progress: number;
  status: 'todo' | 'in_progress' | 'done';
  subtasks: Subtask[]; depends_on?: string[];
}
export interface PlanItem { task_id: string; title: string; subject: string; start: string; minutes: number; priority_score: number; why: string }
export interface NextAction { title: string; why: string; minutes: number; task_id: string | null; priority_score?: number; risk?: string }
export interface RadarItem { task_id: string; title: string; level: 'Safe' | 'Watch' | 'At Risk'; reason: string; recommendation: string }
export interface Profile { name: string; grade: string; subjects: string[]; available_hours: number; preferred_times: string[] }

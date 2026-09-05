import { useEffect, useState } from 'react'
import type { Profile, Task } from './lib/types'
import { demoProfile, demoTasks } from './lib/seed'

const TKEY = 'sf_tasks_v1', PKEY = 'sf_profile_v1', THKEY = 'sf_theme'

function load<T>(k: string, fb: () => T): T {
  try { const raw = localStorage.getItem(k); if (raw) return JSON.parse(raw) as T } catch { /* ignore */ }
  const v = fb(); try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ }
  return v
}

export function useStore() {
  const [tasks, setTasks] = useState<Task[]>(() => load(TKEY, demoTasks))
  const [profile, setProfile] = useState<Profile>(() => load(PKEY, () => demoProfile))
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem(THKEY) ?? 'light' } catch { return 'light' } })
  const [sessions, setSessions] = useState<{ minutes: number; subject: string }[]>([{ minutes: 45, subject: 'Mathematics' }, { minutes: 30, subject: 'Biology' }])

  useEffect(() => { try { localStorage.setItem(TKEY, JSON.stringify(tasks)) } catch { /* ignore */ } }, [tasks])
  useEffect(() => { try { localStorage.setItem(PKEY, JSON.stringify(profile)) } catch { /* ignore */ } }, [profile])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem(THKEY, theme) } catch { /* ignore */ }
  }, [theme])

  const resetDemo = () => { const t = demoTasks(); setTasks(t); setProfile(demoProfile) }

  return { tasks, setTasks, profile, setProfile, theme, setTheme, sessions, setSessions, resetDemo }
}

export type Store = ReturnType<typeof useStore>

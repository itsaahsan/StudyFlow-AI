import type { Store } from '../store'
import { Card, SectionTitle } from '../components/ui'

export default function Settings({ store }: { store: Store }) {
  const { profile, setProfile, theme, setTheme, resetDemo } = store
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div><h1 className="text-2xl font-extrabold tracking-tight">Settings</h1><p className="text-sm text-slate-500">Tune StudyFlow to how you actually study.</p></div>
      <Card>
        <SectionTitle kicker="Profile" title="Student" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label" htmlFor="s-name">Name</label><input id="s-name" className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="s-grade">Grade</label><input id="s-grade" className="input" value={profile.grade} onChange={(e) => setProfile({ ...profile, grade: e.target.value })} /></div>
        </div>
        <div className="mt-3"><label className="label" htmlFor="s-hours">Available study hours per day: {profile.available_hours}h</label>
          <input id="s-hours" type="range" min={1} max={6} step={0.5} value={profile.available_hours} onChange={(e) => setProfile({ ...profile, available_hours: Number(e.target.value) })} className="w-full accent-indigo-600" /></div>
        <div className="mt-3"><span className="label">Appearance</span>
          <div className="flex gap-2">
            {(['light', 'dark'] as const).map((t) => <button key={t} onClick={() => setTheme(t)} aria-pressed={theme === t} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold capitalize transition ${theme === t ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-white' : 'border-slate-200 dark:border-white/10'}`}>{t}</button>)}
          </div></div>
      </Card>
      <Card>
        <SectionTitle kicker="Data" title="Demo & privacy" />
        <p className="text-sm text-slate-500">Demo intelligence mode runs 100% locally — no API key needed, nothing leaves your device. Set <code className="rounded bg-slate-100 px-1 dark:bg-white/10">VITE_API_URL</code> to connect the FastAPI backend for AI-powered mode.</p>
        <button className="btn-ghost mt-3" onClick={resetDemo}>Reset to demo data</button>
      </Card>
    </div>
  )
}

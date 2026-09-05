import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import { Login, Onboarding } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Focus from './pages/Focus'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import About from './pages/About'
import { useStore } from './store'

const PUBLIC = ['/', '/login', '/onboarding']

export default function App() {
  const store = useStore()
  const loc = useLocation()
  if (PUBLIC.includes(loc.pathname)) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Routes location={loc}>
            <Route path="/" element={<Landing store={store} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding store={store} />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    )
  }
  return (
    <Layout store={store}>
      <AnimatePresence mode="wait">
        <motion.div key={loc.pathname + loc.search} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          <Routes location={loc}>
            <Route path="/dashboard" element={<Dashboard store={store} />} />
            <Route path="/tasks" element={<Tasks store={store} />} />
            <Route path="/calendar" element={<Calendar store={store} />} />
            <Route path="/focus" element={<Focus store={store} />} />
            <Route path="/analytics" element={<Analytics store={store} />} />
            <Route path="/settings" element={<Settings store={store} />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}

import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Bookings from './pages/Bookings'
import EventRecord from './pages/EventRecord'
import NewBooking from './pages/NewBooking'
import Performers from './pages/Performers'
import Inbox from './pages/Inbox'
import CalendarPage from './pages/CalendarPage'
import KanbanPage from './pages/KanbanPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--muted)', fontSize: 13 }}>
      Loading...
    </div>
  )

  if (!session) return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout session={session} />}>
          <Route index element={<Overview />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/new" element={<NewBooking />} />
          <Route path="bookings/:id" element={<EventRecord />} />
          <Route path="performers" element={<Performers />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="kanban" element={<KanbanPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const STATUS_COLORS = {
  confirmed:   { bg: '#e6f5f4', text: '#2a6b66', dot: '#6BBDB5' },
  in_progress: { bg: '#fdf3e0', text: '#7a5510', dot: '#C9973A' },
  planning:    { bg: '#f0e8ec', text: '#3a1a2c', dot: '#5C3048' },
  missing:     { bg: '#f9ede7', text: '#7a2e14', dot: '#C95A35' },
}

export default function CalendarPage() {
  const nav = useNavigate()
  const [bookings, setBookings] = useState([])
  const today = new Date()
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() })

  useEffect(() => {
    supabase.from('bookings').select('id,client_name,event_type,event_date,status,venue,pax')
      .not('event_date', 'is', null)
      .then(({ data }) => setBookings(data || []))
  }, [])

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()
  const firstDay = new Date(current.year, current.month, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  const bookingsByDate = {}
  bookings.forEach(b => {
    if (!b.event_date) return
    const d = new Date(b.event_date)
    if (d.getFullYear() === current.year && d.getMonth() === current.month) {
      const day = d.getDate()
      if (!bookingsByDate[day]) bookingsByDate[day] = []
      bookingsByDate[day].push(b)
    }
  })

  const upcomingBookings = bookings
    .filter(b => b.event_date && new Date(b.event_date) >= today)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 8)

  const prevMonth = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })
  const nextMonth = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 })

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  const isToday = (day) => day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear()

  return (
    <div>
      <div className="page-header">
        <h1 className="section-heading">Calendar</h1>
        <button className="btn btn-primary" onClick={() => nav('/bookings/new')}>+ New booking</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <button className="btn" onClick={prevMonth} style={{ padding: '6px 12px' }}>←</button>
            <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--serif)' }}>
              {MONTHS[current.month]} {current.year}
            </div>
            <button className="btn" onClick={nextMonth} style={{ padding: '6px 12px' }}>→</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const events = day ? (bookingsByDate[day] || []) : []
              return (
                <div key={i} style={{
                  minHeight: 90, padding: '6px',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                  borderBottom: '1px solid var(--border)',
                  background: day && isToday(day) ? 'rgba(201,90,53,0.04)' : 'transparent',
                }}>
                  {day && (
                    <>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: isToday(day) ? 700 : 400,
                        background: isToday(day) ? 'var(--terracotta)' : 'transparent',
                        color: isToday(day) ? '#fff' : 'var(--text)',
                        marginBottom: 4,
                      }}>{day}</div>
                      {events.slice(0, 3).map(b => {
                        const sc = STATUS_COLORS[b.status] || STATUS_COLORS.planning
                        return (
                          <div key={b.id} onClick={() => nav(`/bookings/${b.id}`)} style={{
                            padding: '2px 6px', borderRadius: 4, marginBottom: 2, cursor: 'pointer',
                            background: sc.bg, color: sc.text,
                            fontSize: 10, fontWeight: 500, lineHeight: 1.4,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            borderLeft: `2.5px solid ${sc.dot}`,
                          }}>
                            {b.client_name}
                          </div>
                        )
                      })}
                      {events.length > 3 && <div style={{ fontSize: 10, color: 'var(--muted)', padding: '0 4px' }}>+{events.length - 3} more</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
              Upcoming events
            </div>
            {upcomingBookings.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No upcoming events.</div>
            )}
            {upcomingBookings.map((b, i) => {
              const sc = STATUS_COLORS[b.status] || STATUS_COLORS.planning
              const d = new Date(b.event_date)
              const daysUntil = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
              return (
                <div key={b.id} onClick={() => nav(`/bookings/${b.id}`)} style={{
                  padding: '12px 18px',
                  borderBottom: i < upcomingBookings.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>{b.client_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.event_type} · {b.venue}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: daysUntil <= 7 ? 'var(--terracotta)' : daysUntil <= 14 ? 'var(--gold)' : 'var(--muted)' }}>
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.text }}>
                      {(b.status || 'planning').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Status legend</div>
            {Object.entries(STATUS_COLORS).map(([s, sc]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text)', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
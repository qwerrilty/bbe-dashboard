import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EVENT_TYPES = ['All', 'Gala dinner', 'Incentive trip', 'Conference', 'Wedding', 'Festival', 'Birthday party', 'In-house entertainment']
const STATUSES = ['All', 'confirmed', 'in_progress', 'planning', 'missing']

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState({ type: 'All', status: 'All' })
  const nav = useNavigate()

  useEffect(() => {
    let q = supabase.from('bookings').select('*').order('event_date', { ascending: true })
    if (filter.type !== 'All') q = q.eq('event_type', filter.type)
    if (filter.status !== 'All') q = q.eq('status', filter.status)
    q.then(({ data }) => setBookings(data || []))
  }, [filter])

  const statusMap = {
    confirmed: 'badge-ok',
    in_progress: 'badge-info',
    planning: 'badge-purple',
    missing: 'badge-no',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="section-heading" style={{ margin: 0 }}>All bookings</h1>
        <button className="btn btn-primary" onClick={() => nav('/bookings/new')}>+ New booking</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))} style={{ width: 'auto' }}>
          {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ width: 'auto' }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        {bookings.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No bookings found.
          </div>
        )}
        {bookings.map((b, i) => (
          <div
            key={b.id}
            onClick={() => nav(`/bookings/${b.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 18px', cursor: 'pointer',
              borderBottom: i < bookings.length - 1 ? '0.5px solid var(--border)' : 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: 'var(--ocean-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500, color: 'var(--ocean-text)', flexShrink: 0,
            }}>
              {(b.client_name || 'BB').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>{b.client_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {b.event_type} · {b.venue} · {b.pax} pax
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
              {b.event_date ? new Date(b.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
            </div>
            <div style={{ flexShrink: 0 }}>
              <span className={`badge ${statusMap[b.status] || 'badge-warn'}`}>
                {(b.status || 'planning').replace('_', ' ')}
              </span>
            </div>
            {b.missing_count > 0 && (
              <span className="badge badge-no">{b.missing_count} missing</span>
            )}
            <span style={{ color: 'var(--muted)', fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}

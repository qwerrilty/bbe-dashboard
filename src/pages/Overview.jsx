import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Overview() {
  const [bookings, setBookings] = useState([])
  const [metrics, setMetrics] = useState({ total: 0, thisMonth: 0, missingCount: 0, pendingPerformers: 0 })
  const nav = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(5)

      const { count: monthCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', startOfMonth)
        .lte('event_date', endOfMonth)

      const { count: missingCount } = await supabase
        .from('checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('completed', false)

      const { count: pendingCount } = await supabase
        .from('performers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'nr')

      setBookings(data || [])
      setMetrics({
        total: data?.length || 0,
        thisMonth: monthCount || 0,
        missingCount: missingCount || 0,
        pendingPerformers: pendingCount || 0,
      })
    }
    fetchData()
  }, [])

  const statusBadge = (status) => {
    const map = {
      confirmed: ['badge-ok', 'Confirmed'],
      in_progress: ['badge-info', 'In progress'],
      planning: ['badge-purple', 'Planning'],
      missing: ['badge-no', 'Missing info'],
    }
    const [cls, label] = map[status] || ['badge-warn', status || 'Planning']
    return <span className={`badge ${cls}`}>{label}</span>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="section-heading" style={{ margin: 0 }}>Overview</h1>
        <button className="btn btn-primary" onClick={() => nav('/bookings/new')}>
          + New booking
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Upcoming events', value: metrics.thisMonth, sub: 'this month' },
          { label: 'Missing items', value: metrics.missingCount, sub: 'need action', danger: metrics.missingCount > 0 },
          { label: 'Performers pending', value: metrics.pendingPerformers, sub: 'no reply', warn: metrics.pendingPerformers > 0 },
          { label: 'Total bookings', value: metrics.total, sub: 'in pipeline' },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--bg2)', borderRadius: 10, padding: '14px 16px',
            border: '0.5px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{
              fontSize: 28, fontWeight: 500, fontFamily: 'var(--serif)',
              color: m.danger ? 'var(--coral)' : m.warn ? 'var(--gold)' : 'var(--text)',
            }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <div className="card">
        <div style={{ padding: '12px 18px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Upcoming events</div>
          <button className="btn" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => nav('/bookings')}>View all</button>
        </div>
        {bookings.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No bookings yet. <span style={{ color: 'var(--ocean)', cursor: 'pointer' }} onClick={() => nav('/bookings/new')}>Create your first one →</span>
          </div>
        )}
        {bookings.map((b, i) => (
          <div
            key={b.id}
            onClick={() => nav(`/bookings/${b.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 18px',
              borderBottom: i < bookings.length - 1 ? '0.5px solid var(--border)' : 'none',
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 8, background: 'var(--ocean-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 500, color: 'var(--ocean-text)', flexShrink: 0,
            }}>
              {(b.client_name || 'BB').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{b.client_name} — {b.event_type}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{b.venue} · {b.pax} pax</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
              {b.event_date ? new Date(b.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
            <div style={{ flexShrink: 0 }}>{statusBadge(b.status)}</div>
            {b.missing_count > 0 && (
              <span className="badge badge-no">{b.missing_count} missing</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

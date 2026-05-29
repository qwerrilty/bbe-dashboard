import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Performers() {
  const [performers, setPerformers] = useState([])
  const [filter, setFilter] = useState('all')
  const nav = useNavigate()

  useEffect(() => {
    let q = supabase
      .from('performers')
      .select('*, bookings(client_name, event_type, event_date, venue)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    q.then(({ data }) => setPerformers(data || []))
  }, [filter])

  const updateStatus = async (id, status) => {
    setPerformers(ps => ps.map(p => p.id === id ? { ...p, status } : p))
    await supabase.from('performers').update({ status }).eq('id', id)
  }

  const statusStyle = (s) => {
    const map = {
      yes: { bg: 'var(--green-bg)', color: 'var(--green-text)', label: 'Accepted' },
      no:  { bg: 'var(--coral-bg)', color: 'var(--coral-text)', label: 'Declined' },
      nr:  { bg: 'var(--gold-bg)',  color: 'var(--gold-text)',  label: 'No reply' },
    }
    return map[s] || map.nr
  }

  const grouped = performers.reduce((acc, p) => {
    const key = p.booking_id
    if (!acc[key]) acc[key] = { booking: p.bookings, performers: [] }
    acc[key].performers.push(p)
    return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="section-heading" style={{ margin: 0 }}>Performers & call sheets</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'nr', 'yes', 'no'].map(f => (
            <button
              key={f}
              className="btn"
              onClick={() => setFilter(f)}
              style={{ fontSize: 12, padding: '5px 12px', background: filter === f ? 'var(--ocean)' : 'transparent', color: filter === f ? '#fff' : 'var(--text)', borderColor: filter === f ? 'var(--ocean)' : 'var(--border-mid)' }}
            >
              {f === 'all' ? 'All' : f === 'nr' ? 'No reply' : f === 'yes' ? 'Accepted' : 'Declined'}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(grouped).length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>No performers found.</div>
      )}

      {Object.entries(grouped).map(([bookingId, { booking, performers: ps }]) => (
        <div key={bookingId} className="card" style={{ marginBottom: 14 }}>
          <div
            style={{ padding: '11px 18px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => nav(`/bookings/${bookingId}`)}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{booking?.client_name} — {booking?.event_type}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {booking?.venue} · {booking?.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {ps.filter(p => p.status === 'nr').length > 0 && (
                <span className="badge badge-warn">{ps.filter(p => p.status === 'nr').length} pending</span>
              )}
              {ps.every(p => p.status === 'yes') && <span className="badge badge-ok">All confirmed</span>}
              <span style={{ color: 'var(--muted)' }}>›</span>
            </div>
          </div>
          {ps.map((p, i) => {
            const ss = statusStyle(p.status)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: i < ps.length - 1 ? '0.5px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ocean-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: 'var(--ocean-text)', flexShrink: 0 }}>
                  {(p.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.type}{p.time_slot ? ` · ${p.time_slot}` : ''}{p.fee ? ` · $${p.fee}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['yes', 'no', 'nr'].map(s => {
                    const st = statusStyle(s)
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(p.id, s)}
                        style={{
                          padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                          border: `0.5px solid ${p.status === s ? st.color : 'var(--border-mid)'}`,
                          background: p.status === s ? st.bg : 'transparent',
                          color: p.status === s ? st.color : 'var(--muted)',
                        }}
                      >
                        {s === 'nr' ? 'NR' : s.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 99, background: ss.bg, color: ss.color }}>
                  {ss.label}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const COLUMNS = [
  { id: 'planning',    label: 'Planning',     color: '#5C3048', bg: '#f0e8ec', desc: 'New enquiries being scoped' },
  { id: 'in_progress', label: 'In progress',  color: '#C9973A', bg: '#fdf3e0', desc: 'Confirmed, gathering info' },
  { id: 'missing',     label: 'Missing info', color: '#C95A35', bg: '#f9ede7', desc: 'Items outstanding' },
  { id: 'confirmed',   label: 'Confirmed',    color: '#6BBDB5', bg: '#e6f5f4', desc: 'All info received' },
  { id: 'done',        label: 'Done',         color: '#7a7060', bg: '#faf8f4', desc: 'Event completed' },
]

export default function KanbanPage() {
  const nav = useNavigate()
  const [bookings, setBookings] = useState([])
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  useEffect(() => {
    supabase.from('bookings')
      .select('*, checklist_items(id,completed)')
      .order('event_date', { ascending: true })
      .then(({ data }) => setBookings(data || []))
  }, [])

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = bookings.filter(b => {
      if (col.id === 'missing') return b.missing_count > 0 && b.status !== 'confirmed' && b.status !== 'done'
      return b.status === col.id
    })
    return acc
  }, {})

  const moveBooking = async (id, newStatus) => {
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status: newStatus } : b))
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
  }

  const handleDragStart = (e, booking) => {
    setDragging(booking)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e, colId) => {
    e.preventDefault()
    if (dragging?.id) moveBooking(dragging.id, colId)
    setDragging(null)
    setDragOver(null)
  }

  const totalMissing = bookings.reduce((sum, b) => sum + (b.missing_count || 0), 0)
  const totalConfirmed = bookings.filter(b => b.status === 'confirmed').length
  const totalActive = bookings.filter(b => b.status !== 'done').length

  return (
    <div>
      <div className="page-header">
        <h1 className="section-heading">Pipeline</h1>
        <button className="btn btn-primary" onClick={() => nav('/bookings/new')}>+ New booking</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active bookings', value: totalActive,   color: 'var(--teal)' },
          { label: 'Missing info',    value: totalMissing,  color: totalMissing > 0 ? 'var(--terracotta)' : 'var(--teal)' },
          { label: 'Confirmed',       value: totalConfirmed, color: 'var(--teal)' },
          { label: 'Total bookings',  value: bookings.length, color: 'var(--text)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px', cursor: 'default' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--serif)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLUMNS.length}, 1fr)`, gap: 14, alignItems: 'start' }}>
        {COLUMNS.map(col => {
          const cards = grouped[col.id] || []
          const isOver = dragOver === col.id
          return (
            <div key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, col.id)}>

              {/* Column header */}
              <div style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 10,
                background: isOver ? col.bg : 'var(--bg2)',
                border: `1.5px solid ${isOver ? col.color : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: col.bg, color: col.color }}>{cards.length}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{col.desc}</div>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                {cards.map(b => {
                  const missing = b.missing_count || 0
                  const d = b.event_date ? new Date(b.event_date) : null
                  const daysUntil = d ? Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24)) : null
                  const urgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0
                  const total = b.checklist_items?.length || 0
                  const done = b.checklist_items?.filter(c => c.completed).length || 0

                  return (
                    <div key={b.id}
                      draggable
                      onDragStart={e => handleDragStart(e, b)}
                      onClick={() => nav(`/bookings/${b.id}`)}
                      style={{
                        background: 'var(--bg)',
                        border: `1px solid ${urgent ? 'var(--terracotta)' : 'var(--border)'}`,
                        borderLeft: `3px solid ${col.color}`,
                        borderRadius: 10, padding: '14px', cursor: 'grab',
                        boxShadow: dragging?.id === b.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                        opacity: dragging?.id === b.id ? 0.5 : 1,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{b.client_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{b.event_type}</div>

                      {b.venue && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>📍 {b.venue}</div>
                      )}

                      {d && (
                        <div style={{ fontSize: 11, marginBottom: 8, fontWeight: 500, color: urgent ? 'var(--terracotta)' : 'var(--muted)' }}>
                          📅 {d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && (
                            <span style={{ marginLeft: 6, fontWeight: 700 }}>
                              {daysUntil === 0 ? '· Today!' : daysUntil === 1 ? '· Tomorrow!' : `· ${daysUntil}d`}
                            </span>
                          )}
                        </div>
                      )}

                      {b.pax && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>👥 {b.pax} pax</div>
                      )}

                      {total > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>
                            <span>Checklist</span><span>{done}/{total}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: done === total ? 'var(--teal)' : done > total / 2 ? 'var(--gold)' : 'var(--terracotta)', borderRadius: 2, transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}

                      {missing > 0 && (
                        <div style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--terracotta-bg)', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--terracotta-text)', fontWeight: 500 }}>⚠ {missing} item{missing > 1 ? 's' : ''} missing</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {COLUMNS.filter(c => c.id !== col.id && c.id !== 'missing').map(c => (
                          <button key={c.id}
                            onClick={e => { e.stopPropagation(); moveBooking(b.id, c.id) }}
                            style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, cursor: 'pointer', border: `1px solid ${c.color}40`, background: 'transparent', color: c.color, fontWeight: 500 }}>
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {cards.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12, border: '2px dashed var(--border)', borderRadius: 10, background: isOver ? col.bg : 'transparent', transition: 'all 0.15s' }}>
                    {isOver ? 'Drop here' : 'No bookings'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
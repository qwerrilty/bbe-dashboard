import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EVENT_TYPES = ['Gala dinner', 'Incentive trip', 'Conference', 'Wedding', 'Festival', 'Birthday party', 'In-house entertainment', 'Other']

export default function Inbox() {
  const [threads, setThreads] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const nav = useNavigate()

  const [intake, setIntake] = useState({
    client_name: '', event_type: 'Gala dinner', pax: '',
    event_date: '', venue: '', entertainment: [],
    client_email: '', client_phone: '', notes: '',
  })

  useEffect(() => {
    supabase.from('email_threads').select('*').order('received_at', { ascending: false })
      .then(({ data }) => setThreads(data || []))
  }, [])

  const toggleEnt = (e) => setIntake(f => ({
    ...f,
    entertainment: f.entertainment.includes(e) ? f.entertainment.filter(x => x !== e) : [...f.entertainment, e],
  }))

  const handleIntake = async () => {
    if (!intake.client_name) return alert('Client name required')
    setSaving(true)
    const { data, error } = await supabase.from('bookings').insert([{
      client_name: intake.client_name,
      event_type: intake.event_type,
      pax: intake.pax ? parseInt(intake.pax) : null,
      event_date: intake.event_date || null,
      venue: intake.venue,
      client_email: intake.client_email,
      client_phone: intake.client_phone,
      event_brief: intake.notes,
      act_booked: intake.entertainment.join(', '),
      status: 'planning',
      stage: 1,
      missing_count: 0,
    }]).select().single()
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    nav(`/bookings/${data.id}`)
  }

  const markRead = async (id) => {
    setThreads(ts => ts.map(t => t.id === id ? { ...t, unread: false } : t))
    await supabase.from('email_threads').update({ unread: false }).eq('id', id)
  }

  return (
    <div>
      <h1 className="section-heading">Inbox</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Email threads */}
        <div className="card">
          <div style={{ padding: '11px 18px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Enquiries</div>
            {threads.filter(t => t.unread).length > 0 && (
              <span className="badge badge-no">{threads.filter(t => t.unread).length} new</span>
            )}
          </div>
          {threads.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No emails yet. Connect Gmail in your Supabase Edge Functions to sync threads here.
            </div>
          )}
          {threads.map((t, i) => (
            <div
              key={t.id}
              onClick={() => { setSelected(t); markRead(t.id) }}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '11px 18px', cursor: 'pointer',
                borderBottom: i < threads.length - 1 ? '0.5px solid var(--border)' : 'none',
                background: selected?.id === t.id ? 'var(--ocean-bg)' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (selected?.id !== t.id) e.currentTarget.style.background = 'var(--bg2)' }}
              onMouseLeave={e => { if (selected?.id !== t.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: t.unread ? 'var(--coral)' : 'transparent' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: t.unread ? 500 : 400, fontSize: 13, color: 'var(--text)' }}>{t.from_name || t.from_email}</div>
                <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 1 }}>{t.subject}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                {t.received_at ? new Date(t.received_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Quick intake / selected thread */}
        {selected ? (
          <div className="card">
            <div style={{ padding: '11px 18px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{selected.subject}</div>
              <button className="btn" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                From: <strong style={{ color: 'var(--text)' }}>{selected.from_name || selected.from_email}</strong>
                {selected.from_email && selected.from_name ? ` <${selected.from_email}>` : ''}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                {selected.body || selected.preview}
              </div>
              <hr className="divider" />
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 10 }}>LOG AS NEW BOOKING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="field">
                  <label>Client name</label>
                  <input value={intake.client_name} onChange={e => setIntake(f => ({ ...f, client_name: e.target.value }))} />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Event type</label>
                    <select value={intake.event_type} onChange={e => setIntake(f => ({ ...f, event_type: e.target.value }))}>
                      {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Pax</label>
                    <input type="number" value={intake.pax} onChange={e => setIntake(f => ({ ...f, pax: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input type="date" value={intake.event_date} onChange={e => setIntake(f => ({ ...f, event_date: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label>Venue</label>
                    <input value={intake.venue} onChange={e => setIntake(f => ({ ...f, venue: e.target.value }))} />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleIntake} disabled={saving} style={{ justifyContent: 'center' }}>
                  {saving ? 'Creating...' : '+ Create booking from this email'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{ padding: '11px 18px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)', fontSize: 13, fontWeight: 500 }}>
              Quick intake — log to bookings
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field">
                <label>Client / company name *</label>
                <input value={intake.client_name} onChange={e => setIntake(f => ({ ...f, client_name: e.target.value }))} placeholder="e.g. Salesforce Australia" />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Event type</label>
                  <select value={intake.event_type} onChange={e => setIntake(f => ({ ...f, event_type: e.target.value }))}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Pax</label>
                  <input type="number" value={intake.pax} onChange={e => setIntake(f => ({ ...f, pax: e.target.value }))} placeholder="200" />
                </div>
                <div className="field">
                  <label>Event date</label>
                  <input type="date" value={intake.event_date} onChange={e => setIntake(f => ({ ...f, event_date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Venue</label>
                  <input value={intake.venue} onChange={e => setIntake(f => ({ ...f, venue: e.target.value }))} placeholder="e.g. Elements of Byron" />
                </div>
              </div>
              <div className="field">
                <label>Entertainment needed</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {['Band', 'Solo act', 'DJ', 'Roving / circus', 'Interactive', 'Tour'].map(e => (
                    <label key={e} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={intake.entertainment.includes(e)} onChange={() => toggleEnt(e)} style={{ width: 'auto' }} />
                      {e}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Client email</label>
                <input type="email" value={intake.client_email} onChange={e => setIntake(f => ({ ...f, client_email: e.target.value }))} />
              </div>
              <div className="field">
                <label>Notes from enquiry</label>
                <textarea value={intake.notes} onChange={e => setIntake(f => ({ ...f, notes: e.target.value }))} placeholder="Paste key details from the email..." style={{ minHeight: 80 }} />
              </div>
              <button className="btn btn-primary" onClick={handleIntake} disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? 'Creating...' : '+ Create booking →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

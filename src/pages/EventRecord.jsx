import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import EmailButton from '../components/EmailButton'
import { buildCallSheetEmail } from '../lib/email'

function Section({ sid, title, badge, open, setOpen, children }) {
  const isOpen = open[sid] !== false
  return (
    <div className="card" style={{ marginBottom: 14, overflow: 'visible' }}>
      <div onClick={() => setOpen(o => ({ ...o, [sid]: !isOpen }))}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: isOpen ? '1px solid var(--border)' : 'none', background: 'var(--bg2)', borderRadius: isOpen ? '14px 14px 0 0' : 14, cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {badge}
          <span style={{ color: 'var(--muted)', fontSize: 18, transform: isOpen ? '' : 'rotate(-90deg)', display: 'inline-block', transition: 'transform 0.2s' }}>⌄</span>
        </div>
      </div>
      {isOpen && <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>}
    </div>
  )
}

const STAGES = ['Enquiry', 'Logged to Sheets', 'Calendar created', 'Performers locked', 'Info complete', 'Call sheet sent', 'Done']
const PERFORMER_TYPES = ['Solo act', 'Duo', 'Band', 'DJ', 'Roving / circus', 'Interactive', 'Other']

export default function EventRecord() {
  const { id } = useParams()
  const nav = useNavigate()
  const [booking, setBooking] = useState(null)
  const [performers, setPerformers] = useState([])
  const [runsheet, setRunsheet] = useState([])
  const [checklist, setChecklist] = useState([])
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState(null)

  useEffect(() => {
    if (!id || id === 'new') return
    const load = async () => {
      const [b, p, r, c] = await Promise.all([
        supabase.from('bookings').select('*').eq('id', id).single(),
        supabase.from('performers').select('*').eq('booking_id', id).order('created_at'),
        supabase.from('runsheet_items').select('*').eq('booking_id', id).order('time'),
        supabase.from('checklist_items').select('*').eq('booking_id', id).order('created_at'),
      ])
      if (b.data) setBooking(b.data)
      setPerformers(p.data || [])
      setRunsheet(r.data || [])
      setChecklist(c.data || [])
    }
    load()

    // Realtime subscription
    const sub = supabase.channel(`booking-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'performers', filter: `booking_id=eq.${id}` }, () => {
        supabase.from('performers').select('*').eq('booking_id', id).then(({ data }) => setPerformers(data || []))
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [id])

  const saveBooking = async () => {
    setSaving(true)
    await supabase.from('bookings').update(booking).eq('id', id)
    setSaving(false)
  }

  const setField = (key, val) => setBooking(b => ({ ...b, [key]: val }))

  const updatePerformer = async (pid, key, val) => {
    setPerformers(ps => ps.map(p => p.id === pid ? { ...p, [key]: val } : p))
    await supabase.from('performers').update({ [key]: val }).eq('id', pid)
  }

  const addPerformer = async () => {
    const { data } = await supabase.from('performers').insert([{
      booking_id: id, name: 'New performer', type: 'Solo act', status: 'nr', fee: 0,
    }]).select().single()
    if (data) setPerformers(ps => [...ps, data])
  }

  const deletePerformer = async (pid) => {
    await supabase.from('performers').delete().eq('id', pid)
    setPerformers(ps => ps.filter(p => p.id !== pid))
  }

  const addRunsheetRow = async () => {
    const { data } = await supabase.from('runsheet_items').insert([{
      booking_id: id, time: '', item: '', duration: '',
    }]).select().single()
    if (data) setRunsheet(rs => [...rs, data])
  }

  const updateRunsheet = async (rid, key, val) => {
    setRunsheet(rs => rs.map(r => r.id === rid ? { ...r, [key]: val } : r))
    await supabase.from('runsheet_items').update({ [key]: val }).eq('id', rid)
  }

  const deleteRunsheetRow = async (rid) => {
    await supabase.from('runsheet_items').delete().eq('id', rid)
    setRunsheet(rs => rs.filter(r => r.id !== rid))
  }

  const toggleChecklistItem = async (item) => {
    const updated = { ...item, completed: !item.completed }
    setChecklist(cs => cs.map(c => c.id === item.id ? updated : c))
    await supabase.from('checklist_items').update({ completed: updated.completed }).eq('id', item.id)
    // Update missing count
    const newMissing = checklist.filter(c => c.id !== item.id ? !c.completed : item.completed).length
    await supabase.from('bookings').update({ missing_count: newMissing }).eq('id', id)
  }

  const addChecklistItem = async () => {
    const { data } = await supabase.from('checklist_items').insert([{
      booking_id: id, label: 'New item', completed: false, owner: '',
    }]).select().single()
    if (data) setChecklist(cs => [...cs, data])
  }

  const generateCallSheet = () => {
    if (!booking) return
    const lines = [
      `CALL SHEET — Byron Bay Experience`,
      `${'─'.repeat(44)}`,
      `EVENT:     ${booking.client_name} — ${booking.event_type}`,
      `VENUE:     ${booking.venue || '—'}`,
      `DATE:      ${booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}`,
      `PAX:       ${booking.pax || '—'} guests`,
      `DRESS:     ${booking.dress_code || '—'}`,
      ``,
      `ON THE DAY CONTACT`,
      `  ${booking.on_day_contact || 'Renee · 0403 769 229'}`,
      ``,
      `${'─'.repeat(20)} SCHEDULE ${'─'.repeat(15)}`,
      `BUMP IN:   ${booking.bump_in_time || '—'}`,
      `GUESTS:    ${booking.guest_arrival_time || '—'}`,
      ``,
      ...runsheet.map(r => `${(r.time || '—').padEnd(9)} ${r.item}${r.duration ? ` (${r.duration})` : ''}`),
      ``,
      `${'─'.repeat(20)} PERFORMERS ${'─'.repeat(13)}`,
      ...performers.map(p => `${p.name} — ${p.type} · Status: ${p.status?.toUpperCase() || 'NR'} · Fee: $${p.fee || '—'}`),
      ``,
      `${'─'.repeat(20)} GREEN ROOM ${'─'.repeat(14)}`,
      booking.greenroom_location || '—',
      booking.greenroom_notes || '',
      ``,
      `${'─'.repeat(20)} TRAVEL ${'─'.repeat(17)}`,
      booking.travel_notes || '—',
      ``,
      `${'─'.repeat(20)} SONG REQUESTS ${'─'.repeat(11)}`,
      booking.song_requests || '—',
      booking.spotify_link ? `Spotify: ${booking.spotify_link}` : '',
      booking.do_not_play ? `Do not play: ${booking.do_not_play}` : '',
      ``,
      `${'─'.repeat(20)} CREW MEALS ${'─'.repeat(13)}`,
      booking.crew_meals || '—',
      ``,
      `${'─'.repeat(20)} DJ TABLE & POWER ${'─'.repeat(7)}`,
      booking.dj_table_power || '—',
      `${'─'.repeat(44)}`,
    ]
    const missing = checklist.filter(c => !c.completed)
    if (missing.length > 0) {
      lines.push(``, `⚠  STILL MISSING:`, ...missing.map(m => `   • ${m.label}`))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `call-sheet-${(booking.client_name || 'event').replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
  }

  const statusColors = { yes: 'var(--green)', no: 'var(--coral)', nr: 'var(--gold)' }
  const statusBg = { yes: 'var(--green-bg)', no: 'var(--coral-bg)', nr: 'var(--gold-bg)' }
  const statusText = { yes: 'var(--green-text)', no: 'var(--coral-text)', nr: 'var(--gold-text)' }

  

  if (!booking) return <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Loading...</div>

  const missingCount = checklist.filter(c => !c.completed).length
  const pendingPerformers = performers.filter(p => p.status === 'nr').length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button className="btn" onClick={() => nav('/bookings')} style={{ marginBottom: 8, padding: '5px 10px', fontSize: 12 }}>← All bookings</button>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
            {booking.client_name} — {booking.event_type}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>{booking.venue}</span>
            <span>{booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
            <span>{booking.pax} pax</span>
            {missingCount > 0 && <span className="badge badge-no">{missingCount} missing</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={saveBooking} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          <button className="btn" onClick={generateCallSheet}>↓ Download call sheet</button>
          <EmailButton
            label="✉ Send to performers"
            to={performers.filter(p => p.email).map(p => p.email)}
            subject={buildCallSheetEmail(booking, performers).subject}
            body={buildCallSheetEmail(booking, performers).body}
            bookingId={booking.id}
            type="call_sheet"
          />
        </div>
      </div>

      {/* Progress stages */}
      <div className="card" style={{ marginBottom: 16, overflowX: 'auto' }}>
        <div style={{ display: 'flex', padding: '12px 18px', gap: 0, minWidth: 560 }}>
          {STAGES.map((s, i) => {
            const stage = booking.stage || 1
            const done = i + 1 < stage
            const active = i + 1 === stage
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  <div
                    onClick={() => setField('stage', i + 1)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 500,
                      background: done ? 'var(--green)' : active ? 'var(--ocean)' : 'var(--bg2)',
                      border: `1.5px solid ${done ? 'var(--green)' : active ? 'var(--ocean)' : 'var(--border-mid)'}`,
                      color: done || active ? '#fff' : 'var(--muted)',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 10, color: active ? 'var(--ocean)' : 'var(--muted)', fontWeight: active ? 500 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</div>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ height: 1, width: 20, background: done ? 'var(--green)' : 'var(--border-mid)', flexShrink: 0, marginBottom: 16 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Missing items alert */}
      {missingCount > 0 && (
        <div style={{ background: 'var(--gold-bg)', border: '0.5px solid var(--gold)', borderRadius: 8, padding: '10px 16px', marginBottom: 14, display: 'flex', gap: 8, fontSize: 13, color: 'var(--gold-text)' }}>
          <span>⚠</span>
          <span><strong>{missingCount} item{missingCount > 1 ? 's' : ''} still missing</strong> — call sheet should not be sent until these are resolved.</span>
        </div>
      )}

      {/* Performers */}
      <Section id="performers" title="Act booked & performers" badge={pendingPerformers > 0 ? <span className="badge badge-warn">{pendingPerformers} pending</span> : null}>
        <div className="grid-2">
          <div className="field">
            <label>Act booked (summary)</label>
            <input value={booking.act_booked || ''} onChange={e => setField('act_booked', e.target.value)} placeholder="e.g. Band + DJ + Circus roving" />
          </div>
          <div className="field">
            <label>Booked by</label>
            <input value={booking.booked_by || ''} onChange={e => setField('booked_by', e.target.value)} placeholder="Renee" />
          </div>
          <div className="field">
            <label>Platform booked via</label>
            <select value={booking.booking_platform || 'Direct'} onChange={e => setField('booking_platform', e.target.value)}>
              {['Direct / email', 'Referral', 'Airtasker', 'GigSalad', 'Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Date locked in</label>
            <input type="date" value={booking.locked_date || ''} onChange={e => setField('locked_date', e.target.value)} />
          </div>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>PERFORMERS</div>
        <div style={{ border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {performers.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No performers added yet.</div>
          )}
          {performers.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < performers.length - 1 ? '0.5px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ocean-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: 'var(--ocean-text)', flexShrink: 0 }}>
                {(p.name || '?').slice(0, 2).toUpperCase()}
              </div>
              <input value={p.name} onChange={e => updatePerformer(p.id, 'name', e.target.value)} style={{ width: 140, flex: '0 0 140px' }} />
              <select value={p.type} onChange={e => updatePerformer(p.id, 'type', e.target.value)} style={{ width: 130, flex: '0 0 130px' }}>
                {PERFORMER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input value={p.time_slot || ''} onChange={e => updatePerformer(p.id, 'time_slot', e.target.value)} placeholder="e.g. 8–10pm" style={{ width: 90, flex: '0 0 90px' }} />
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                {['yes', 'no', 'nr'].map(s => (
                  <button
                    key={s}
                    onClick={() => updatePerformer(p.id, 'status', s)}
                    style={{
                      padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      border: `0.5px solid ${p.status === s ? statusColors[s] : 'var(--border-mid)'}`,
                      background: p.status === s ? statusBg[s] : 'transparent',
                      color: p.status === s ? statusText[s] : 'var(--muted)',
                    }}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>$</span>
                <input type="number" value={p.fee || ''} onChange={e => updatePerformer(p.id, 'fee', e.target.value)} placeholder="Fee" style={{ width: 80 }} />
              </div>
              <button onClick={() => deletePerformer(p.id)} style={{ color: 'var(--muted)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>×</button>
            </div>
          ))}
        </div>
        <button className="btn" onClick={addPerformer} style={{ alignSelf: 'flex-start' }}>+ Add performer</button>
      </Section>

      {/* Venue & contacts */}
      <Section id="venue" title="Venue & client contacts">
        <div className="grid-2">
          <div className="field">
            <label>Venue name</label>
            <input value={booking.venue || ''} onChange={e => setField('venue', e.target.value)} />
          </div>
          <div className="field">
            <label>Venue address</label>
            <input value={booking.venue_address || ''} onChange={e => setField('venue_address', e.target.value)} />
          </div>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 4 }}>CLIENT CONTACT</div>
        <div className="grid-2">
          <div className="field">
            <label>Name</label>
            <input value={booking.client_contact_name || ''} onChange={e => setField('client_contact_name', e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={booking.client_email || ''} onChange={e => setField('client_email', e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={booking.client_phone || ''} onChange={e => setField('client_phone', e.target.value)} />
          </div>
          <div className="field">
            <label>About the client</label>
            <input value={booking.about_client || ''} onChange={e => setField('about_client', e.target.value)} />
          </div>
        </div>
        <hr className="divider" />
        <div className="field">
          <label>On the day contact (BBE)</label>
          <input value={booking.on_day_contact || ''} onChange={e => setField('on_day_contact', e.target.value)} />
        </div>
      </Section>

      {/* Event brief */}
      <Section id="brief" title="Event brief">
        <div className="grid-2">
          <div className="field">
            <label>Dress code</label>
            <input value={booking.dress_code || ''} onChange={e => setField('dress_code', e.target.value)} />
          </div>
          <div className="field">
            <label>Guest numbers</label>
            <input type="number" value={booking.pax || ''} onChange={e => setField('pax', e.target.value)} />
          </div>
          <div className="field">
            <label>Demographic of guests</label>
            <input value={booking.demographic || ''} onChange={e => setField('demographic', e.target.value)} />
          </div>
          <div className="field">
            <label>Guest arrival time</label>
            <input type="time" value={booking.guest_arrival_time || ''} onChange={e => setField('guest_arrival_time', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Event brief / vibe</label>
          <textarea value={booking.event_brief || ''} onChange={e => setField('event_brief', e.target.value)} />
        </div>
      </Section>

      {/* Run sheet */}
      <Section id="runsheet" title="Run sheet & performance times">
        <div className="grid-2">
          <div className="field">
            <label>Bump in time</label>
            <input type="time" value={booking.bump_in_time || ''} onChange={e => setField('bump_in_time', e.target.value)} />
          </div>
          <div className="field">
            <label>Sound check by</label>
            <input type="time" value={booking.soundcheck_time || ''} onChange={e => setField('soundcheck_time', e.target.value)} />
          </div>
        </div>
        <div style={{ border: '0.5px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 36px', gap: 0, background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '7px 12px' }}>
            {['Time', 'Item / performer', 'Duration', ''].map(h => (
              <div key={h} style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {runsheet.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No run sheet items yet.</div>
          )}
          {runsheet.map(r => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 36px', gap: 0, borderBottom: '0.5px solid var(--border)', padding: '4px 6px', alignItems: 'center' }}>
              <input value={r.time || ''} onChange={e => updateRunsheet(r.id, 'time', e.target.value)} placeholder="19:00" style={{ borderRadius: 4, padding: '5px 6px', fontSize: 12 }} />
              <input value={r.item || ''} onChange={e => updateRunsheet(r.id, 'item', e.target.value)} placeholder="Item or performer name" style={{ borderRadius: 4, padding: '5px 6px', fontSize: 12 }} />
              <input value={r.duration || ''} onChange={e => updateRunsheet(r.id, 'duration', e.target.value)} placeholder="60 min" style={{ borderRadius: 4, padding: '5px 6px', fontSize: 12 }} />
              <button onClick={() => deleteRunsheetRow(r.id)} style={{ color: 'var(--muted)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>
        <button className="btn" onClick={addRunsheetRow} style={{ alignSelf: 'flex-start' }}>+ Add row</button>
      </Section>

      {/* Song requests */}
      <Section id="songs" title="Song requests">
        <div className="field">
          <label>Written requests</label>
          <textarea value={booking.song_requests || ''} onChange={e => setField('song_requests', e.target.value)} placeholder="List song titles..." />
        </div>
        <div className="field">
          <label>Spotify playlist link</label>
          <input value={booking.spotify_link || ''} onChange={e => setField('spotify_link', e.target.value)} placeholder="https://open.spotify.com/playlist/..." />
        </div>
        <div className="field">
          <label>Do NOT play</label>
          <textarea value={booking.do_not_play || ''} onChange={e => setField('do_not_play', e.target.value)} style={{ minHeight: 52 }} />
        </div>
      </Section>

      {/* Green room & logistics */}
      <Section id="greenroom" title="Green room & logistics" badge={missingCount > 0 ? <span className="badge badge-warn">{missingCount} unresolved</span> : null}>
        <div className="grid-2">
          <div className="field">
            <label>Green room location</label>
            <input value={booking.greenroom_location || ''} onChange={e => setField('greenroom_location', e.target.value)} />
          </div>
          <div className="field">
            <label>Green room access from</label>
            <input type="time" value={booking.greenroom_access || ''} onChange={e => setField('greenroom_access', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Green room details / rider items</label>
          <textarea value={booking.greenroom_notes || ''} onChange={e => setField('greenroom_notes', e.target.value)} />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Crew meals (time & place)</label>
            <input value={booking.crew_meals || ''} onChange={e => setField('crew_meals', e.target.value)} />
          </div>
          <div className="field">
            <label>DJ table & power confirmed</label>
            <input value={booking.dj_table_power || ''} onChange={e => setField('dj_table_power', e.target.value)} placeholder="Location + GPO points" />
          </div>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>CHECKLIST — WHAT'S MISSING</div>
        {checklist.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
            <div
              onClick={() => toggleChecklistItem(item)}
              style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                border: `1.5px solid ${item.completed ? 'var(--green)' : 'var(--coral)'}`,
                background: item.completed ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10,
              }}
            >
              {item.completed ? '✓' : ''}
            </div>
            <input
              value={item.label}
              onChange={async e => {
                const v = e.target.value
                setChecklist(cs => cs.map(c => c.id === item.id ? { ...c, label: v } : c))
                await supabase.from('checklist_items').update({ label: v }).eq('id', item.id)
              }}
              style={{ flex: 1, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--muted)' : 'var(--text)', fontSize: 13 }}
            />
            <input
              value={item.owner || ''}
              placeholder="Owner"
              onChange={async e => {
                const v = e.target.value
                setChecklist(cs => cs.map(c => c.id === item.id ? { ...c, owner: v } : c))
                await supabase.from('checklist_items').update({ owner: v }).eq('id', item.id)
              }}
              style={{ width: 100, fontSize: 12 }}
            />
          </div>
        ))}
        <button className="btn" onClick={addChecklistItem} style={{ alignSelf: 'flex-start' }}>+ Add item</button>
      </Section>

      {/* Travel */}
      <Section id="travel" title="Travel details">
        <div className="field">
          <label>Travel & parking notes for performers</label>
          <textarea value={booking.travel_notes || ''} onChange={e => setField('travel_notes', e.target.value)} placeholder="Load-in access, parking, directions..." />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Accommodation (if applicable)</label>
            <input value={booking.accommodation || ''} onChange={e => setField('accommodation', e.target.value)} />
          </div>
          <div className="field">
            <label>Check-in time</label>
            <input type="time" value={booking.checkin_time || ''} onChange={e => setField('checkin_time', e.target.value)} />
          </div>
        </div>
      </Section>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, paddingBottom: 40 }}>
        <button className="btn" onClick={saveBooking} disabled={saving}>{saving ? 'Saving...' : 'Save all changes'}</button>
        <button className="btn btn-primary" onClick={generateCallSheet}>↓ Download call sheet</button>
      </div>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import EmailButton from '../components/EmailButton'
import { downloadCallSheet, buildCallSheetEmail } from '../lib/callsheet'

const STAGES = ['Enquiry','Logged','Calendar','Performers','Info complete','Call sheet sent','Done']
const PERFORMER_TYPES = ['Solo act','Duo','Band','DJ','Roving / circus','Interactive','Other']

const DEFAULT_CHECKLIST = [
  { key: 'chk_callsheet',  label: 'Call sheet sent',            group: 'Admin & Finance' },
  { key: 'chk_invoice',    label: 'Invoice sent',               group: 'Admin & Finance' },
  { key: 'chk_deposit',    label: 'Deposit received',           group: 'Admin & Finance' },
  { key: 'chk_pif',        label: 'PIF — paid in full',         group: 'Admin & Finance' },
  { key: 'chk_agreement',  label: 'Booking agreement signed',   group: 'Admin & Finance' },
  { key: 'chk_apra',       label: 'APRA sorted',                group: 'Admin & Finance' },
  { key: 'chk_velocity',   label: 'Velocity number noted',      group: 'Admin & Finance' },
  { key: 'chk_referral',   label: 'Referral source noted',      group: 'Admin & Finance' },
  { key: 'chk_music',      label: 'Music checklist done',       group: 'Event prep' },
  { key: 'chk_songreq',    label: 'Song requests received',     group: 'Event prep' },
  { key: 'chk_runsheet',   label: 'Run sheet finalised',        group: 'Event prep' },
  { key: 'chk_techspecs',  label: 'Tech specs confirmed',       group: 'Event prep' },
  { key: 'chk_meals',      label: 'Meals organised',            group: 'Event prep' },
  { key: 'chk_dietary',    label: 'Dietary requirements noted', group: 'Event prep' },
  { key: 'chk_accom',      label: 'Accommodation / flights booked', group: 'Event prep' },
  { key: 'chk_bbe_review', label: 'BBE review done',            group: 'Reviews' },
  { key: 'chk_mrs_review', label: 'MRS review done',            group: 'Reviews' },
]

// Section is defined OUTSIDE the component so it is never recreated on keystrokes
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

function statusStyle(s) {
  return {
    yes: { bg: 'var(--teal-bg)',       color: 'var(--teal-text)',       border: 'var(--teal)' },
    no:  { bg: 'var(--terracotta-bg)', color: 'var(--terracotta-text)', border: 'var(--terracotta)' },
    nr:  { bg: 'var(--gold-bg)',       color: 'var(--gold-text)',       border: 'var(--gold)' },
  }[s] || { bg: 'var(--bg2)', color: 'var(--muted)', border: 'var(--border-mid)' }
}

export default function EventRecord() {
  const { id } = useParams()
  const nav = useNavigate()
  const [booking, setBooking] = useState(null)
  const [performers, setPerformers] = useState([])
  const [runsheet, setRunsheet] = useState([])
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState({
    performers: true, venue: true, brief: true,
    runsheet: true, songs: false, greenroom: true,
    travel: false, checklist: true,
  })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const [b, p, r] = await Promise.all([
        supabase.from('bookings').select('*').eq('id', id).single(),
        supabase.from('performers').select('*').eq('booking_id', id).order('created_at'),
        supabase.from('runsheet_items').select('*').eq('booking_id', id).order('time'),
      ])
      if (b.data) setBooking(b.data)
      setPerformers(p.data || [])
      setRunsheet(r.data || [])
    }
    load()
  }, [id])

  // Update local state only while typing — saves to DB on blur, so no re-render mid-type
  const setField = useCallback((key) => (e) => {
    const val = e.target ? e.target.value : e
    setBooking(prev => ({ ...prev, [key]: val }))
  }, [])

  const saveField = useCallback((key) => async (e) => {
    const val = e.target ? e.target.value : e
    await supabase.from('bookings').update({ [key]: val }).eq('id', id)
  }, [id])

  const toggleCheck = useCallback(async (key) => {
    setBooking(prev => {
      const newVal = !prev[key]
      const updated = { ...prev, [key]: newVal }
      const missing = DEFAULT_CHECKLIST.filter(c => !updated[c.key]).length
      updated.missing_count = missing
      supabase.from('bookings').update({ [key]: newVal, missing_count: missing }).eq('id', id)
      return updated
    })
  }, [id])

  const saveBooking = async () => {
    setSaving(true)
    const missing = DEFAULT_CHECKLIST.filter(c => !booking[c.key]).length
    await supabase.from('bookings').update({ ...booking, missing_count: missing }).eq('id', id)
    setSaving(false)
  }

  const updatePerformer = async (pid, key, val) => {
    setPerformers(ps => ps.map(p => p.id === pid ? { ...p, [key]: val } : p))
    await supabase.from('performers').update({ [key]: val }).eq('id', pid)
  }

  const addPerformer = async () => {
    const { data } = await supabase.from('performers').insert([{
      booking_id: id, name: '', type: 'Solo act', status: 'nr', fee: 0, time_slot: '',
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

  const generateCallSheet = () => downloadCallSheet(booking, performers)

  if (!booking) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>

  const checkedCount = DEFAULT_CHECKLIST.filter(c => booking[c.key]).length
  const totalCount = DEFAULT_CHECKLIST.length
  const pct = Math.round((checkedCount / totalCount) * 100)

  const checklistGroups = DEFAULT_CHECKLIST.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button className="btn" onClick={() => nav('/bookings')} style={{ marginBottom: 10, fontSize: 12, padding: '5px 10px' }}>← All bookings</button>
          <h1 className="section-heading">{booking.client_name} — {booking.event_type}</h1>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted)' }}>
            <span>{booking.venue || 'No venue set'}</span><span>·</span>
            <span>{booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'No date set'}</span><span>·</span>
            <span>{booking.pax ? `${booking.pax} pax` : 'Pax TBC'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={saveBooking} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          <button className="btn" onClick={generateCallSheet}>↓ Call sheet</button>
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

      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
          {STAGES.map((s, i) => {
            const stage = booking.stage || 1
            const done = i + 1 < stage, active = i + 1 === stage
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                  <div onClick={() => { setBooking(b => ({ ...b, stage: i + 1 })); supabase.from('bookings').update({ stage: i + 1 }).eq('id', id) }}
                    style={{ width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: done ? 'var(--teal)' : active ? 'var(--terracotta)' : 'var(--bg2)', border: `2px solid ${done ? 'var(--teal)' : active ? 'var(--terracotta)' : 'var(--border-mid)'}`, color: done || active ? '#fff' : 'var(--muted)', boxShadow: active ? '0 0 0 4px rgba(201,90,53,0.15)' : 'none' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 10, color: active ? 'var(--terracotta)' : done ? 'var(--teal)' : 'var(--muted)', fontWeight: active || done ? 600 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</div>
                </div>
                {i < STAGES.length - 1 && <div style={{ height: 2, width: 24, background: done ? 'var(--teal)' : 'var(--border)', flexShrink: 0, marginBottom: 18, borderRadius: 1 }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Booking completion</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: pct === 100 ? 'var(--teal)' : pct > 60 ? 'var(--gold)' : 'var(--terracotta)' }}>{checkedCount}/{totalCount} — {pct}%</div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 0.4s', background: pct === 100 ? 'var(--teal)' : pct > 60 ? 'var(--gold)' : 'var(--terracotta)' }} />
        </div>
      </div>

      <Section open={open} setOpen={setOpen} sid="performers" title="Act booked & performers"
        badge={performers.filter(p => p.status === 'nr').length > 0 ? <span className="badge badge-warn">{performers.filter(p => p.status === 'nr').length} pending</span> : null}>
        <div className="grid-2">
          <div className="field"><label>Act booked (summary)</label><input value={booking.act_booked || ''} onChange={setField('act_booked')} onBlur={saveField('act_booked')} placeholder="e.g. Band + DJ + Circus" /></div>
          <div className="field"><label>Booked by</label><input value={booking.booked_by || ''} onChange={setField('booked_by')} onBlur={saveField('booked_by')} placeholder="Renee" /></div>
          <div className="field"><label>Platform booked via</label>
            <select value={booking.booking_platform || 'Direct / email'} onChange={e => { setField('booking_platform')(e); saveField('booking_platform')(e) }}>
              {['Direct / email', 'Referral', 'Airtasker', 'GigSalad', 'Other'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="field"><label>Date locked in</label><input type="date" defaultValue={booking.locked_date || ''} onBlur={saveField('locked_date')} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label>Need to bring</label><textarea value={booking.need_to_bring || ''} onChange={setField('need_to_bring')} onBlur={saveField('need_to_bring')} placeholder="e.g. PA, mic stand, cables..." style={{ minHeight: 72 }} /></div>
          <div className="field"><label>Need to learn</label><textarea value={booking.need_to_learn || ''} onChange={setField('need_to_learn')} onBlur={saveField('need_to_learn')} placeholder="e.g. First dance song..." style={{ minHeight: 72 }} /></div>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Performers locked in</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {performers.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No performers yet.</div>}
          {performers.map((p, i) => {
            const ss = statusStyle(p.status)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < performers.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', background: 'var(--bg)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--terracotta-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--terracotta-text)', flexShrink: 0 }}>
                  {(p.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <input defaultValue={p.name || ''} onBlur={e => updatePerformer(p.id, 'name', e.target.value)} placeholder="Performer name" style={{ width: 130, flex: '0 0 130px', fontSize: 13 }} />
                <input defaultValue={p.email || ''} onBlur={e => updatePerformer(p.id, 'email', e.target.value)} placeholder="email@..." style={{ width: 130, flex: '0 0 130px', fontSize: 13 }} />
                <select value={p.type || 'Solo act'} onChange={e => updatePerformer(p.id, 'type', e.target.value)} style={{ width: 120, flex: '0 0 120px', fontSize: 13 }}>
                  {PERFORMER_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input defaultValue={p.time_slot || ''} onBlur={e => updatePerformer(p.id, 'time_slot', e.target.value)} placeholder="8–10pm" style={{ width: 80, flex: '0 0 80px', fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {['yes', 'no', 'nr'].map(s => (
                    <button key={s} onClick={() => updatePerformer(p.id, 'status', s)}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${p.status === s ? ss.border : 'var(--border-mid)'}`, background: p.status === s ? ss.bg : 'transparent', color: p.status === s ? ss.color : 'var(--muted)' }}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>$</span>
                  <input type="number" defaultValue={p.fee || ''} onBlur={e => updatePerformer(p.id, 'fee', e.target.value)} placeholder="Fee" style={{ width: 70, fontSize: 13 }} />
                </div>
                <button onClick={() => downloadCallSheet(booking, performers, p)} title="Download this performer's call sheet" style={{ color: 'var(--terracotta)', fontSize: 12, background: 'none', border: '1px solid var(--terracotta)', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto', padding: '3px 8px', fontWeight: 500 }}>↓ Call sheet</button>
                <button onClick={() => deletePerformer(p.id)} style={{ color: 'var(--muted)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
            )
          })}
        </div>
        <button className="btn" onClick={addPerformer} style={{ alignSelf: 'flex-start' }}>+ Add performer</button>
      </Section>

      <Section open={open} setOpen={setOpen} sid="venue" title="Venue & client contacts">
        <div className="grid-2">
          <div className="field"><label>Venue</label><input value={booking.venue || ''} onChange={setField('venue')} onBlur={saveField('venue')} /></div>
          <div className="field"><label>Venue address</label><input value={booking.venue_address || ''} onChange={setField('venue_address')} onBlur={saveField('venue_address')} /></div>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client contact info</div>
        <div className="grid-2">
          <div className="field"><label>Name</label><input value={booking.client_contact_name || ''} onChange={setField('client_contact_name')} onBlur={saveField('client_contact_name')} /></div>
          <div className="field"><label>Email</label><input type="email" value={booking.client_email || ''} onChange={setField('client_email')} onBlur={saveField('client_email')} /></div>
          <div className="field"><label>Phone</label><input value={booking.client_phone || ''} onChange={setField('client_phone')} onBlur={saveField('client_phone')} /></div>
          <div className="field"><label>About the client</label><input value={booking.about_client || ''} onChange={setField('about_client')} onBlur={saveField('about_client')} /></div>
        </div>
        <hr className="divider" />
        <div className="field"><label>On the day contact (BBE)</label><input value={booking.on_day_contact || ''} onChange={setField('on_day_contact')} onBlur={saveField('on_day_contact')} /></div>
      </Section>

      <Section open={open} setOpen={setOpen} sid="brief" title="Event brief">
        <div className="grid-2">
          <div className="field"><label>Dress code</label><input value={booking.dress_code || ''} onChange={setField('dress_code')} onBlur={saveField('dress_code')} /></div>
          <div className="field"><label>Guest numbers</label><input type="number" value={booking.pax || ''} onChange={setField('pax')} onBlur={saveField('pax')} /></div>
          <div className="field"><label>Demographic of guests</label><input value={booking.demographic || ''} onChange={setField('demographic')} onBlur={saveField('demographic')} /></div>
          <div className="field"><label>Guest arrival time</label><input type="time" value={booking.guest_arrival_time || ''} onChange={setField('guest_arrival_time')} onBlur={saveField('guest_arrival_time')} /></div>
        </div>
        <div className="field"><label>Event brief / vibe</label><textarea value={booking.event_brief || ''} onChange={setField('event_brief')} onBlur={saveField('event_brief')} /></div>
      </Section>

      <Section open={open} setOpen={setOpen} sid="runsheet" title="Run sheet & performance times">
        <div className="grid-2">
          <div className="field"><label>Bump in time</label><input type="time" value={booking.bump_in_time || ''} onChange={setField('bump_in_time')} onBlur={saveField('bump_in_time')} /></div>
          <div className="field"><label>Sound check by</label><input type="time" value={booking.soundcheck_time || ''} onChange={setField('soundcheck_time')} onBlur={saveField('soundcheck_time')} /></div>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 36px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '8px 14px' }}>
            {['Time', 'Item / performer', 'Duration', ''].map(h => <div key={h} style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>)}
          </div>
          {runsheet.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No items yet.</div>}
          {runsheet.map(r => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 36px', borderBottom: '1px solid var(--border)', padding: '4px 8px', alignItems: 'center', gap: 4 }}>
              <input defaultValue={r.time || ''} onBlur={e => updateRunsheet(r.id, 'time', e.target.value)} placeholder="19:00" style={{ fontSize: 13, borderRadius: 6, padding: '6px 8px' }} />
              <input defaultValue={r.item || ''} onBlur={e => updateRunsheet(r.id, 'item', e.target.value)} placeholder="Item or performer" style={{ fontSize: 13, borderRadius: 6, padding: '6px 8px' }} />
              <input defaultValue={r.duration || ''} onBlur={e => updateRunsheet(r.id, 'duration', e.target.value)} placeholder="60 min" style={{ fontSize: 13, borderRadius: 6, padding: '6px 8px' }} />
              <button onClick={() => deleteRunsheetRow(r.id)} style={{ color: 'var(--muted)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
          ))}
        </div>
        <button className="btn" onClick={addRunsheetRow} style={{ alignSelf: 'flex-start' }}>+ Add row</button>
      </Section>

      <Section open={open} setOpen={setOpen} sid="songs" title="Song requests">
        <div className="field"><label>Written requests</label><textarea value={booking.song_requests || ''} onChange={setField('song_requests')} onBlur={saveField('song_requests')} placeholder="List song titles..." /></div>
        <div className="field"><label>Spotify playlist link</label><input value={booking.spotify_link || ''} onChange={setField('spotify_link')} onBlur={saveField('spotify_link')} placeholder="https://open.spotify.com/playlist/..." /></div>
        <div className="field"><label>Do NOT play</label><textarea value={booking.do_not_play || ''} onChange={setField('do_not_play')} onBlur={saveField('do_not_play')} style={{ minHeight: 60 }} /></div>
      </Section>

      <Section open={open} setOpen={setOpen} sid="greenroom" title="Green room & logistics">
        <div className="grid-2">
          <div className="field"><label>Green room location</label><input value={booking.greenroom_location || ''} onChange={setField('greenroom_location')} onBlur={saveField('greenroom_location')} /></div>
          <div className="field"><label>Access from</label><input type="time" value={booking.greenroom_access || ''} onChange={setField('greenroom_access')} onBlur={saveField('greenroom_access')} /></div>
          <div className="field"><label>Crew meals (time & place)</label><input value={booking.crew_meals || ''} onChange={setField('crew_meals')} onBlur={saveField('crew_meals')} placeholder="7pm · Staff dining room" /></div>
          <div className="field"><label>Table for DJ & power confirmed</label><input value={booking.dj_table_power || ''} onChange={setField('dj_table_power')} onBlur={saveField('dj_table_power')} placeholder="Stage right · 2× GPO" /></div>
        </div>
        <div className="field"><label>Green room details / rider items</label><textarea value={booking.greenroom_notes || ''} onChange={setField('greenroom_notes')} onBlur={saveField('greenroom_notes')} /></div>
      </Section>

      <Section open={open} setOpen={setOpen} sid="travel" title="Travel details">
        <div className="field"><label>Travel & parking for performers</label><textarea value={booking.travel_notes || ''} onChange={setField('travel_notes')} onBlur={saveField('travel_notes')} placeholder="Load-in access, parking, directions..." /></div>
        <div className="grid-2">
          <div className="field"><label>Accommodation</label><input value={booking.accommodation || ''} onChange={setField('accommodation')} onBlur={saveField('accommodation')} /></div>
          <div className="field"><label>Check-in time</label><input type="time" value={booking.checkin_time || ''} onChange={setField('checkin_time')} onBlur={saveField('checkin_time')} /></div>
        </div>
      </Section>

      <Section open={open} setOpen={setOpen} sid="checklist" title="Booking checklist"
        badge={<span style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? 'var(--teal-text)' : 'var(--gold-text)', background: pct === 100 ? 'var(--teal-bg)' : 'var(--gold-bg)', padding: '2px 10px', borderRadius: 99 }}>{checkedCount}/{totalCount}</span>}>
        {Object.entries(checklistGroups).map(([group, items]) => (
          <div key={group}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{group}</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
              {items.map((item, i) => {
                const checked = !!booking[item.key]
                return (
                  <div key={item.key} onClick={() => toggleCheck(item.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: checked ? 'var(--teal-bg)' : 'var(--bg)', transition: 'background 0.15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${checked ? 'var(--teal)' : 'var(--border-mid)'}`, background: checked ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
                      {checked ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: 13, color: checked ? 'var(--teal-text)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none', fontWeight: checked ? 400 : 500 }}>{item.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: checked ? 'var(--teal-text)' : 'var(--terracotta)', fontWeight: 500 }}>{checked ? '✓ Done' : 'Pending'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </Section>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 60 }}>
        <button className="btn" onClick={saveBooking} disabled={saving}>{saving ? 'Saving...' : 'Save all changes'}</button>
        <button className="btn btn-primary" onClick={generateCallSheet}>↓ Download call sheet</button>
      </div>
    </div>
  )
}
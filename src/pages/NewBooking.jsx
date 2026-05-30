import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EVENT_TYPES = ['Gala dinner','Incentive trip','Conference','Wedding','Festival','Birthday party','In-house entertainment','Other']

// Section defined OUTSIDE the component so it isn't recreated on every keystroke
function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 16, overflow: 'visible' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', borderRadius: '14px 14px 0 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

export default function NewBooking() {
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_name: '', event_type: 'Gala dinner', venue: '', event_date: '', pax: '',
    status: 'planning', client_contact_name: '', client_email: '', client_phone: '',
    about_client: '', on_day_contact: 'Renee · 0403 769 229',
    dress_code: '', demographic: '', guest_arrival_time: '', event_brief: '',
    bump_in_time: '', song_requests: '', spotify_link: '', do_not_play: '',
    greenroom_location: '', greenroom_notes: '', crew_meals: '', dj_table_power: '', travel_notes: '',
  })

  const set = useCallback((key) => (e) => {
    const val = e.target ? e.target.value : e
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  const handleSave = async () => {
    if (!form.client_name.trim()) return alert('Client name is required.')
    setSaving(true)
    const { data, error } = await supabase.from('bookings').insert([{
      ...form, pax: form.pax ? parseInt(form.pax) : null,
      missing_count: 16, stage: 1,
    }]).select().single()
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    nav(`/bookings/${data.id}`)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn" onClick={() => nav('/bookings')}>← Back</button>
          <h1 className="section-heading">New booking</h1>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Create booking →'}
        </button>
      </div>

      <Section title="Event details">
        <div className="grid-2">
          <div className="field">
            <label>Client / company name *</label>
            <input value={form.client_name} onChange={set('client_name')} placeholder="e.g. Salesforce Australia" />
          </div>
          <div className="field">
            <label>Event type</label>
            <select value={form.event_type} onChange={set('event_type')}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Venue</label>
            <input value={form.venue} onChange={set('venue')} placeholder="e.g. Elements of Byron Resort" />
          </div>
          <div className="field">
            <label>Event date</label>
            <input
              type="date"
              defaultValue={form.event_date}
              onChange={set('event_date')}
              min="2024-01-01"
              max="2030-12-31"
            />
          </div>
          <div className="field">
            <label>Guest numbers (pax)</label>
            <input type="number" value={form.pax} onChange={set('pax')} placeholder="200" />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              <option value="planning">Planning</option>
              <option value="in_progress">In progress</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Client contact">
        <div className="grid-2">
          <div className="field"><label>Contact name</label><input value={form.client_contact_name} onChange={set('client_contact_name')} /></div>
          <div className="field"><label>Email</label><input type="email" value={form.client_email} onChange={set('client_email')} /></div>
          <div className="field"><label>Phone</label><input type="tel" value={form.client_phone} onChange={set('client_phone')} /></div>
          <div className="field"><label>About the client</label><input value={form.about_client} onChange={set('about_client')} placeholder="Notes on preferences..." /></div>
        </div>
        <div className="field"><label>On the day contact (BBE)</label><input value={form.on_day_contact} onChange={set('on_day_contact')} /></div>
      </Section>

      <Section title="Event brief">
        <div className="grid-2">
          <div className="field"><label>Dress code</label><input value={form.dress_code} onChange={set('dress_code')} placeholder="e.g. Smart casual" /></div>
          <div className="field"><label>Demographic of guests</label><input value={form.demographic} onChange={set('demographic')} placeholder="e.g. Corporate, 30–50s" /></div>
          <div className="field"><label>Guest arrival time</label><input type="time" value={form.guest_arrival_time} onChange={set('guest_arrival_time')} /></div>
          <div className="field"><label>Bump in time</label><input type="time" value={form.bump_in_time} onChange={set('bump_in_time')} /></div>
        </div>
        <div className="field"><label>Event brief / vibe</label><textarea value={form.event_brief} onChange={set('event_brief')} placeholder="Describe the atmosphere and any specific requests..." /></div>
      </Section>

      <Section title="Song requests">
        <div className="field"><label>Written requests</label><textarea value={form.song_requests} onChange={set('song_requests')} placeholder="List song titles here..." /></div>
        <div className="field"><label>Spotify playlist link</label><input value={form.spotify_link} onChange={set('spotify_link')} placeholder="https://open.spotify.com/playlist/..." /></div>
        <div className="field"><label>Do NOT play</label><textarea value={form.do_not_play} onChange={set('do_not_play')} placeholder="Songs or genres to avoid..." /></div>
      </Section>

      <Section title="Green room & logistics">
        <div className="grid-2">
          <div className="field"><label>Green room location</label><input value={form.greenroom_location} onChange={set('greenroom_location')} /></div>
          <div className="field"><label>Crew meals (time & place)</label><input value={form.crew_meals} onChange={set('crew_meals')} placeholder="7pm · Staff dining room" /></div>
          <div className="field"><label>Table for DJ & power</label><input value={form.dj_table_power} onChange={set('dj_table_power')} placeholder="Stage right · 2× GPO" /></div>
        </div>
        <div className="field"><label>Green room details / rider notes</label><textarea value={form.greenroom_notes} onChange={set('greenroom_notes')} /></div>
        <div className="field"><label>Travel & parking for performers</label><textarea value={form.travel_notes} onChange={set('travel_notes')} placeholder="Load-in access, parking, directions..." /></div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 40 }}>
        <button className="btn" onClick={() => nav('/bookings')}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Create booking →'}
        </button>
      </div>
    </div>
  )
}
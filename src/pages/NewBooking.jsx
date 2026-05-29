import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EVENT_TYPES = ['Gala dinner', 'Incentive trip', 'Conference', 'Wedding', 'Festival', 'Birthday party', 'In-house entertainment', 'Other']

export default function NewBooking() {
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_name: '',
    event_type: 'Gala dinner',
    venue: '',
    event_date: '',
    pax: '',
    status: 'planning',
    // Client contact
    client_contact_name: '',
    client_email: '',
    client_phone: '',
    about_client: '',
    // Event brief
    dress_code: '',
    demographic: '',
    guest_arrival_time: '',
    event_brief: '',
    // Logistics
    bump_in_time: '',
    on_day_contact: 'Renee · 0403 769 229',
    // Song requests
    song_requests: '',
    spotify_link: '',
    do_not_play: '',
    // Green room
    greenroom_location: '',
    greenroom_notes: '',
    crew_meals: '',
    dj_table_power: '',
    travel_notes: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    if (!form.client_name) return alert('Client name is required.')
    setSaving(true)
    const { data, error } = await supabase.from('bookings').insert([{
      ...form,
      pax: form.pax ? parseInt(form.pax) : null,
      missing_count: 0,
      stage: 1,
    }]).select().single()
    setSaving(false)
    if (error) { alert('Error saving: ' + error.message); return }
    nav(`/bookings/${data.id}`)
  }

  const Section = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ padding: '11px 18px', borderBottom: '0.5px solid var(--border)', fontSize: 13, fontWeight: 500, background: 'var(--bg2)' }}>
        {title}
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn" onClick={() => nav('/bookings')} style={{ padding: '6px 10px' }}>← Back</button>
        <h1 className="section-heading" style={{ margin: 0 }}>New booking</h1>
      </div>

      <Section title="Event details">
        <div className="grid-2">
          <div className="field">
            <label>Client / company name *</label>
            <input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Salesforce Australia" />
          </div>
          <div className="field">
            <label>Event type</label>
            <select value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Venue</label>
            <input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. Elements of Byron Resort" />
          </div>
          <div className="field">
            <label>Event date</label>
            <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
          <div className="field">
            <label>Guest numbers (pax)</label>
            <input type="number" value={form.pax} onChange={e => set('pax', e.target.value)} placeholder="200" />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="planning">Planning</option>
              <option value="in_progress">In progress</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Client contact">
        <div className="grid-2">
          <div className="field">
            <label>Contact name</label>
            <input value={form.client_contact_name} onChange={e => set('client_contact_name', e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="tel" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
          </div>
          <div className="field">
            <label>About the client</label>
            <input value={form.about_client} onChange={e => set('about_client', e.target.value)} placeholder="Notes on personality, preferences..." />
          </div>
        </div>
        <div className="field">
          <label>On the day contact (BBE)</label>
          <input value={form.on_day_contact} onChange={e => set('on_day_contact', e.target.value)} />
        </div>
      </Section>

      <Section title="Event brief">
        <div className="grid-2">
          <div className="field">
            <label>Dress code</label>
            <input value={form.dress_code} onChange={e => set('dress_code', e.target.value)} placeholder="e.g. Smart casual" />
          </div>
          <div className="field">
            <label>Demographic of guests</label>
            <input value={form.demographic} onChange={e => set('demographic', e.target.value)} placeholder="e.g. Corporate, 30–50s" />
          </div>
          <div className="field">
            <label>Guest arrival time</label>
            <input type="time" value={form.guest_arrival_time} onChange={e => set('guest_arrival_time', e.target.value)} />
          </div>
          <div className="field">
            <label>Bump in time</label>
            <input type="time" value={form.bump_in_time} onChange={e => set('bump_in_time', e.target.value)} />
          </div>
        </div>
        <div className="field full">
          <label>Event brief / vibe</label>
          <textarea value={form.event_brief} onChange={e => set('event_brief', e.target.value)} placeholder="Describe the atmosphere, goals, and any specific requests..." />
        </div>
      </Section>

      <Section title="Song requests">
        <div className="field">
          <label>Written requests</label>
          <textarea value={form.song_requests} onChange={e => set('song_requests', e.target.value)} placeholder="List song titles here..." />
        </div>
        <div className="field">
          <label>Spotify playlist link</label>
          <input value={form.spotify_link} onChange={e => set('spotify_link', e.target.value)} placeholder="https://open.spotify.com/playlist/..." />
        </div>
        <div className="field">
          <label>Do NOT play</label>
          <textarea value={form.do_not_play} onChange={e => set('do_not_play', e.target.value)} placeholder="Songs or genres to avoid..." style={{ minHeight: 52 }} />
        </div>
      </Section>

      <Section title="Green room & logistics">
        <div className="grid-2">
          <div className="field">
            <label>Green room location</label>
            <input value={form.greenroom_location} onChange={e => set('greenroom_location', e.target.value)} />
          </div>
          <div className="field">
            <label>Crew meals</label>
            <input value={form.crew_meals} onChange={e => set('crew_meals', e.target.value)} placeholder="Time and location" />
          </div>
          <div className="field">
            <label>DJ table & power</label>
            <input value={form.dj_table_power} onChange={e => set('dj_table_power', e.target.value)} placeholder="Location + GPO points confirmed" />
          </div>
        </div>
        <div className="field">
          <label>Green room details / rider notes</label>
          <textarea value={form.greenroom_notes} onChange={e => set('greenroom_notes', e.target.value)} />
        </div>
        <div className="field">
          <label>Travel & parking details</label>
          <textarea value={form.travel_notes} onChange={e => set('travel_notes', e.target.value)} placeholder="Load-in access, parking, directions for performers..." />
        </div>
      </Section>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <button className="btn" onClick={() => nav('/bookings')}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Create booking →'}
        </button>
      </div>
    </div>
  )
}

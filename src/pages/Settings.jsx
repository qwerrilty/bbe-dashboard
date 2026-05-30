import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 'global').single()
      .then(({ data }) => setSettings(data || {}))
  }, [])

  const set = useCallback((key) => (e) => {
    const val = e.target ? e.target.value : e
    setSettings(prev => ({ ...prev, [key]: val }))
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('settings')
      .update({
        payment_terms: settings.payment_terms,
        further_bookings: settings.further_bookings,
        social_media: settings.social_media,
        whs_terms: settings.whs_terms,
        safety_link: settings.safety_link,
        default_on_day_contact: settings.default_on_day_contact,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'global')
    setSaving(false)
    if (error) { alert('Error saving: ' + error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!settings) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="section-heading">Settings</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            These terms appear on every call sheet. Edit once — applies everywhere.
          </div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      <Section title="Organisation defaults">
        <div className="field">
          <label>Default "on the day" contact</label>
          <input value={settings.default_on_day_contact || ''} onChange={set('default_on_day_contact')} placeholder="Renee · 0403 769 229" />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Pre-fills the on-the-day contact field on new bookings.</div>
        </div>
      </Section>

      <Section title="Payment details">
        <div className="field">
          <label>Payment terms (shown on call sheet)</label>
          <textarea value={settings.payment_terms || ''} onChange={set('payment_terms')} style={{ minHeight: 120 }} />
        </div>
      </Section>

      <Section title="Further bookings policy">
        <div className="field">
          <label>Further bookings text</label>
          <textarea value={settings.further_bookings || ''} onChange={set('further_bookings')} style={{ minHeight: 90 }} />
        </div>
      </Section>

      <Section title="Social media policy">
        <div className="field">
          <label>Social media text</label>
          <textarea value={settings.social_media || ''} onChange={set('social_media')} style={{ minHeight: 100 }} />
        </div>
      </Section>

      <Section title="Workplace health & safety">
        <div className="field">
          <label>WHS terms</label>
          <textarea value={settings.whs_terms || ''} onChange={set('whs_terms')} style={{ minHeight: 200 }} />
        </div>
        <div className="field">
          <label>National safety guidelines link</label>
          <input value={settings.safety_link || ''} onChange={set('safety_link')} />
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 40 }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
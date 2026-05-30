import { FEATURES } from './config'
import { supabase } from './supabase'

// ============================================
// Email service — DISABLED via FEATURES.EMAIL_ENABLED
// When ready: build a Supabase Edge Function "send-email"
// and set EMAIL_ENABLED = true in lib/config.js
// ============================================

export async function sendEmail({ to, subject, body, bookingId, type = 'custom' }) {
  if (!FEATURES.EMAIL_ENABLED) {
    console.info('[email disabled] Would send:', { to, subject, type })
    try {
      await supabase.from('email_log').insert([{
        to_address: Array.isArray(to) ? to.join(', ') : to,
        subject, body, booking_id: bookingId || null,
        type, status: 'queued_disabled',
      }])
    } catch (e) { /* table may not exist yet */ }
    return { ok: false, disabled: true }
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, body, bookingId, type },
    })
    if (error) throw error
    await supabase.from('email_log').insert([{
      to_address: Array.isArray(to) ? to.join(', ') : to,
      subject, body, booking_id: bookingId || null,
      type, status: 'sent',
    }])
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
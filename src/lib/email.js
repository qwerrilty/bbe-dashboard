import { FEATURES } from './config'
import { supabase } from './supabase'

export async function sendEmail({ to, subject, body, bookingId, type = 'custom' }) {
  if (!FEATURES.EMAIL_ENABLED) {
    console.info('[email disabled] Would send:', { to, subject, type })
    try {
      await supabase.from('email_log').insert([{
        to_address: Array.isArray(to) ? to.join(', ') : to,
        subject, body, booking_id: bookingId || null,
        type, status: 'queued_disabled',
      }])
    } catch (e) { /* table may not exist yet — ignore */ }
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

export function buildCallSheetEmail(booking, performers = []) {
  const subject = `Call Sheet — ${booking.client_name} — ${booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}`
  const body = [
    `Hi team,`, ``,
    `Here are the details for ${booking.client_name} — ${booking.event_type}.`, ``,
    `VENUE: ${booking.venue || 'TBC'}`,
    `DATE: ${booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC'}`,
    `BUMP IN: ${booking.bump_in_time || 'TBC'}`,
    `GUESTS ARRIVE: ${booking.guest_arrival_time || 'TBC'}`,
    `DRESS CODE: ${booking.dress_code || 'TBC'}`, ``,
    `ON THE DAY CONTACT: ${booking.on_day_contact || 'Renee · 0403 769 229'}`, ``,
    `Please confirm your availability by accepting this email.`, ``,
    `Thanks,`, `Byron Bay Experience`,
  ].join('\n')
  return { subject, body }
}
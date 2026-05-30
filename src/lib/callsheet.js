import { supabase } from './supabase'

// ============================================
// Call sheet builder — Byron Bay Experience
// Standard terms now come from the `settings` table
// (editable via the Settings page). Falls back to
// built-in defaults if settings haven't loaded.
// ============================================

const FALLBACK = {
  payment_terms: `You need to have invoices in by 5pm Tuesdays to be included in the pay run on Wednesday morning, otherwise it will be included in the following week.
Invoice Byron Bay Experience by emailing to info@byronbayexperience.com.au.
Your invoice must say TAX INVOICE with your bank account details, ABN and performance date and whether you are registered for GST.`,
  further_bookings: `To remain on the books, please do not give out your card and do not take any bookings direct from this client or venue. All enquiries as a result of this gig must be directed back via Byron Bay Experience.`,
  social_media: `Please mention @byronbayexperience in any social media posts about this gig. Please never mention corporate companies or show any client logos in your posts as they request our confidentiality.
Please follow us on Instagram @byronbayexperience so we can follow you back and tag the correct account when posting about you.`,
  whs_terms: `I agree to take responsibility to adhere to safety in the workplace.
I agree to conduct a risk assessment upon arrival to performance site and to take the necessary measures to ensure the safety of performers and audiences.
I confirm I hold a certificate of currency for Public Liability pertaining to all aspects of myself or group performance for $20,000,000.`,
  safety_link: `http://liveperformance.com.au/sites/liveperformance.com.au/files/resources/safety_guidelines_for_entertainment_industry_5_0.pdf`,
}

// Cache settings so we don't re-fetch on every call sheet
let _settingsCache = null
export async function loadSettings() {
  if (_settingsCache) return _settingsCache
  const { data } = await supabase.from('settings').select('*').eq('id', 'global').single()
  _settingsCache = data || FALLBACK
  return _settingsCache
}
export function clearSettingsCache() { _settingsCache = null }

function fmtDate(d) {
  if (!d) return 'TBC'
  return new Date(d).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function buildStandardTerms(s) {
  return [
    `PAYMENT DETAILS`, s.payment_terms || FALLBACK.payment_terms, ``,
    `FURTHER BOOKINGS`, s.further_bookings || FALLBACK.further_bookings, ``,
    `SOCIAL MEDIA`, s.social_media || FALLBACK.social_media, ``,
    `WORKPLACE HEALTH & SAFETY`, s.whs_terms || FALLBACK.whs_terms, ``,
    `PLEASE FAMILIARISE YOURSELF WITH THE NATIONAL SAFETY GUIDELINES:`,
    s.safety_link || FALLBACK.safety_link,
  ].join('\n')
}

/**
 * Build the full call sheet text.
 * @param settings - the row from the settings table (or null to use fallback)
 */
export function buildCallSheet(booking, performers = [], performer = null, settings = null) {
  const s = settings || FALLBACK
  const perfList = performer ? [performer] : performers

  const performanceLines = perfList.length
    ? perfList.map(p => `${p.name || '—'}${p.time_slot ? ` · ${p.time_slot}` : ''}${p.type ? ` (${p.type})` : ''}`).join('\n')
    : '—'

  const feeLine = performer
    ? `$${performer.fee || '—'}`
    : (perfList.length ? perfList.map(p => `${p.name}: $${p.fee || '—'}`).join('\n') : '—')

  return [
    `CALL SHEET — Byron Bay Experience`,
    `${'═'.repeat(50)}`, ``,
    `NEED TO BRING`, booking.need_to_bring || '—', ``,
    `NEED TO LEARN`, booking.need_to_learn || '—', ``,
    `EVENT DATE`, fmtDate(booking.event_date), ``,
    `EVENT BRIEF`, booking.event_brief || '—', ``,
    `VENUE`, booking.venue || '—', booking.venue_address || '', ``,
    `DEMOGRAPHIC OF GUESTS`, booking.demographic || '—', ``,
    `ON THE DAY CONTACT`, booking.on_day_contact || s.default_on_day_contact || 'Renee · 0403 769 229', ``,
    `NO. OF ENTERTAINERS`, String(perfList.length || '—'), ``,
    `BUMP IN DETAILS`, booking.bump_in_time || '—', ``,
    `GUEST ARRIVAL TIME`, booking.guest_arrival_time || '—', ``,
    `PERFORMANCE TIME & LOCATIONS`, performanceLines, ``,
    `APPROVED MEALS & BEVERAGES AND WHERE`, booking.crew_meals || '—', ``,
    `COSTUME REQUIREMENTS`, booking.dress_code || '—', ``,
    `GREEN ROOM DETAILS`, booking.greenroom_location || '—', booking.greenroom_notes || '', ``,
    `FEE`, feeLine, ``,
    `${'═'.repeat(50)}`, ``,
    buildStandardTerms(s),
  ].join('\n')
}

export async function downloadCallSheet(booking, performers = [], performer = null) {
  const settings = await loadSettings()
  const text = buildCallSheet(booking, performers, performer, settings)
  const who = performer ? performer.name : booking.client_name
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `callsheet-${(who || 'event').replace(/\s+/g, '-').toLowerCase()}.txt`
  a.click()
}

export async function buildCallSheetEmail(booking, performers = [], performer = null) {
  const settings = await loadSettings()
  const name = performer ? performer.name : 'team'
  const subject = `Call Sheet — ${booking.client_name} — ${booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}`
  const body = `Hi ${name},\n\nPlease find your call sheet below for ${booking.client_name} — ${booking.event_type}.\n\n` +
    buildCallSheet(booking, performers, performer, settings) +
    `\n\nPlease confirm your availability by replying to this email.\n\nThanks,\nByron Bay Experience`
  return { subject, body }
}
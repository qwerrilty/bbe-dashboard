import { supabase } from './supabase'

// ============================================
// Call sheet builder — Byron Bay Experience
// Matches the exact BBE format. Fields can be
// per-performer (tailored) or fall back to the
// booking-level value when the performer's is blank.
// Standard terms come from the `settings` table.
// ============================================

const FALLBACK = {
  payment_terms: `You need to have invoices in by 5pm Tuesdays to be included in the pay run on Wednesday morning, otherwise it will be included in the following week.
Invoice Byron Bay Experience by emailing to info@byronbayexperience.com.au.
Your invoice must say TAX INVOICE with your bank account details, ABN and performance date and whether you are registered for GST.`,
  further_bookings: `To remain on the books, please do not give out your card and do not take any bookings direct from this client or venue. All enquiries as a result of this gig must be directed back via Byron Bay Experience.`,
  social_media: `Please mention @byronbayexperience in any social media posts about this gig. Please never mention corporate companys or show any client logos in your posts as they request our confidentiality.
Please follow us on Instagram @byronbayexperience so we can follow you back and tag the correct account when posting about you.`,
  whs_terms: `I agree to take responsibility to adhere to safety in the workplace.
I agree to conduct a risk assessment upon arrival to performance site and to take the necessary measures to ensure the safety of performers and audiences.
I confirm I hold a certificate of currency for Public Liability pertaining to all aspects of myself or group performance for $20,000,000
Risk Assessments - Please be advised that you are to do a risk assessment of your work space and minimise hazards.
For musicians please ensure that all leads are duct taped to the floor, all liquids are away from electrical equipment, walkways are clear and if you are performing on a raised platform please enter and exit the stage in an appropriate manner. Please do not jump off any raised platforms.
For performers such as Circus, Stilts & Fire Acts please ensure that you familiarise yourself with your circuit prior to commencement of your performance for the night. Assess any risks and implement your risk minimisation strategies and please flag any issues that you have to your event coordinator.`,
  safety_link: `http://liveperformance.com.au/sites/liveperformance.com.au/files/resources/safety_guidelines_for_entertainment_industry_5_0.pdf`,
}

let _settingsCache = null
export async function loadSettings() {
  if (_settingsCache) return _settingsCache
  const { data } = await supabase.from('settings').select('*').eq('id', 'global').single()
  _settingsCache = data || FALLBACK
  return _settingsCache
}
export function clearSettingsCache() { _settingsCache = null }

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Add a section only if it has content. label on its own line, value below.
function addSection(lines, label, value) {
  lines.push(label)
  lines.push(value && String(value).trim() ? String(value).trim() : '—')
}

/**
 * Build the tailored call sheet for a single performer.
 * Per-performer fields override booking-level ones where present.
 */
export function buildCallSheet(booking, performer = null, settings = null, allPerformers = []) {
  const s = settings || FALLBACK
  const p = performer || {}

  // Per-performer value, falling back to booking-level
  const val = (pField, bField) => (p[pField] && String(p[pField]).trim()) ? p[pField] : (booking[bField] || '')

  const needToBring   = val('need_to_bring', 'need_to_bring')
  const needToLearn   = val('need_to_learn', 'need_to_learn')
  const perfTimes     = (p.performance_times && p.performance_times.trim())
                        ? p.performance_times
                        : (p.time_slot || '')
  const costume       = val('costume', 'dress_code')
  const meals         = val('meals_info', 'crew_meals')
  const onDayContact  = (p.on_day_contact && p.on_day_contact.trim())
                        ? p.on_day_contact
                        : (booking.on_day_contact || s.default_on_day_contact || 'Renee · 0403 769 229')
  const fee           = (p.fee_text && p.fee_text.trim())
                        ? p.fee_text
                        : (p.fee ? `$${p.fee}` : '')
  const numEntertainers = allPerformers.length || 1

  const venueBlock = [booking.venue, booking.venue_address].filter(Boolean).join('\n')

  const lines = []

  // Only include NEED TO BRING / NEED TO LEARN if they have content (matches your examples)
  if (needToBring && needToBring.trim()) addSection(lines, 'NEED TO BRING', needToBring)
  if (needToLearn && needToLearn.trim()) addSection(lines, 'NEED TO LEARN', needToLearn)

  addSection(lines, 'EVENT DATE', fmtDate(booking.event_date))
  addSection(lines, 'EVENT BRIEF', booking.event_brief)
  addSection(lines, 'VENUE', venueBlock)
  addSection(lines, 'DEMOGRAPHIC OF GUESTS', booking.demographic)
  addSection(lines, 'ON THE DAY CONTACT', onDayContact)
  addSection(lines, 'NO. OF ENTERTAINERS', String(numEntertainers))
  addSection(lines, 'BUMP IN DETAILS', booking.bump_in_time)
  addSection(lines, 'GUEST ARRIVAL TIME', booking.guest_arrival_time)
  addSection(lines, 'PERFORMANCE TIME & LOCATIONS', perfTimes)
  addSection(lines, 'APPROVED MEALS & BEVERAGES AND WHERE', meals)
  addSection(lines, 'COSTUME REQUIREMENTS', costume)
  addSection(lines, 'FEE', fee)

  // Standard terms (no big dividers — matches the real format)
  lines.push('PAYMENT DETAILS:')
  lines.push(s.payment_terms || FALLBACK.payment_terms)
  lines.push('FURTHER BOOKINGS')
  lines.push(s.further_bookings || FALLBACK.further_bookings)
  lines.push('SOCIAL MEDIA')
  lines.push(s.social_media || FALLBACK.social_media)
  lines.push('WORKPLACE HEALTH & SAFETY:')
  lines.push(s.whs_terms || FALLBACK.whs_terms)
  lines.push('PLEASE FAMILIARIZE YOURSELF WITH THE NATIONAL SAFETY GUIDELINES:')
  lines.push(s.safety_link || FALLBACK.safety_link)

  return lines.join('\n')
}

export async function downloadCallSheet(booking, performer = null, allPerformers = []) {
  const settings = await loadSettings()
  const text = buildCallSheet(booking, performer, settings, allPerformers)
  const who = performer ? performer.name : booking.client_name
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `callsheet-${(who || 'event').replace(/\s+/g, '-').toLowerCase()}.txt`
  a.click()
}

export async function buildCallSheetEmail(booking, performer = null, allPerformers = []) {
  const settings = await loadSettings()
  const name = performer ? performer.name : 'team'
  const subject = `Call Sheet — ${booking.client_name} — ${booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}`
  const body = `Hi ${name},\n\nPlease find your call sheet below for ${booking.client_name} — ${booking.event_type}.\n\n` +
    buildCallSheet(booking, performer, settings, allPerformers) +
    `\n\nPlease confirm your availability by replying to this email.\n\nThanks,\nByron Bay Experience`
  return { subject, body }
}
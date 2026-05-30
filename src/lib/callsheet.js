// ============================================
// Call sheet builder — Byron Bay Experience
// Produces the full performer call sheet with
// all standard terms (payment, WHS, social, etc.)
// ============================================

// Standard boilerplate that appears on every call sheet
const STANDARD_TERMS = `
PAYMENT DETAILS
You need to have invoices in by 5pm Tuesdays to be included in the pay run on Wednesday morning, otherwise it will be included in the following week.
Invoice Byron Bay Experience by emailing to info@byronbayexperience.com.au.
Your invoice must say TAX INVOICE with your bank account details, ABN and performance date and whether you are registered for GST.

FURTHER BOOKINGS
To remain on the books, please do not give out your card and do not take any bookings direct from this client or venue. All enquiries as a result of this gig must be directed back via Byron Bay Experience.

SOCIAL MEDIA
Please mention @byronbayexperience in any social media posts about this gig. Please never mention corporate companies or show any client logos in your posts as they request our confidentiality.
Please follow us on Instagram @byronbayexperience so we can follow you back and tag the correct account when posting about you.

WORKPLACE HEALTH & SAFETY
I agree to take responsibility to adhere to safety in the workplace.
I agree to conduct a risk assessment upon arrival to performance site and to take the necessary measures to ensure the safety of performers and audiences.
I confirm I hold a certificate of currency for Public Liability pertaining to all aspects of myself or group performance for $20,000,000.

Risk Assessments — Please be advised that you are to do a risk assessment of your work space and minimise hazards.
For musicians please ensure that all leads are duct taped to the floor, all liquids are away from electrical equipment, walkways are clear and if you are performing on a raised platform please enter and exit the stage in an appropriate manner. Please do not jump off any raised platforms.
For performers such as Circus, Stilts & Fire Acts please ensure that you familiarise yourself with your circuit prior to commencement of your performance for the night. Assess any risks and implement your risk minimisation strategies and please flag any issues that you have to your event coordinator.

PLEASE FAMILIARISE YOURSELF WITH THE NATIONAL SAFETY GUIDELINES:
http://liveperformance.com.au/sites/liveperformance.com.au/files/resources/safety_guidelines_for_entertainment_industry_5_0.pdf
`.trim()

function fmtDate(d) {
  if (!d) return 'TBC'
  return new Date(d).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Build the full call sheet text for a booking.
 * If `performer` is supplied, it personalises the FEE and performance time.
 */
export function buildCallSheet(booking, performers = [], performer = null) {
  const perfList = performer ? [performer] : performers

  const performanceLines = perfList.length
    ? perfList.map(p => `${p.name || '—'}${p.time_slot ? ` · ${p.time_slot}` : ''}${p.type ? ` (${p.type})` : ''}`).join('\n')
    : '—'

  const feeLine = performer
    ? `$${performer.fee || '—'}`
    : (perfList.length ? perfList.map(p => `${p.name}: $${p.fee || '—'}`).join('\n') : '—')

  return [
    `CALL SHEET — Byron Bay Experience`,
    `${'═'.repeat(50)}`,
    ``,
    `NEED TO BRING`,
    booking.need_to_bring || '—',
    ``,
    `NEED TO LEARN`,
    booking.need_to_learn || '—',
    ``,
    `EVENT DATE`,
    fmtDate(booking.event_date),
    ``,
    `EVENT BRIEF`,
    booking.event_brief || '—',
    ``,
    `VENUE`,
    booking.venue || '—',
    booking.venue_address ? booking.venue_address : '',
    ``,
    `DEMOGRAPHIC OF GUESTS`,
    booking.demographic || '—',
    ``,
    `ON THE DAY CONTACT`,
    booking.on_day_contact || 'Renee · 0403 769 229',
    ``,
    `NO. OF ENTERTAINERS`,
    String(perfList.length || '—'),
    ``,
    `BUMP IN DETAILS`,
    booking.bump_in_time || '—',
    ``,
    `GUEST ARRIVAL TIME`,
    booking.guest_arrival_time || '—',
    ``,
    `PERFORMANCE TIME & LOCATIONS`,
    performanceLines,
    ``,
    `APPROVED MEALS & BEVERAGES AND WHERE`,
    booking.crew_meals || '—',
    ``,
    `COSTUME REQUIREMENTS`,
    booking.dress_code || '—',
    ``,
    `GREEN ROOM DETAILS`,
    booking.greenroom_location || '—',
    booking.greenroom_notes ? booking.greenroom_notes : '',
    ``,
    `FEE`,
    feeLine,
    ``,
    `${'═'.repeat(50)}`,
    ``,
    STANDARD_TERMS,
  ].filter(line => line !== undefined).join('\n')
}

/** Download the call sheet as a .txt file */
export function downloadCallSheet(booking, performers = [], performer = null) {
  const text = buildCallSheet(booking, performers, performer)
  const who = performer ? performer.name : booking.client_name
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `callsheet-${(who || 'event').replace(/\s+/g, '-').toLowerCase()}.txt`
  a.click()
}

/** Build an email-ready version (subject + body) for a performer */
export function buildCallSheetEmail(booking, performers = [], performer = null) {
  const name = performer ? performer.name : 'team'
  const subject = `Call Sheet — ${booking.client_name} — ${booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}`
  const body = `Hi ${name},\n\nPlease find your call sheet below for ${booking.client_name} — ${booking.event_type}.\n\n` +
    buildCallSheet(booking, performers, performer) +
    `\n\nPlease confirm your availability by replying to this email.\n\nThanks,\nByron Bay Experience`
  return { subject, body }
}
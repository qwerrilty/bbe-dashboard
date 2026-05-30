import { useState } from 'react'
import { FEATURES } from '../lib/config'
import { sendEmail } from '../lib/email'

// A button that sends an email when EMAIL_ENABLED is true,
// and shows a clear "coming soon" disabled state otherwise.
//
// Pass either:
//   - to / subject / body  (static values), OR
//   - getContent()         (async fn returning { to, subject, body })
export default function EmailButton({
  to, subject, body, getContent,
  bookingId, type, label = '✉ Send email',
  className = 'btn btn-primary', style = {},
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const enabled = FEATURES.EMAIL_ENABLED

  const handleClick = async () => {
    if (!enabled) return
    setSending(true)
    let payload = { to, subject, body, bookingId, type }
    if (getContent) {
      const c = await getContent()
      payload = { ...payload, ...c }
    }
    const res = await sendEmail(payload)
    setSending(false)
    if (res.ok) {
      setSent(true)
      setTimeout(() => setSent(false), 2500)
    } else if (!res.disabled) {
      alert('Email failed: ' + (res.error || 'unknown error'))
    }
  }

  if (!enabled) {
    return (
      <button className={className} onClick={handleClick} disabled
        title="Email sending isn't switched on yet — coming soon"
        style={{ ...style, opacity: 0.5, cursor: 'not-allowed' }}>
        {label}<span style={{ fontSize: 10, marginLeft: 4, fontWeight: 400, opacity: 0.8 }}>(soon)</span>
      </button>
    )
  }

  return (
    <button className={className} onClick={handleClick} disabled={sending} style={style}>
      {sending ? 'Sending...' : sent ? '✓ Sent!' : label}
    </button>
  )
}
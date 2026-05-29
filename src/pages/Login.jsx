import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg2)',
    }}>
      <div style={{
        background: 'var(--bg)', border: '0.5px solid var(--border)',
        borderRadius: 16, padding: '48px 40px', maxWidth: 360, width: '100%',
      }}>
        <div style={{
          width: 48, height: 48, background: '#1a6b8a', borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 22, margin: '0 auto 20px',
        }}>♪</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, marginBottom: 8, color: 'var(--text)', textAlign: 'center' }}>
          Byron Bay Experience
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, textAlign: 'center' }}>
          Team operations dashboard
        </p>
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && (
            <div style={{ fontSize: 12, color: '#c94f2e', background: '#fdf0ec', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            marginTop: 4, padding: '11px 20px', fontSize: 14, fontFamily: 'inherit',
            background: '#1a6b8a', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer',
          }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
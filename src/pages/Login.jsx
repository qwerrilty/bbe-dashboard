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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5EDD8 0%, #f0e8d8 50%, #e8dcc8 100%)',
    }}>
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 20, padding: '48px 44px', maxWidth: 400, width: '100%',
        boxShadow: '0 20px 60px rgba(74,42,28,0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Byron Bay Experience" style={{ height: 90, width: 'auto', objectFit: 'contain' }} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, textAlign: 'center' }}>
          Team operations dashboard — sign in to continue
        </p>
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && (
            <div style={{ fontSize: 12, color: 'var(--terracotta-text)', background: 'var(--terracotta-bg)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--terracotta)' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            marginTop: 6, padding: '12px 20px', fontSize: 14, fontFamily: 'var(--sans)',
            background: 'var(--terracotta)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600,
            boxShadow: '0 4px 14px rgba(201,90,53,0.3)',
            transition: 'opacity 0.15s',
          }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--muted)' }}>
          Entertainment · sorted ✦
        </div>
      </div>
    </div>
  )
}
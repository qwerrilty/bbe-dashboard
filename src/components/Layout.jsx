import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ session }) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 16px',
    fontSize: 13,
    textDecoration: 'none',
    borderBottom: '2px solid',
    borderBottomColor: isActive ? 'var(--ocean)' : 'transparent',
    color: isActive ? 'var(--ocean)' : 'var(--muted)',
    fontWeight: isActive ? 500 : 400,
    whiteSpace: 'nowrap',
    transition: 'color 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg2)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--ocean)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontFamily: 'Georgia, serif',
          }}>♪</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--serif)', color: 'var(--text)' }}>
              Byron Bay Experience
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Operations dashboard</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{session?.user?.email}</span>
          <button className="btn" onClick={handleSignOut} style={{ fontSize: 12, padding: '5px 10px' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex', borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg)', overflowX: 'auto', paddingLeft: 8,
      }}>
        <NavLink to="/" end style={navStyle}>Overview</NavLink>
        <NavLink to="/bookings" style={navStyle}>Bookings</NavLink>
        <NavLink to="/performers" style={navStyle}>Performers</NavLink>
        <NavLink to="/inbox" style={navStyle}>Inbox</NavLink>
      </div>

      {/* Page content */}
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  )
}

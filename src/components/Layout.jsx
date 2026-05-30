import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ session }) {
  const navigate = useNavigate()
  const handleSignOut = async () => { await supabase.auth.signOut(); navigate('/') }

  const navStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', fontSize: 13, textDecoration: 'none',
    borderBottom: '2px solid',
    borderBottomColor: isActive ? 'var(--terracotta)' : 'transparent',
    color: isActive ? 'var(--terracotta)' : 'var(--muted)',
    fontWeight: isActive ? 600 : 400,
    whiteSpace: 'nowrap', transition: 'color 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg3)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60,
        borderBottom: '1px solid var(--border)',
        background: 'var(--cream)',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo.png" alt="Byron Bay Experience" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          <div style={{ width: 1, height: 30, background: 'var(--border-mid)' }} />
          <nav style={{ display: 'flex' }}>
            <NavLink to="/" end style={navStyle}>Overview</NavLink>
            <NavLink to="/bookings" style={navStyle}>Bookings</NavLink>
            <NavLink to="/calendar" style={navStyle}>Calendar</NavLink>
            <NavLink to="/kanban" style={navStyle}>Pipeline</NavLink>
            <NavLink to="/performers" style={navStyle}>Performers</NavLink>
            <NavLink to="/inbox" style={navStyle}>Inbox</NavLink>
            <NavLink to="/settings" style={navStyle}>Settings</NavLink>
          </nav>
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--terracotta)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>
            {session?.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{session?.user?.email}</span>
          <button className="btn" onClick={handleSignOut} style={{ fontSize: 12, padding: '5px 12px' }}>Sign out</button>
        </div>
      </div>
      <div style={{ padding: '28px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  )
}
import { useEffect, useState } from "react"
import { auth, db } from "../services/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useNavigate, Link, useLocation } from "react-router-dom"
import Notifications from "./Notifications"

export default function Navbar() {
  const [credits, setCredits] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u)
      if (!u) { setCredits(null); setRole(null); return }

      const ref = doc(db, "users", u.uid)
      const unsubSnap = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setCredits(snap.data().credits)
          setRole(snap.data().role || "bidder")
        }
      })
      return () => unsubSnap()
    })
    return () => unsubAuth()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  const navLink = (label, path) => {
    const active = location.pathname === path
    return (
      <Link to={path} style={{
        textDecoration: 'none',
        fontSize: '0.82rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: active ? 'var(--gold)' : 'var(--text-secondary)',
        fontFamily: "'DM Mono', monospace",
        transition: 'color 0.2s',
        borderBottom: active ? '1px solid var(--gold-dim)' : '1px solid transparent',
        paddingBottom: '2px',
      }}>
        {label}
      </Link>
    )
  }

  return (
    <nav style={{
      background: 'rgba(7,7,8,0.92)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1400px', margin: '0 auto', padding: '0 2rem',
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>Code</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--text-primary)' }}>Bidz</span>
          </div>
        </Link>

        {/* Nav links */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {navLink('Auctions', '/dashboard')}
            {navLink('My Bids', '/my-bids')}
            {role === 'admin' && navLink('Admin', '/admin')}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user && (
            <>
              {/* Notifications */}
              <Notifications />

              {/* Credits */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--bg-raised)', border: '1px solid var(--border-gold)',
                borderRadius: '8px', padding: '6px 14px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="var(--gold)" strokeWidth="1.5"/>
                  <path d="M12 6v2m0 8v2M9 12h6" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: '0.85rem',
                  color: 'var(--gold)', fontWeight: 500,
                }}>
                  {credits !== null ? credits.toLocaleString() : '—'}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '6px 14px',
                  color: 'var(--text-secondary)', fontSize: '0.8rem',
                  cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--gold-dim)'; e.target.style.color = 'var(--gold)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
              >
                Exit
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

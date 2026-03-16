import { useEffect, useState, useRef } from "react"
import { auth, db } from "../services/firebase"
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch } from "firebase/firestore"

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    )

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setNotifs(data.sort((a, b) => b.createdAt - a.createdAt))
    })
    return () => unsub()
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const markAllRead = async () => {
    const batch = writeBatch(db)
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true })
    })
    await batch.commit()
  }

  const markOne = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true })
  }

  const unread = notifs.filter(n => !n.read).length

  const iconColor = {
    outbid: '#fbbf24',
    won: 'var(--gold)',
    info: 'var(--text-secondary)',
  }

  const iconEmoji = {
    outbid: '⚡',
    won: '🏆',
    info: 'ℹ',
  }

  const timeAgo = (ts) => {
    const diff = Date.now() - ts
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
        style={{
          position: 'relative', background: 'var(--bg-raised)',
          border: `1px solid ${unread > 0 ? 'var(--border-gold)' : 'var(--border)'}`,
          borderRadius: '8px', padding: '6px 10px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-dim)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = unread > 0 ? 'var(--border-gold)' : 'var(--border)'}
      >
        <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>🔔</span>
        {unread > 0 && (
          <span style={{
            background: 'var(--gold)', color: '#070708',
            borderRadius: '10px', padding: '1px 6px',
            fontSize: '0.65rem', fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
          }}>
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '340px', background: 'var(--bg-card)',
          border: '1px solid var(--border-gold)', borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 200, overflow: 'hidden',
          animation: 'fade-up 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{
              fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700,
            }}>Notifications</span>
            {notifs.some(n => !n.read) && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', color: 'var(--gold-dim)',
                fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.06em',
                textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{
                padding: '2.5rem 1rem', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.85rem',
              }}>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  style={{
                    display: 'flex', gap: '12px', padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: n.read ? 'transparent' : 'rgba(201,168,76,0.04)',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(201,168,76,0.04)'}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--bg-raised)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                  }}>
                    {iconEmoji[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.82rem', color: 'var(--text-primary)',
                      lineHeight: 1.4, marginBottom: '4px',
                    }}>
                      {n.message}
                    </p>
                    <p style={{
                      fontSize: '0.72rem', color: 'var(--text-muted)',
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: 'var(--gold)', flexShrink: 0, marginTop: '6px',
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

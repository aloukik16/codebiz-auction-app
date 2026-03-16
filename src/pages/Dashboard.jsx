import { useEffect, useState } from "react"
import { db } from "../services/firebase"
import { collection, onSnapshot } from "firebase/firestore"
import AuctionCard from "../components/AuctionCard"
import Navbar from "../components/Navbar"

export default function Dashboard() {
  const [auctions, setAuctions] = useState([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "auctions"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setAuctions(data.sort((a, b) => (a.ended ? 1 : 0) - (b.ended ? 1 : 0)))
    })
    return () => unsub()
  }, [])

  const filtered = auctions.filter(a => {
    if (filter === "live") return !a.ended
    if (filter === "ended") return a.ended
    return true
  })

  const liveCount = auctions.filter(a => !a.ended).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Navbar />

      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '3rem 2rem 2rem',
        maxWidth: '1400px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{
              fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--gold-dim)', marginBottom: '8px', fontFamily: "'DM Mono', monospace",
            }}>
              ◆ Live Marketplace
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 900, lineHeight: 1, letterSpacing: '-1px',
            }}>
              Active Auctions
            </h1>
          </div>

          {/* Filter tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg-raised)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '4px', gap: '2px',
          }}>
            {['all', 'live', 'ended'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'var(--bg-card)' : 'none',
                  border: filter === f ? '1px solid var(--border-gold)' : '1px solid transparent',
                  borderRadius: '8px', padding: '6px 16px',
                  color: filter === f ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: "'DM Mono', monospace", transition: 'all 0.2s',
                }}
              >
                {f}
                {f === 'live' && liveCount > 0 && (
                  <span style={{
                    marginLeft: '6px', background: 'var(--green)', color: '#070708',
                    borderRadius: '10px', padding: '1px 6px', fontSize: '0.65rem', fontWeight: 600,
                  }}>{liveCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '8px' }}>No auctions found</p>
            <p style={{ fontSize: '0.85rem' }}>Check back soon</p>
          </div>
        ) : (
          <div className="auction-grid">
            {filtered.map((auction, i) => (
              <AuctionCard key={auction.id} auction={auction} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

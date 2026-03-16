import { useEffect, useState } from "react"
import { db } from "../services/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"

export default function BidHistory({ auctionId }) {
  const [bids, setBids] = useState([])

  useEffect(() => {
    const q = query(collection(db, "bids"), where("auctionId", "==", auctionId))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => d.data())
      setBids(data.sort((a, b) => b.amount - a.amount))
    })
    return () => unsub()
  }, [auctionId])

  const formatTime = (ts) => {
    if (!ts) return ""
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ marginTop: '12px' }}>
      {bids.length === 0 ? (
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          fontFamily: "'DM Mono', monospace",
          padding: '8px 0',
        }}>
          No bids placed yet
        </p>
      ) : (
        <div style={{
          maxHeight: '120px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          marginTop: '8px',
        }}>
          {bids.map((bid, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
                opacity: i === 0 ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {i === 0 && (
                  <span style={{ fontSize: '0.7rem' }}>👑</span>
                )}
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.82rem',
                  color: i === 0 ? 'var(--gold)' : 'var(--text-secondary)',
                  fontWeight: i === 0 ? 500 : 400,
                }}>
                  ${bid.amount?.toLocaleString()}
                </span>
              </div>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}>
                {formatTime(bid.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

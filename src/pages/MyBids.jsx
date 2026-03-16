import { useEffect, useState } from "react"
import { auth, db } from "../services/firebase"
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore"
import Navbar from "../components/Navbar"

export default function MyBids() {
  const [bids, setBids] = useState([])
  const [auctionMap, setAuctionMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const q = query(collection(db, "bids"), where("bidder", "==", user.uid))
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)
      setBids(data)

      // Fetch auction details for each unique auctionId
      const uniqueIds = [...new Set(data.map(b => b.auctionId))]
      const map = {}
      await Promise.all(uniqueIds.map(async (id) => {
        const snap = await getDoc(doc(db, "auctions", id))
        if (snap.exists()) map[id] = { id: snap.id, ...snap.data() }
      }))
      setAuctionMap(map)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const user = auth.currentUser

  // Group bids by auction
  const grouped = {}
  bids.forEach(b => {
    if (!grouped[b.auctionId]) grouped[b.auctionId] = []
    grouped[b.auctionId].push(b)
  })

  const getStatus = (auction, bids) => {
    if (!auction) return { label: 'Unknown', color: 'var(--text-muted)' }
    const isTopBidder = auction.highestBidder === user?.uid
    if (auction.ended && isTopBidder) return { label: 'Won 🏆', color: 'var(--gold)' }
    if (auction.ended && !isTopBidder) return { label: 'Lost', color: 'var(--red)' }
    if (!auction.ended && isTopBidder) return { label: 'Winning', color: 'var(--green)' }
    return { label: 'Outbid', color: '#fbbf24' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Navbar />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: '8px', fontFamily: "'DM Mono', monospace" }}>
            ◆ Your Activity
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
            My Bids
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Bids', value: bids.length },
            { label: 'Auctions Entered', value: Object.keys(grouped).length },
            { label: 'Won', value: Object.values(grouped).filter((_, i) => { const a = auctionMap[Object.keys(grouped)[i]]; return a?.ended && a?.highestBidder === user?.uid }).length },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px 24px', minWidth: '130px',
            }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.6rem', fontWeight: 500, color: 'var(--gold)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
            Loading your bids...
          </div>
        )}

        {!loading && Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>No bids placed yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Head to the auction floor to get started</p>
            <a href="/dashboard" style={{
              display: 'inline-block', background: 'var(--gold)', color: '#070708',
              padding: '10px 24px', borderRadius: '10px', fontWeight: 600,
              fontSize: '0.85rem', textDecoration: 'none',
            }}>
              Browse Auctions
            </a>
          </div>
        )}

        {/* Grouped by auction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([auctionId, auctionBids]) => {
            const auction = auctionMap[auctionId]
            const status = getStatus(auction, auctionBids)
            const topBid = Math.max(...auctionBids.map(b => b.amount))

            return (
              <div key={auctionId} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '14px', overflow: 'hidden',
              }}>
                {/* Auction header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px 20px', background: 'var(--bg-raised)',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {auction?.image && (
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '8px', flexShrink: 0,
                      background: `url(${auction.image}) center/cover`,
                    }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                      {auction?.title || auctionId}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem', color: status.color,
                        fontFamily: "'DM Mono', monospace", fontWeight: 500,
                      }}>
                        {status.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Your highest: <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--gold)' }}>${topBid.toLocaleString()}</span>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Current: <span style={{ fontFamily: "'DM Mono', monospace" }}>${auction?.currentBid?.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual bids */}
                <div style={{ padding: '0 20px' }}>
                  {auctionBids.sort((a, b) => b.createdAt - a.createdAt).map((b, i) => (
                    <div key={b.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: i < auctionBids.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{
                        fontFamily: "'DM Mono', monospace", fontSize: '0.88rem',
                        color: b.amount === topBid ? 'var(--gold)' : 'var(--text-secondary)',
                      }}>
                        ${b.amount?.toLocaleString()}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(b.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

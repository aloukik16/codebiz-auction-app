import { useEffect, useState } from "react"
import { db } from "../services/firebase"
import {
  collection, onSnapshot, doc, updateDoc,
  query, where, getDocs, getDoc, writeBatch
} from "firebase/firestore"
import Navbar from "../components/Navbar"

const TAB_AUCTIONS = "auctions"
const TAB_CREDITS = "credits"
const TAB_REPORTS = "reports"

export default function AdminDashboard() {
  const [tab, setTab] = useState(TAB_AUCTIONS)
  const [auctions, setAuctions] = useState([])
  const [bids, setBids] = useState([])
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState(null)

  // Credits panel state
  const [searchEmail, setSearchEmail] = useState("")
  const [foundUser, setFoundUser] = useState(null)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditLoading, setCreditLoading] = useState(false)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "auctions"), (snap) => {
      setAuctions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt))
    })
    const u2 = onSnapshot(collection(db, "bids"), (snap) => {
      setBids(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt))
    })
    const u3 = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { u1(); u2(); u3() }
  }, [])

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Close auction manually
  const closeAuction = async (auction) => {
    if (!window.confirm(`Close "${auction.title}"? This will declare the winner.`)) return
    try {
      const batch = writeBatch(db)
      const aRef = doc(db, "auctions", auction.id)
      batch.update(aRef, { ended: true })

      if (auction.highestBidder) {
        const uRef = doc(db, "users", auction.highestBidder)
        const uSnap = await getDoc(uRef)
        if (uSnap.exists()) {
          batch.update(uRef, { credits: (uSnap.data().credits || 0) - auction.currentBid })
        }

        // Win notification
        const notifRef = doc(collection(db, "notifications"))
        batch.set(notifRef, {
          userId: auction.highestBidder,
          auctionId: auction.id,
          auctionTitle: auction.title,
          type: "won",
          message: `You won "${auction.title}" for $${auction.currentBid}!`,
          read: false,
          createdAt: Date.now(),
        })
      }
      await batch.commit()
      showToast("Auction closed and winner declared")
    } catch (err) {
      showToast("Failed to close auction", "error")
    }
  }

  // Reopen auction
  const reopenAuction = async (auctionId) => {
    await updateDoc(doc(db, "auctions", auctionId), { ended: false })
    showToast("Auction reopened")
  }

  // Search user by email
  const searchUser = async () => {
    if (!searchEmail.trim()) return
    const q = query(collection(db, "users"), where("email", "==", searchEmail.trim()))
    const snap = await getDocs(q)
    if (snap.empty) { showToast("No user found with that email", "error"); setFoundUser(null); return }
    const d = snap.docs[0]
    setFoundUser({ id: d.id, ...d.data() })
  }

  // Assign credits
  const assignCredits = async () => {
    if (!foundUser || !creditAmount) return
    setCreditLoading(true)
    try {
      const uRef = doc(db, "users", foundUser.id)
      await updateDoc(uRef, { credits: Number(creditAmount) })
      setFoundUser(prev => ({ ...prev, credits: Number(creditAmount) }))
      showToast(`Credits updated to ${creditAmount} for ${foundUser.email}`)
      setCreditAmount("")
    } catch (err) {
      showToast("Failed to update credits", "error")
    }
    setCreditLoading(false)
  }

  const bidsForAuction = (auctionId) => bids.filter(b => b.auctionId === auctionId)

  const inputStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '10px 14px', color: 'var(--text-primary)',
    fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  }

  const tabStyle = (t) => ({
    background: tab === t ? 'var(--bg-card)' : 'none',
    border: tab === t ? '1px solid var(--border-gold)' : '1px solid transparent',
    borderRadius: '8px', padding: '7px 18px',
    color: tab === t ? 'var(--gold)' : 'var(--text-secondary)',
    fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: "'DM Mono', monospace", transition: 'all 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '2rem',
          background: toast.type === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.4)'}`,
          color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
          padding: '10px 20px', borderRadius: '10px', zIndex: 500,
          fontFamily: "'DM Mono', monospace", fontSize: '0.82rem',
          animation: 'fade-up 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: '8px', fontFamily: "'DM Mono', monospace" }}>
            ◆ Admin Panel
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Dashboard
          </h1>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {[
              { label: 'Total Auctions', value: auctions.length },
              { label: 'Live', value: auctions.filter(a => !a.ended).length },
              { label: 'Total Bids', value: bids.length },
              { label: 'Registered Users', value: users.length },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px 24px', minWidth: '140px',
              }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.6rem', fontWeight: 500, color: 'var(--gold)', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', gap: '2px', width: 'fit-content' }}>
            <button style={tabStyle(TAB_AUCTIONS)} onClick={() => setTab(TAB_AUCTIONS)}>Manage Auctions</button>
            <button style={tabStyle(TAB_CREDITS)} onClick={() => setTab(TAB_CREDITS)}>Assign Credits</button>
            <button style={tabStyle(TAB_REPORTS)} onClick={() => setTab(TAB_REPORTS)}>Bid Reports</button>
          </div>
        </div>

        {/* ── TAB: MANAGE AUCTIONS ── */}
        {tab === TAB_AUCTIONS && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <a href="/admin/create" style={{
                background: 'var(--gold)', color: '#070708',
                padding: '10px 20px', borderRadius: '10px',
                fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
                letterSpacing: '0.03em',
              }}>
                + New Auction
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {auctions.map(a => (
                <div key={a.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '20px',
                  display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                }}>
                  {/* Image */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '10px', flexShrink: 0,
                    background: `url(${a.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=60'}) center/cover`,
                    filter: a.ended ? 'grayscale(60%)' : 'none',
                  }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700 }}>{a.title}</h3>
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px',
                        fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em',
                        background: a.ended ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                        color: a.ended ? 'var(--red)' : 'var(--green)',
                        border: `1px solid ${a.ended ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
                      }}>
                        {a.ended ? 'Closed' : 'Live'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem', color: 'var(--gold)' }}>
                        Current: ${a.currentBid?.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {bidsForAuction(a.id).length} bids
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Ends: {a.endTime ? new Date(a.endTime).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!a.ended ? (
                      <button
                        onClick={() => closeAuction(a)}
                        style={{
                          background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)',
                          color: 'var(--red)', borderRadius: '8px', padding: '7px 16px',
                          fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                          fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                      >
                        Close Auction
                      </button>
                    ) : (
                      <button
                        onClick={() => reopenAuction(a.id)}
                        style={{
                          background: 'rgba(201,168,76,0.1)', border: '1px solid var(--border-gold)',
                          color: 'var(--gold)', borderRadius: '8px', padding: '7px 16px',
                          fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                          fontFamily: "'DM Mono', monospace', letterSpacing: '0.04em",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {auctions.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No auctions yet</p>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: ASSIGN CREDITS ── */}
        {tab === TAB_CREDITS && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', marginBottom: '1.5rem' }}>
                Find Bidder
              </h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                <input
                  placeholder="bidder@email.com"
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchUser()}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={searchUser}
                  style={{
                    background: 'var(--bg-raised)', border: '1px solid var(--border-gold)',
                    borderRadius: '10px', padding: '10px 18px', color: 'var(--gold)',
                    fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                >
                  Search
                </button>
              </div>

              {foundUser && (
                <div style={{ background: 'var(--bg-raised)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: "'DM Mono', monospace" }}>
                    Found
                  </p>
                  <p style={{ fontWeight: 500, marginBottom: '4px' }}>{foundUser.email}</p>
                  <p style={{ fontFamily: "'DM Mono', monospace", color: 'var(--gold)', fontSize: '1.1rem' }}>
                    {foundUser.credits?.toLocaleString()} credits
                  </p>
                </div>
              )}

              {foundUser && (
                <>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', fontFamily: "'DM Mono', monospace" }}>
                    Set Credits To
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={creditAmount}
                      onChange={e => setCreditAmount(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button
                      onClick={assignCredits}
                      disabled={creditLoading || !creditAmount}
                      style={{
                        background: creditLoading || !creditAmount ? 'var(--bg-raised)' : 'var(--gold)',
                        color: creditLoading || !creditAmount ? 'var(--text-muted)' : '#070708',
                        border: 'none', borderRadius: '10px', padding: '10px 20px',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (!creditLoading && creditAmount) e.target.style.background = 'var(--gold-light)' }}
                      onMouseLeave={e => { if (!creditLoading && creditAmount) e.target.style.background = 'var(--gold)' }}
                    >
                      {creditLoading ? '...' : 'Assign'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Users list */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', marginBottom: '1rem' }}>All Bidders</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.filter(u => u.role !== 'admin').map(u => (
                  <div key={u.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '12px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.email}</span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: 'var(--gold)',
                      background: 'rgba(201,168,76,0.08)', padding: '3px 10px', borderRadius: '6px',
                    }}>
                      {u.credits?.toLocaleString()} cr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: BID REPORTS ── */}
        {tab === TAB_REPORTS && (
          <div>
            {auctions.map(a => {
              const auctionBids = bidsForAuction(a.id)
              if (auctionBids.length === 0) return null
              return (
                <div key={a.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '14px', marginBottom: '1.5rem', overflow: 'hidden',
                }}>
                  {/* Auction header */}
                  <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-raised)',
                  }}>
                    <div>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>{a.title}</h3>
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px',
                        fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em',
                        background: a.ended ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                        color: a.ended ? 'var(--red)' : 'var(--green)',
                      }}>
                        {a.ended ? 'Closed' : 'Live'}
                      </span>
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {auctionBids.length} bids
                    </span>
                  </div>

                  {/* Bids table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Bidder', 'Amount', 'Time'].map(h => (
                            <th key={h} style={{
                              textAlign: 'left', padding: '10px 20px',
                              color: 'var(--text-secondary)', fontWeight: 400,
                              fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                              fontFamily: "'DM Mono', monospace",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auctionBids.sort((x, y) => y.amount - x.amount).map((b, i) => (
                          <tr key={b.id} style={{ borderBottom: '1px solid var(--border)', opacity: i === 0 ? 1 : 0.7 }}>
                            <td style={{ padding: '10px 20px', color: 'var(--text-primary)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {i === 0 && <span style={{ fontSize: '0.75rem' }}>👑</span>}
                                {b.bidderEmail || b.bidder?.slice(0, 8) + '...'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 20px', fontFamily: "'DM Mono', monospace", color: i === 0 ? 'var(--gold)' : 'var(--text-primary)' }}>
                              ${b.amount?.toLocaleString()}
                            </td>
                            <td style={{ padding: '10px 20px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem' }}>
                              {new Date(b.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
            {bids.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No bids yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { auth, db } from "../services/firebase"
import { doc, updateDoc, getDoc, collection, addDoc, runTransaction } from "firebase/firestore"
import { useState, useEffect, useRef } from "react"
import BidHistory from "./BidHistory"

export default function AuctionCard({ auction, index = 0 }) {
  const [bid, setBid] = useState("")
  const [timeLeft, setTimeLeft] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const prevHighestBidder = useRef(auction.highestBidder)

  // Detect outbid in real time
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    const prev = prevHighestBidder.current
    const curr = auction.highestBidder

    if (prev === user.uid && curr !== user.uid && curr !== null && prev !== null) {
      showToast(`You were outbid! New bid: $${auction.currentBid}`, "warn")

      // Write a notification to Firestore for the outbid user
      addDoc(collection(db, "notifications"), {
        userId: user.uid,
        auctionId: auction.id,
        auctionTitle: auction.title,
        type: "outbid",
        message: `You were outbid on "${auction.title}". New bid: $${auction.currentBid}`,
        read: false,
        createdAt: Date.now(),
      }).catch(() => {})
    }

    prevHighestBidder.current = curr
  }, [auction.highestBidder, auction.currentBid])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!auction.endTime) return
      const diff = auction.endTime - Date.now()

      if (diff <= 0) {
        setTimeLeft("Ended")
        if (!auction.ended) {
          const auctionRef = doc(db, "auctions", auction.id)
          // Deduct credits from winner and write winner notification
          runTransaction(db, async (tx) => {
            const aSnap = await tx.get(auctionRef)
            if (!aSnap.exists() || aSnap.data().ended) return
            tx.update(auctionRef, { ended: true })
            const winnerId = aSnap.data().highestBidder
            const winAmount = aSnap.data().currentBid
            if (winnerId) {
              const userRef = doc(db, "users", winnerId)
              const uSnap = await tx.get(userRef)
              if (uSnap.exists()) {
                tx.update(userRef, { credits: (uSnap.data().credits || 0) - winAmount })
              }
              // Write win notification
              tx.set(doc(collection(db, "notifications")), {
                userId: winnerId,
                auctionId: auction.id,
                auctionTitle: aSnap.data().title,
                type: "won",
                message: `You won "${aSnap.data().title}" for $${winAmount}!`,
                read: false,
                createdAt: Date.now(),
              })
            }
          }).catch(() => {})
        }
        clearInterval(interval)
        return
      }

      setIsUrgent(diff < 5 * 60 * 1000)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 0) setTimeLeft(`${h}h ${m}m`)
      else if (m > 0) setTimeLeft(`${m}m ${s}s`)
      else setTimeLeft(`${s}s`)
    }, 1000)
    return () => clearInterval(interval)
  }, [auction])

  const showToast = (msg, type = "error") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const placeBid = async () => {
    const user = auth.currentUser
    if (!user) { showToast("Please login first"); return }
    if (!bid || isNaN(Number(bid))) { showToast("Enter a valid amount"); return }
    if (Number(bid) <= auction.currentBid) { showToast(`Bid must exceed $${auction.currentBid}`); return }
    if (auction.highestBidder === user.uid) { showToast("You already hold the highest bid"); return }

    setLoading(true)
    try {
      const auctionRef = doc(db, "auctions", auction.id)
      const userRef = doc(db, "users", user.uid)

      await runTransaction(db, async (tx) => {
        const [aSnap, uSnap] = await Promise.all([tx.get(auctionRef), tx.get(userRef)])

        if (!aSnap.exists()) throw new Error("Auction not found")
        if (!uSnap.exists()) throw new Error("User not found")

        const aData = aSnap.data()
        const uData = uSnap.data()

        if (aData.ended) throw new Error("Auction has ended")
        if (Number(bid) <= aData.currentBid) throw new Error(`Bid must exceed $${aData.currentBid}`)
        if (uData.credits < Number(bid)) throw new Error(`Insufficient credits (you have ${uData.credits})`)

        const prevBidderId = aData.highestBidder

        // Update auction
        tx.update(auctionRef, {
          currentBid: Number(bid),
          highestBidder: user.uid,
        })

        // Refund previous highest bidder
        if (prevBidderId && prevBidderId !== user.uid) {
          const prevRef = doc(db, "users", prevBidderId)
          const prevSnap = await tx.get(prevRef)
          if (prevSnap.exists()) {
            tx.update(prevRef, {
              credits: (prevSnap.data().credits || 0) + aData.currentBid,
            })
            // Notify outbid user
            tx.set(doc(collection(db, "notifications")), {
              userId: prevBidderId,
              auctionId: auction.id,
              auctionTitle: aData.title,
              type: "outbid",
              message: `You were outbid on "${aData.title}". New leading bid: $${Number(bid)}`,
              read: false,
              createdAt: Date.now(),
            })
          }
        }

        // Add bid record
        tx.set(doc(collection(db, "bids")), {
          auctionId: auction.id,
          bidder: user.uid,
          bidderEmail: user.email,
          amount: Number(bid),
          createdAt: Date.now(),
        })
      })

      setBid("")
      showToast(`Bid of $${bid} placed!`, "success")
    } catch (err) {
      showToast(err.message || "Something went wrong")
    }
    setLoading(false)
  }

  const isEnded = auction.ended || timeLeft === "Ended"

  const toastColors = {
    success: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.35)', color: '#4ade80' },
    error:   { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', color: '#f87171' },
    warn:    { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', color: '#fbbf24' },
  }

  return (
    <div
      className="fade-up"
      style={{
        animationDelay: `${index * 80}ms`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.3s, transform 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          background: toastColors[toast.type].bg,
          border: `1px solid ${toastColors[toast.type].border}`,
          color: toastColors[toast.type].color,
          padding: '8px 16px', borderRadius: '8px', fontSize: '0.78rem',
          zIndex: 20, whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace",
          animation: 'fade-up 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Status badge */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px', zIndex: 5,
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(7,7,8,0.8)', backdropFilter: 'blur(8px)',
        padding: '5px 10px', borderRadius: '20px',
        border: `1px solid ${isEnded ? 'var(--border)' : 'rgba(74,222,128,0.3)'}`,
      }}>
        {!isEnded && <div className="live-dot" />}
        <span style={{
          fontSize: '0.7rem', fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.08em', color: isEnded ? 'var(--text-secondary)' : 'var(--green)',
          textTransform: 'uppercase',
        }}>
          {isEnded ? 'Closed' : 'Live'}
        </span>
      </div>

      {/* Image */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        <img
          src={auction.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'}
          alt={auction.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: isEnded ? 'grayscale(60%) brightness(0.6)' : 'brightness(0.75)',
            transition: 'filter 0.3s',
          }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(to top, var(--bg-card), transparent)',
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700,
          marginBottom: '4px', lineHeight: 1.3, color: 'var(--text-primary)',
        }}>
          {auction.title}
        </h2>

        {auction.description && (
          <p style={{
            fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px',
            lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {auction.description}
          </p>
        )}

        {/* Bid + Timer row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              Current Bid
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.5rem', fontWeight: 500, color: 'var(--gold)', lineHeight: 1 }}>
              ${auction.currentBid?.toLocaleString()}
            </p>
          </div>

          {!isEnded && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                Ends in
              </p>
              <p style={{
                fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 500, lineHeight: 1,
                color: isUrgent ? 'var(--red)' : 'var(--text-primary)',
              }}>
                {timeLeft}
              </p>
            </div>
          )}
        </div>

        {/* Winner banner */}
        {isEnded && auction.highestBidder && (
          <div style={{
            background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border-gold)',
            borderRadius: '10px', padding: '12px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
            <div>
              <p style={{ fontSize: '0.68rem', color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Winning Bid</p>
              <p style={{ fontFamily: "'DM Mono', monospace", color: 'var(--gold)', fontSize: '1rem' }}>
                ${auction.currentBid?.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Bid input */}
        {!isEnded && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem',
              }}>$</span>
              <input
                type="number"
                placeholder={`> ${auction.currentBid}`}
                value={bid}
                onChange={e => setBid(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && placeBid()}
                style={{
                  width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '10px 12px 10px 24px',
                  color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button
              onClick={placeBid}
              disabled={loading}
              style={{
                background: loading ? 'var(--bg-raised)' : 'var(--gold)',
                color: loading ? 'var(--text-secondary)' : '#070708',
                border: 'none', borderRadius: '10px', padding: '10px 18px',
                fontWeight: 600, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--gold-light)' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = 'var(--gold)' }}
            >
              {loading ? '...' : 'Bid'}
            </button>
          </div>
        )}

        {/* Bid History toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: 'var(--text-secondary)', fontSize: '0.75rem',
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <span>{showHistory ? '▲' : '▼'}</span>
          Bid history
        </button>

        {showHistory && <BidHistory auctionId={auction.id} />}
      </div>
    </div>
  )
}

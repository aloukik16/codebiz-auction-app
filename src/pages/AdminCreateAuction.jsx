import { useState } from "react"
import { db } from "../services/firebase"
import { collection, addDoc } from "firebase/firestore"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"

export default function AdminCreateAuction() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [bid, setBid] = useState("")
  const [image, setImage] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const createAuction = async () => {
    if (!title || !bid || !endTime) return
    setLoading(true)
    try {
      await addDoc(collection(db, "auctions"), {
        title,
        description,
        currentBid: Number(bid),
        image: image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80',
        createdAt: Date.now(),
        startTime: startTime ? new Date(startTime).getTime() : Date.now(),
        endTime: new Date(endTime).getTime(),
        ended: false,
        highestBidder: null,
      })
      setSuccess(true)
      setTimeout(() => {
        navigate("/admin")
      }, 1200)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 14px', color: 'var(--text-primary)',
    fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  }
  const labelStyle = {
    display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--text-secondary)',
    marginBottom: '6px', fontFamily: "'DM Mono', monospace",
  }

  const canSubmit = title && bid && endTime && !loading

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Navbar />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px 14px', color: 'var(--text-secondary)',
              fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'DM Mono', monospace",
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--gold-dim)'; e.target.style.color = 'var(--gold)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
          >
            ← Back
          </button>
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>
              ◆ Admin Panel
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
              New Auction
            </h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Form */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem' }}>
            {success && (
              <div style={{
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '10px', padding: '12px 16px', color: 'var(--green)',
                fontSize: '0.82rem', marginBottom: '1.5rem', fontFamily: "'DM Mono', monospace",
              }}>
                ✓ Auction created! Redirecting...
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={labelStyle}>Auction Title *</label>
                <input placeholder="e.g. Vintage MacBook Pro 2019" value={title} onChange={e => setTitle(e.target.value)}
                  style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Describe the item, condition, shipping details..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div>
                <label style={labelStyle}>Starting Bid ($) *</label>
                <input type="number" placeholder="0" value={bid} onChange={e => setBid(e.target.value)}
                  style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <div>
                <label style={labelStyle}>Image URL <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input placeholder="https://..." value={image} onChange={e => setImage(e.target.value)}
                  style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Start Date & Time</label>
                  <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={labelStyle}>End Date & Time *</label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>

              <button
                onClick={createAuction}
                disabled={!canSubmit}
                style={{
                  background: !canSubmit ? 'var(--bg-raised)' : 'var(--gold)',
                  color: !canSubmit ? 'var(--text-muted)' : '#070708',
                  border: 'none', borderRadius: '12px', padding: '14px',
                  fontSize: '0.9rem', fontWeight: 600, cursor: !canSubmit ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.04em', transition: 'all 0.2s', marginTop: '0.5rem',
                }}
                onMouseEnter={e => { if (canSubmit) e.target.style.background = 'var(--gold-light)' }}
                onMouseLeave={e => { if (canSubmit) e.target.style.background = 'var(--gold)' }}
              >
                {loading ? 'Creating...' : 'Publish Auction'}
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', fontFamily: "'DM Mono', monospace" }}>
              Live Preview
            </p>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-gold)',
              borderRadius: '16px', overflow: 'hidden', opacity: title ? 1 : 0.4, transition: 'opacity 0.3s',
            }}>
              <div style={{
                height: '180px',
                background: image ? `url(${image}) center/cover` : 'linear-gradient(135deg, var(--bg-raised) 0%, var(--bg-deep) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!image && <span style={{ color: 'var(--text-muted)', fontSize: '2rem' }}>🖼</span>}
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', marginBottom: '6px' }}>
                  {title || 'Auction Title'}
                </h3>
                {description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                    {description}
                  </p>
                )}
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.4rem', color: 'var(--gold)' }}>
                  ${bid ? Number(bid).toLocaleString() : '0'}
                </p>
                {endTime && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '8px', fontFamily: "'DM Mono', monospace" }}>
                    Ends {new Date(endTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

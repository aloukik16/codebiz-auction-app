import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../services/firebase"
import { useNavigate, Link } from "react-router-dom"
import { doc, setDoc } from "firebase/firestore"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRegister = async () => {
    if (!email || !password) { setError("Fill in all fields"); return }
    if (password.length < 6) { setError("Password must be 6+ characters"); return }
    setLoading(true)
    setError("")
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, "users", user.uid), { email, credits: 100 })
      navigate("/dashboard")
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""))
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', marginBottom: '8px' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold)' }}>Code</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 400, fontStyle: 'italic', color: 'var(--text-primary)' }}>Bidz</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
            Join the Marketplace
          </p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Create account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.8rem' }}>
            You'll receive <span style={{ color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>100 credits</span> to start bidding
          </p>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: 'var(--red)',
              fontSize: '0.82rem',
              marginBottom: '1.2rem',
              fontFamily: "'DM Mono', monospace",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Email', type: 'email', value: email, set: setEmail },
              { label: 'Password', type: 'password', value: password, set: setPassword },
            ].map(({ label, type, value, set }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: "'DM Mono', monospace" }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={e => set(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  style={{
                    width: '100%',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'var(--bg-raised)' : 'var(--gold)',
              color: loading ? 'var(--text-secondary)' : '#070708',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'all 0.2s',
              marginBottom: '1.5rem',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--gold-light)' }}
            onMouseLeave={e => { if (!loading) e.target.style.background = 'var(--gold)' }}
          >
            {loading ? 'Creating account...' : 'Claim Your Credits'}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            Already have an account?{' '}
            <Link to="/" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

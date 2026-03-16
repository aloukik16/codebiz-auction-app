import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { auth, db } from "./services/firebase"
import { doc, getDoc } from "firebase/firestore"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import AdminDashboard from "./pages/AdminDashboard"
import AdminCreateAuction from "./pages/AdminCreateAuction"
import MyBids from "./pages/MyBids"

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setStatus(user ? "authed" : "unauthed")
    })
    return () => unsub()
  }, [])

  if (status === "loading") return <LoadingScreen />
  return status === "authed" ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading")
  const [debugInfo, setDebugInfo] = useState("")

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log("AdminRoute: No user logged in")
        setStatus("unauthed")
        return
      }

      try {
        console.log("AdminRoute: Checking role for UID:", user.uid)
        const snap = await getDoc(doc(db, "users", user.uid))

        if (!snap.exists()) {
          console.log("AdminRoute: User document not found in Firestore")
          setDebugInfo("User document not found in Firestore")
          setStatus("forbidden")
          return
        }

        const data = snap.data()
        console.log("AdminRoute: Full user data:", data)
        console.log("AdminRoute: role value:", data.role)

        if (data.role === "admin") {
          console.log("AdminRoute: ✓ Access granted")
          setStatus("authed")
        } else {
          console.log("AdminRoute: ✗ Denied — role is:", data.role || "undefined/missing")
          setDebugInfo(`role field is "${data.role || "missing"}" — must be exactly "admin"`)
          setStatus("forbidden")
        }
      } catch (err) {
        console.error("AdminRoute error:", err)
        setDebugInfo("Firestore read error: " + err.message)
        setStatus("forbidden")
      }
    })
    return () => unsub()
  }, [])

  if (status === "loading") return <LoadingScreen />
  if (status === "unauthed") return <Navigate to="/" replace />
  if (status === "forbidden") {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-void)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: '16px', padding: '2.5rem', maxWidth: '500px', width: '100%',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.4rem',
            marginBottom: '8px', color: 'var(--text-primary)',
          }}>
            Admin Access Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Your account doesn't have admin privileges.
          </p>

          {debugInfo && (
            <div style={{
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
              fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: '#f87171',
              textAlign: 'left',
            }}>
              Debug: {debugInfo}
            </div>
          )}

          <p style={{
            color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '20px',
            fontFamily: "'DM Mono', monospace", lineHeight: 1.7,
          }}>
            Firebase Console → Firestore → users → your UID<br/>
            Add field: <span style={{ color: 'var(--gold)' }}>role</span> = <span style={{ color: 'var(--gold)' }}>"admin"</span> (string)
          </p>

          <a href="/dashboard" style={{
            display: 'inline-block', background: 'var(--gold)', color: '#070708',
            padding: '10px 24px', borderRadius: '10px', fontWeight: 600,
            fontSize: '0.85rem', textDecoration: 'none',
          }}>
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }
  return children
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-void)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
        color: 'var(--gold)', fontStyle: 'italic', opacity: 0.5,
      }}>
        Loading...
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/my-bids" element={
          <ProtectedRoute><MyBids /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />
        <Route path="/admin/create" element={
          <AdminRoute><AdminCreateAuction /></AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Input, Btn } from "../../components"
import { CheckCircle, HardHat, User } from "lucide-react"

export const Auth = ({ onSuccess }) => {
  const [tab,     setTab]     = useState("signin")
  const [email,   setEmail]   = useState("")
  const [pass,    setPass]    = useState("")
  const [name,    setName]    = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState(false)

  const handle = async () => {
    setError("")
    // Validate all fields before setting loading state (prevents deadlock)
    if (!email || !pass) return setError("Please fill in all fields.")
    if (tab === "signup" && !name) return setError("Please enter your name.")
    setLoading(true)
    try {
      if (tab === "signin") {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (e) throw e
        onSuccess(data.user)
      } else {
        const { error: e } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: name } } })
        if (e) throw e
        setSuccess(true)
      }
    } catch (e) {
      setError(e.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.card, borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: 8 }}><HardHat size={20} color="#fff" /></div>
          <span style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "0.04em" }}>BuildTrack</span>
        </div>
        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={48} color={C.success} style={{ marginBottom: 16 }} />
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Check your email</h2>
            <p style={{ fontFamily: FONT, fontSize: 14, color: C.textMuted, margin: "0 0 20px" }}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            <Btn onClick={() => { setTab("signin"); setSuccess(false) }} variant="outline">Back to Sign In</Btn>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 28 }}>
              {["signin", "signup"].map(t => (
                <button key={t} onClick={() => { setTab(t); setError("") }} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                  cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 700,
                  background: tab === t ? C.card : "transparent",
                  color: tab === t ? C.text : C.textMuted,
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s"
                }}>
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tab === "signup" && <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required icon={User} />}
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required icon={User} />
              <Input label="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
              {error && <p style={{ fontFamily: FONT, fontSize: 13, color: C.danger, margin: 0, background: "#FEE2E2", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}
              <Btn onClick={handle} disabled={loading} size="lg" style={{ marginTop: 4 }}>
                {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create Account"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

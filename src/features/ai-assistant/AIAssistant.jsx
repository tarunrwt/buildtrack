import { useState, useRef, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { FONT, FONT_HEADING, C } from "../../constants/colors"
import { Btn } from "../../components"
import { TopBar } from "../../layout/TopBar"
import { fmt } from "../../utils/formatters"
import { Bot, Send, User, AlertTriangle } from "lucide-react"

const buildAgentContext = (projects, reports, materials = [], issues = []) => {
  if (!projects?.length) return "No project data available."
  const lines = []

  lines.push("=== PROJECTS ===")
  projects.forEach(p => {
    const pct       = p.total_cost > 0 ? Math.round(((p.total_spent || 0) / p.total_cost) * 100) : 0
    const remaining = (p.total_cost || 0) - (p.total_spent || 0)
    lines.push(`Project: ${p.name}`)
    lines.push(`  Status: ${p.status} | Start: ${p.start_date || "N/A"} | Due: ${p.target_end_date || "N/A"}`)
    lines.push(`  Budget: Γé╣${(p.total_cost || 0).toLocaleString("en-IN")} | Spent: Γé╣${(p.total_spent || 0).toLocaleString("en-IN")} | Remaining: Γé╣${remaining.toLocaleString("en-IN")} (${pct}% used)`)
    if (p.area_of_site) lines.push(`  Site Area: ${p.area_of_site} sqft`)
    lines.push("")
  })

  if (reports?.length) {
    lines.push("=== RECENT DAILY PROGRESS REPORTS (last 30) ===")
    reports.slice(0, 30).forEach(r => {
      lines.push(`${r.report_date} | ${r.projects?.name || "Unknown Project"} | Floor: ${r.floor} | Stage: ${r.stage} | Manpower: ${r.manpower_count || 0} | Cost: Γé╣${(r.total_cost || 0).toLocaleString("en-IN")}`)
    })
    lines.push("")
    lines.push("=== REPORTING ACTIVITY (last 7 days) ===")
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    projects.forEach(p => {
      const recentCount = reports.filter(r => r.project_id === p.id && new Date(r.report_date) >= sevenDaysAgo).length
      lines.push(`${p.name}: ${recentCount} DPR(s) in last 7 days${recentCount === 0 ? " ΓÜá NO RECENT REPORTS" : ""}`)
    })
    lines.push("")
  }

  if (materials?.length) {
    lines.push("=== MATERIAL STOCK ===")
    materials.forEach(m => {
      const alert = m.current_stock <= m.min_stock_level ? " ΓÜá LOW STOCK" : ""
      lines.push(`${m.name} (${m.category}): ${m.current_stock} ${m.unit} remaining | Min threshold: ${m.min_stock_level}${alert}`)
    })
    lines.push("")
  }

  lines.push("=== RISK FLAGS ===")
  const risks = []
  projects.forEach(p => {
    const pct = p.total_cost > 0 ? Math.round(((p.total_spent || 0) / p.total_cost) * 100) : 0
    if (pct >= 90)  risks.push(`BUDGET RISK: ${p.name} has used ${pct}% of budget (Γé╣${(p.total_spent || 0).toLocaleString("en-IN")} of Γé╣${(p.total_cost || 0).toLocaleString("en-IN")})`)
    if (pct > 100)  risks.push(`BUDGET OVERRUN: ${p.name} has exceeded budget by Γé╣${((p.total_spent || 0) - (p.total_cost || 0)).toLocaleString("en-IN")}`)
  })
  materials?.forEach(m => {
    if (m.current_stock <= m.min_stock_level)
      risks.push(`LOW STOCK: ${m.name} ΓÇö only ${m.current_stock} ${m.unit} left (min: ${m.min_stock_level})`)
  })
  if (risks.length === 0) risks.push("No critical risks detected at this time.")
  risks.forEach(r => lines.push(r))

  if (issues?.length) {
    lines.push("")
    lines.push("=== ACTIVE SITE ISSUES ===")
    const activeIssues = issues.filter(i => i.status === "open" || i.status === "in_progress")
    activeIssues.forEach(i => {
      lines.push(`${i.reported_date} | Project: ${i.projects?.name} | Priority: ${i.priority} | AI Category: ${i.ai_category}`)
      lines.push(`  Description: ${i.description}`)
    })
    if (activeIssues.length === 0) lines.push("No active site issues.")
    lines.push("")
  }

  return lines.join("\n")
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// PAGE ΓÇö AI Assistant
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const QUICK_ACTIONS = [
  { label: "≡ƒôè Summarise all projects",       prompt: "Give me a concise summary of all my projects ΓÇö current status, budget health, and key progress points." },
  { label: "ΓÜá∩╕Å Flag risks",                   prompt: "Scan all my project data and flag any risks ΓÇö budget overruns, low material stock, projects with no recent DPRs, or anything else that needs attention." },
  { label: "≡ƒôà What needs attention this week?", prompt: "Based on my current project data, what are the top 3ΓÇô5 things I should focus on this week?" },
]

export const AIAssistant = ({ projects, reports, materials, issues, notifications, onMarkAllRead }) => {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `≡ƒæ╖ **BuildTrack AI Assistant** is ready.\n\nI have access to all your project data ΓÇö budgets, daily reports, materials, and stage progress. Ask me anything about your projects, or use the quick actions below.\n\nYou can write in English or Hindi ΓÇö I'll respond in the same language.`
  }])
  const [input,   setInput]   = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput(""); setError("")
    const newMessages = [...messages, { role: "user", content: userText }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const context     = buildAgentContext(projects, reports, materials, issues)
      const apiMessages = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res  = await fetch("https://zdcuroihwhtixolkxgbj.supabase.co/functions/v1/ai-agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, context }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.")
        setMessages(prev => prev.slice(0, -1))
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
      }
    } catch {
      setError("Could not reach the AI service. Check your internet connection and try again.")
      setMessages(prev => prev.slice(0, -1))
    }
    setLoading(false)
  }

  /** Converts minimal markdown (bold) and newlines to safe HTML for dangerouslySetInnerHTML. */
  const renderContent = text =>
    text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>")

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: 0 }}>
      {/* Header */}
      <div style={{ padding: "20px 28px 16px", borderBottom: `1px solid ${C.border}`, background: C.card, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: C.accent, borderRadius: 10, padding: 8, display: "flex" }}><Bot size={20} color="#fff" /></div>
          <div>
            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>AI Assistant</h2>
            <p style={{ fontFamily: FONT, fontSize: 12, color: C.textMuted, margin: 0 }}>Powered by Llama 3.3 via Groq ┬╖ {projects?.length || 0} projects in context</p>
          </div>
        </div>
        <button onClick={() => setMessages([{ role: "assistant", content: "≡ƒæ╖ **BuildTrack AI Assistant** is ready.\n\nI have access to all your project data. Ask me anything or use the quick actions below.\n\nYou can write in English or Hindi." }])}
          style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: "7px 14px", fontFamily: FONT, fontSize: 12, color: C.textMuted, cursor: "pointer", fontWeight: 600 }}>
          Clear chat
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ padding: "14px 28px", borderBottom: `1px solid ${C.border}`, background: C.card, display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => sendMessage(a.prompt)} disabled={loading}
            style={{ background: C.accentLight, border: `1px solid ${C.accent}40`, borderRadius: 20, padding: "6px 14px", fontFamily: FONT, fontSize: 12, color: C.accent, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.5 : 1, transition: "all 0.15s" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Message thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16, background: C.bg }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                <Bot size={14} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: "72%",
              background: m.role === "user" ? C.accent : C.card,
              color: m.role === "user" ? "#fff" : C.text,
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "12px 16px", fontFamily: FONT, fontSize: 13, lineHeight: 1.6,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: m.role === "assistant" ? `1px solid ${C.border}` : "none",
            }} dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={14} color="#fff" /></div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px 16px 16px 4px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, background: C.accent, borderRadius: "50%", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
              <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
            </div>
          </div>
        )}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 16px", fontFamily: FONT, fontSize: 13, color: C.danger, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.border}`, background: C.card, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about your projects, request a summary, or flag risksΓÇª (Enter to send, Shift+Enter for new line)"
            rows={2} disabled={loading}
            style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: C.text, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5, opacity: loading ? 0.6 : 1 }}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            style={{ background: input.trim() && !loading ? C.accent : C.border, border: "none", borderRadius: 12, padding: "10px 16px", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", flexShrink: 0, height: 44 }}>
            <Send size={16} color="#fff" />
          </button>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 11, color: C.textLight, margin: "6px 0 0" }}>
          Press Enter to send ┬╖ Shift+Enter for new line ┬╖ Responds in English or Hindi
        </p>
      </div>
    </div>
  )
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// PROFILE MODAL
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

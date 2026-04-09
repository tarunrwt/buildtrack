/**
 * BuildTrack — Landing Page
 * src/landing/Landing.jsx
 *
 * Fully redesigned premium SaaS landing page.
 * Sections: Nav → Hero → Problem → Features → Dashboard Preview → Stats → CTA → Footer
 * Styling: Tailwind CSS v3 + custom keyframes in landing.css
 * Animations: CSS IntersectionObserver scroll-reveals, word-mask hero text,
 *             count-up numbers, floating cards, orb drift background.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import "./landing.css"

import {
  HardHat, BarChart2, FileText, Package, DollarSign, Users,
  Wrench, Bot, CheckCircle, ArrowRight, ChevronRight, Zap,
  TrendingUp, AlertTriangle, Clock, Shield, Menu, X,
  Building2, Activity, Layers, Camera,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/** Triggers once when element enters viewport. Adds .revealed class. */
const useScrollReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal")
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("revealed") }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/** Count-up animation hook. Returns [displayValue, ref]. */
const useCountUp = (end, duration = 1400) => {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const triggered = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered.current) {
        triggered.current = true
        obs.unobserve(el)
        const start = performance.now()
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 4)
          setValue(Math.round(eased * end))
          if (p < 1) requestAnimationFrame(tick)
          else setValue(end)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])
  return [value, ref]
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────

const LandingNav = ({ onLogin }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  const navLinks = ["Features", "Dashboard"]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-sidebar/95 backdrop-blur-md border-b border-white/8 shadow-lg shadow-black/20"
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md shadow-accent/30">
              <HardHat size={16} color="#fff" />
            </div>
            <span className="font-condensed font-800 text-xl text-white tracking-wide">
              Build<span className="text-accent">Track</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="nav-link text-white/70 hover:text-white text-sm font-barlow font-500 transition-colors duration-150 cursor-pointer">
                {l}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin}
              className="cta-secondary text-sm font-barlow font-600 text-white/80 px-4 py-2 rounded-lg border border-white/15 hover:text-white transition-all duration-150">
              Sign In
            </button>
            <button onClick={onLogin}
              className="cta-primary bg-accent hover:bg-accentDark text-white text-sm font-barlow font-600 px-5 py-2 rounded-lg shadow-md shadow-accent/25 flex items-center gap-1.5">
              Get Started Free
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(o => !o)} className="md:hidden text-white/80 hover:text-white p-1">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-sidebar/98 backdrop-blur-lg border-t border-white/8 px-6 py-4 flex flex-col gap-3">
          {navLinks.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)}
              className="text-white/70 hover:text-white text-sm font-barlow font-500 py-2 transition-colors">
              {l}
            </a>
          ))}
          <button onClick={onLogin}
            className="cta-primary bg-accent text-white text-sm font-600 px-5 py-3 rounded-lg mt-1 flex items-center justify-center gap-2">
            Get Started Free <ArrowRight size={14} />
          </button>
        </div>
      )}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

/** Animated headline: each word slides up with staggered delay */
const AnimatedHeading = ({ lines }) => {
  const [shown, setShown] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShown(true), 100); return () => clearTimeout(t) }, [])
  return (
    <h1 className="font-condensed font-900 text-white leading-none tracking-tight">
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, wi) => (
            <span key={wi} className="word-mask mr-[0.25em] last:mr-0">
              <span style={{
                animationDelay: shown ? `${(li * 3 + wi) * 90}ms` : "0ms",
                animationPlayState: shown ? "running" : "paused",
              }}>
                {word}
              </span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}

/** Floating mini-card overlaid on the hero visual */
const FloatingCard = ({ icon: Icon, label, value, color, className }) => (
  <div className={`glass-card rounded-2xl p-4 shadow-2xl shadow-black/40 ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg" style={{ background: color + "25" }}>
        <Icon size={13} color={color} />
      </div>
      <span className="text-white/60 text-xs font-barlow font-500">{label}</span>
    </div>
    <p className="text-white font-condensed font-700 text-xl leading-none">{value}</p>
  </div>
)

const HeroSection = ({ onLogin }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top)  / rect.height - 0.5) * 20,
    })
  }, [])

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-sidebar hero-grid-bg overflow-hidden flex items-center"
    >
      {/* Orb 1 */}
      <div className="animate-orb-drift absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)" }} />
      {/* Orb 2 */}
      <div className="animate-orb-drift absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(30,58,95,0.8) 0%, transparent 70%)", animationDelay: "6s" }} />
      {/* Orb 3 */}
      <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* LEFT — Copy */}
          <div>
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/25 rounded-full px-4 py-1.5 mb-6"
              style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0ms both" }}>
              <span className="dot-pulse inline-block w-2 h-2 rounded-full bg-accent flex-shrink-0" />
              <span className="text-accent text-xs font-barlow font-600 tracking-wide uppercase">
                Built for India's Construction Industry
              </span>
            </div>

            {/* Headline */}
            <div className="text-5xl md:text-6xl lg:text-7xl mb-6">
              <AnimatedHeading lines={["Kill The", "Paper Trail."]} />
              <div className="mt-1">
                <span className="word-mask font-condensed font-900 text-5xl md:text-6xl lg:text-7xl">
                  <span className="gradient-text" style={{ animationDelay: "540ms" }}>
                    Build
                  </span>
                </span>
                <span className="font-condensed font-900 text-5xl md:text-6xl lg:text-7xl text-white">
                  {" "}Smarter.
                </span>
              </div>
            </div>

            {/* Sub-headline */}
            <p className="text-white/60 text-lg font-barlow font-400 leading-relaxed mb-8 max-w-xl"
              style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 600ms both" }}>
              Submit Daily Progress Reports in 60 seconds. Track real-time budgets,
              labour, materials, and site issues — from ground floor to boardroom.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10"
              style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 750ms both" }}>
              <button onClick={onLogin}
                className="cta-primary animate-pulse-glow bg-accent text-white font-barlow font-700 text-base px-7 py-3.5 rounded-xl shadow-lg shadow-accent/30 flex items-center gap-2">
                Get Started Free
                <ArrowRight size={16} />
              </button>
              <a href="#features"
                className="cta-secondary font-barlow font-600 text-white/75 text-base px-6 py-3.5 rounded-xl border border-white/15 hover:text-white flex items-center gap-2 transition-all">
                See Features
                <ChevronRight size={16} />
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5"
              style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 900ms both" }}>
              {[
                { icon: Shield, text: "Bank-grade security" },
                { icon: Zap,    text: "60-second DPR" },
                { icon: Clock,  text: "Real-time updates" },
              ].map(({ icon: Ic, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-white/50">
                  <Ic size={13} className="text-accent/70" color="#F97316" />
                  <span className="text-xs font-barlow font-500">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Visual */}
          <div className="hidden lg:flex justify-center items-center relative">
            <div
              className="relative"
              style={{ transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`, transition: "transform 0.1s linear" }}>

              {/* Main dashboard card */}
              <div className="glass-card rounded-3xl p-6 w-[420px] shadow-2xl shadow-black/50"
                style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 400ms both" }}>

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white/50 text-xs font-barlow uppercase tracking-widest mb-1">Project Overview</p>
                    <p className="text-white font-condensed font-700 text-lg leading-tight">Skyline Tower — Phase 2</p>
                  </div>
                  <span className="flex items-center gap-1.5 bg-success/15 border border-success/25 text-success text-xs font-600 px-3 py-1 rounded-full">
                    <span className="dot-pulse w-1.5 h-1.5 rounded-full bg-success inline-block" />
                    Active
                  </span>
                </div>

                {/* Budget Bar */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-xs font-barlow font-500">Budget Utilisation</span>
                    <span className="text-accent text-xs font-condensed font-700">68%</span>
                  </div>
                  <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className="bar-fill h-full bg-gradient-to-r from-accent to-orange-400 rounded-full" style={{ width: "68%" }} />
                  </div>
                </div>

                {/* Mini KPI row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Budget",    value: "₹4.2Cr",  color: "#F97316" },
                    { label: "Spent",     value: "₹2.9Cr",  color: "#10B981" },
                    { label: "DPRs",      value: "142",      color: "#3B82F6" },
                  ].map(k => (
                    <div key={k.label} className="bg-white/5 rounded-xl p-3 border border-white/8">
                      <p className="text-white/50 text-[10px] font-barlow uppercase tracking-widest mb-1">{k.label}</p>
                      <p className="font-condensed font-700 text-base" style={{ color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Micro bar chart */}
                <div>
                  <p className="text-white/50 text-[10px] font-barlow uppercase tracking-widest mb-2">Weekly Spend</p>
                  <div className="flex items-end gap-1.5 h-12">
                    {[40, 65, 45, 80, 55, 90, 68].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background: i === 5 ? "#F97316" : "rgba(255,255,255,0.12)",
                          transition: `height 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms`,
                        }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["M","T","W","T","F","S","S"].map((d,i) => (
                      <span key={i} className={`flex-1 text-center text-[9px] font-barlow ${i===5 ? "text-accent" : "text-white/25"}`}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge 1 — DPR submitted */}
              <div className="floating-badge absolute// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM SECTION
// ─────────────────────────────────────────────────────────────────────────────

const ProblemSection = () => {
  const problems = [
    { icon: FileText,      text: "Paper DPRs lost in transit" },
    { icon: AlertTriangle, text: "Cost overruns spotted too late" },
    { icon: Clock,         text: "Hours wasted updating spreadsheets" },
  ]
  const solutions = [
    { icon: FileText,   text: "Digital DPRs in 60 seconds" },
    { icon: TrendingUp, text: "Real-time cost dashboards" },
    { icon: Zap,        text: "Zero manual data entry" },
  ]

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <span className="inline-block bg-danger/10 text-danger text-xs font-barlow font-700 px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            The Problem
          </span>
          <h2 className="font-condensed font-800 text-4xl md:text-5xl text-gray-900 leading-tight">
            Construction runs blind.<br />
            <span className="text-danger">Until it's too late.</span>
          </h2>
        </div>

        {/* Comparison grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Before card */}
          <div className="reveal bg-red-50 border border-red-100 rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center border border-red-200">
                <X size={18} className="text-danger" color="#EF4444" />
              </div>
              <h3 className="font-condensed font-800 text-2xl text-gray-900">Without BuildTrack</h3>
            </div>
            <ul className="space-y-6 stagger">
              {problems.map(({ icon: Ic, text }) => (
                <li key={text} className="reveal flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl border border-red-100 flex items-center justify-center flex-shrink-0 shadow-sm shadow-black/5">
                    <Ic size={16} color="#EF4444" />
                  </div>
                  <span className="text-gray-600 font-barlow text-lg font-500">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After card */}
          <div className="reveal bg-gradient-to-br from-sidebar to-navy border border-sidebar rounded-3xl p-8 md:p-10 relative overflow-hidden group">
            {/* Background flair */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center border border-accent/25">
                <CheckCircle size={18} color="#F97316" />
              </div>
              <h3 className="font-condensed font-800 text-2xl text-white">With BuildTrack</h3>
            </div>
            <ul className="relative z-10 space-y-6 stagger mb-8">
              {solutions.map(({ icon: Ic, text }) => (
                <li key={text} className="reveal flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl border border-accent/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-black/5">
                    <Ic size={16} color="#F97316" />
                  </div>
                  <span className="text-white/90 font-barlow text-lg font-500">{text}</span>
                </li>
              ))}
            </ul>

            {/* Actionable CTA */}
            <div className="relative z-10 pt-6 border-t border-white/10">
              <a href="#features" className="inline-flex items-center gap-2 text-white font-barlow font-600 text-base transition-all group-hover:gap-3 group-hover:text-accent">
                See how it works <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURES SECTION>
              ))}
            </ul>
          </div>

          {/* After card */}
          <div className="reveal bg-gradient-to-br from-sidebar to-navy border border-sidebar rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={16} color="#F97316" />
              </div>
              <h3 className="font-condensed font-700 text-xl text-white">With BuildTrack</h3>
            </div>
            <ul className="space-y-4 stagger">
              {solutions.map(({ icon: Ic, text }) => (
                <li key={text} className="reveal flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent/15 rounded-lg border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Ic size={14} color="#F97316" />
                  </div>
                  <span className="text-white/80 font-barlow text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURES SECTION
// ─────────────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText, title: "Daily Progress Reports",
    desc: "Submit weather, manpower, costs, and photos in under 60 seconds.",
    color: "#F97316", size: "lg",
  },
  {
    icon: DollarSign, title: "Financial Analytics",
    desc: "Live cost burn rate. Zero spreadsheet math.",
    color: "#10B981", size: "sm",
  },
  {
    icon: Bot, title: "AI Site Assistant",
    desc: "Context-aware project Q&A. Get instant answers in English or Hindi.",
    color: "#EC4899", size: "lg",
  },
  {
    icon: Package, title: "Material Inventory",
    desc: "Real-time stock tracking with automated low-stock alerts.",
    color: "#3B82F6", size: "sm",
  },
]

const FeaturesSection = () => (
  <section id="features" className="bg-slate-50 py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-16 reveal">
        <span className="inline-block bg-accent/10 text-accent text-xs font-barlow font-700 px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
          Platform Features
        </span>
        <h2 className="font-condensed font-800 text-4xl md:text-5xl text-gray-900 leading-tight">
          Everything in one<br />
          <span className="gradient-text">command center.</span>
        </h2>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger text-left">
        {features.map(({ icon: Ic, title, desc, color, size }) => (
          <div
            key={title}
            className={`group reveal bento-card bg-white border border-gray-100 rounded-3xl p-8 cursor-pointer transition-all hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1
              ${size === "lg" ? "md:col-span-2" : ""}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: color + "18" }}>
                <Ic size={24} color={color} />
              </div>
              <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" style={{ color }}>
                <ArrowRight size={14} />
              </div>
            </div>
            <h3 className="font-condensed font-800 text-2xl text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 font-barlow text-base leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

const DashboardPreviewSection = () => {
  const [stat1, ref1] = useCountUp(1240)
  const [stat2, ref2] = useCountUp(98)
  const [stat3, ref3] = useCountUp(42)
  const [stat4, ref4] = useCountUp(4200)

  const chartBars = [55, 70, 45, 88, 60, 95, 72, 84, 67, 91, 78, 63]
  const months    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

  return (
    <section id="dashboard" className="bg-sidebar py-24 lg:py-32 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(30,58,95,0.5) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <span className="inline-block bg-accent/15 border border-accent/25 text-accent text-xs font-barlow font-700 px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            Live Dashboard
          </span>
          <h2 className="font-condensed font-800 text-4xl md:text-5xl text-white leading-tight">
            Real-time visibility.<br />
            <span className="gradient-text">Zero guesswork.</span>
          </h2>
          <p className="text-white/55 font-barlow text-lg mt-4 max-w-xl mx-auto">
            Every rupee, every report, every worker — tracked and visualized automatically.
          </p>
        </div>

        {/* Dashboard mock */}
        <div className="reveal glass-card rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/40">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total DPRs Filed",   value: stat1, ref: ref1, suffix: "",    color: "#F97316" },
              { label: "On-Time Delivery",   value: stat2, ref: ref2, suffix: "%",   color: "#10B981" },
              { label: "Active Projects",    value: stat3, ref: ref3, suffix: "",    color: "#3B82F6" },
              { label: "Budget Tracked (₹L)",value: stat4, ref: ref4, suffix: "L+",  color: "#8B5CF6" },
            ].map(k => (
              <div key={k.label} className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <p className="text-white/45 text-[10px] font-barlow uppercase tracking-widest mb-2">{k.label}</p>
                <p ref={k.ref} className="font-condensed font-800 text-3xl" style={{ color: k.color }}>
                  {k.value.toLocaleString("en-IN")}{k.suffix}
                </p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Bar Chart */}
            <div className="md:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-condensed font-700 text-base">Monthly Cost Burn</p>
                  <p className="text-white/45 text-xs font-barlow mt-0.5">Budget vs. Actual — 2025</p>
                </div>
                <span className="flex items-center gap-1.5 text-success text-xs font-barlow font-600">
                  <TrendingUp size={12} color="#10B981" /> +12.4% vs last year
                </span>
              </div>
              <div className="flex items-end gap-2 h-32">
                {chartBars.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm"
                      style={{
                        height: `${h}%`,
                        background: i === 9 ? "#F97316" : i === 11 ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.1)",
                        transition: `height 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms`,
                      }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1.5">
                {months.map((m, i) => (
                  <span key={m} className={`flex-1 text-center text-[8px] font-barlow ${i===9 ? "text-accent" : "text-white/25"}`}>{m}</span>
                ))}
              </div>
            </div>

            {/* Project list */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <p className="text-white font-condensed font-700 text-base mb-4">Active Projects</p>
              <div className="space-y-3">
                {[
                  { name: "Skyline Tower Ph.2",  pct: 68, color: "#F97316" },
                  { name: "Green Valley Villas", pct: 41, color: "#10B981" },
                  { name: "Metro Arcade Block C", pct: 89, color: "#F59E0B" },
                  { name: "Harbor Residences",   pct: 23, color: "#3B82F6" },
                ].map(p => (
                  <div key={p.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/70 text-xs font-barlow truncate max-w-[140px]">{p.name}</span>
                      <span className="text-xs font-condensed font-700 ml-2" style={{ color: p.color }}>{p.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div className="bar-fill h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────────────────────────────────────

/** Single stat — isolated component so useCountUp hook is safe */
const StatItem = ({ value, suffix, label, desc }) => {
  const [display, ref] = useCountUp(value)
  return (
    <div ref={ref} className="reveal text-center">
      <p className="stat-number text-5xl md:text-6xl font-800 mb-2">
        {display.toLocaleString("en-IN")}{suffix}
      </p>
      <p className="font-condensed font-700 text-gray-900 text-base mb-1">{label}</p>
      <p className="font-barlow text-gray-400 text-xs">{desc}</p>
    </div>
  )
}

const StatsSection = () => {
  const stats = [
    { value: 60,   suffix: "s",  label: "Average DPR submission time",   desc: "From any device, any network"    },
    { value: 0,    suffix: "",   label: "Documents lost",                  desc: "Everything is securely stored"  },
    { value: 100,  suffix: "%",  label: "Real-time budget visibility",    desc: "No end-of-month surprises"      },
    { value: 8,    suffix: "+",  label: "Integrated modules",             desc: "One platform, full control"     },
  ]

  return (
    <section className="bg-white py-20 lg:py-28 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 stagger">
          {stats.map(s => <StatItem key={s.label} {...s} />)}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL CTA
// ─────────────────────────────────────────────────────────────────────────────

const FinalCTASection = ({ onLogin }) => (
  <section className="bg-sidebar py-24 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 hero-grid-bg opacity-50" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
      style={{ background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 65%)" }} />

    <div className="relative z-10 max-w-3xl mx-auto px-6 text-center reveal">
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-6 shadow-xl shadow-accent/30">
        <HardHat size={28} color="#fff" />
      </div>

      <h2 className="font-condensed font-900 text-4xl md:text-6xl text-white leading-tight mb-4">
        Ready to transform<br />how you build?
      </h2>
      <p className="text-white/55 font-barlow text-lg mb-10 max-w-xl mx-auto">
        Join construction teams across India who have eliminated paperwork, saved hours
        daily, and stopped flying blind on budgets.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onLogin}
          className="cta-primary bg-accent text-white font-barlow font-700 text-lg px-8 py-4 rounded-xl shadow-2xl shadow-accent/30 flex items-center justify-center gap-2">
          Get Started Free
          <ArrowRight size={18} />
        </button>
        <a href="#features"
          className="cta-secondary font-barlow font-600 text-white/70 text-base px-7 py-4 rounded-xl border border-white/15 hover:text-white transition-all text-center">
          Explore Features
        </a>
      </div>

      <p className="text-white/30 font-barlow text-xs mt-6">
        No credit card required · Free to get started · Setup in 2 minutes
      </p>
    </div>
  </section>
)

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

const LandingFooter = ({ onLogin }) => (
  <footer className="bg-gray-900 border-t border-white/5 py-14">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <HardHat size={14} color="#fff" />
            </div>
            <span className="font-condensed font-800 text-lg text-white tracking-wide">
              Build<span className="text-accent">Track</span>
            </span>
          </div>
          <p className="text-white/40 font-barlow text-sm leading-relaxed">
            Construction progress management for modern India.
          </p>
        </div>

        {/* Links */}
        {[
          { heading: "Platform",  links: ["Dashboard", "DPR Submission", "Financials", "AI Assistant"] },
          { heading: "Company",   links: ["About", "Roadmap", "GitHub"] },
          { heading: "Legal",     links: ["Privacy Policy", "Terms of Service", "MIT License"] },
        ].map(col => (
          <div key={col.heading}>
            <p className="text-white font-condensed font-700 text-sm uppercase tracking-widest mb-3">{col.heading}</p>
            <ul className="space-y-2">
              {col.links.map(l => (
                <li key={l}>
                  <span className="text-white/40 hover:text-white/70 font-barlow text-sm transition-colors cursor-pointer">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-white/30 font-barlow text-xs">
          © 2026 BuildTrack — Built for India's construction industry.
        </p>
        <p className="text-white/20 font-barlow text-xs">MIT License · <a href="https://github.com/tarunrwt/buildtrack" className="hover:text-white/50 transition-colors underline underline-offset-2">GitHub</a></p>
      </div>
    </div>
  </footer>
)

// ─────────────────────────────────────────────────────────────────────────────
// ROOT LANDING COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Landing({ onLogin }) {
  useScrollReveal()

  // Scroll progress indicator
  const [scrollPct, setScrollPct] = useState(0)
  useEffect(() => {
    const handler = () => {
      const el = document.documentElement
      setScrollPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 || 0)
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div className="landing-root">
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 h-0.5 z-[9999] bg-gradient-to-r from-accent to-orange-300 transition-[width] duration-100 pointer-events-none"
        style={{ width: `${scrollPct}%` }} />

      <LandingNav onLogin={onLogin} />
      <HeroSection onLogin={onLogin} />
      <ProblemSection />
      <FeaturesSection />
      <DashboardPreviewSection />
      <StatsSection />
      <FinalCTASection onLogin={onLogin} />
      <LandingFooter onLogin={onLogin} />
    </div>
  )
}

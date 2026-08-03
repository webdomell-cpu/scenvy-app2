import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull, ScenvyLogoIcon } from '@/components/ScenvyLogo'
import { ScenvyAppIcon } from '@/components/ScenvyBrandShowcase'
import { 
  Video, Zap, Sparkles, QrCode, Check, ArrowRight, Play, 
  Smartphone, Globe, BarChart2, ShieldCheck, ChevronRight, 
  Star, ArrowLeft, Clock, Layers, Flame, Target
} from 'lucide-react'

const T = {
  de: {
    back: "Zurück zur Hauptübersicht",
    badge: "SCENVY FLOW",
    title: "SCENVY Flow — Scan the Flow (9:16 Video Marketing)",
    subtitle: "Verwandle passive QR-Code Scans in hochkonvertierende, mobile Social Video-Erlebnisse mit Echtzeit-Angeboten & Countdown-Aktionen.",
    tryBtn: "Scan the Flow starten",
    demoBtn: "Live Reel-Demo ausprobieren",
    
    // Workflow Steps
    stepsTitle: "In 3 einfachen Schritten zu aktiven Gästen",
    stepsSub: "Kein Entwickler nötig. In unter 5 Minuten sind deine Flow-Reels auf den Tischaufstellern deiner Location live.",
    step1Title: "1. Medien hochladen oder KI nutzen",
    step1Desc: "Lade bestehende MP4-Videos, Smartphone-Clips oder Fotos hoch. Oder beschreibe dein Angebot und erstelle dein Reel mit KI.",
    step2Title: "2. Angebote & CTAs konfigurieren",
    step2Desc: "Füge Interaktions-Buttons wie 'Happy Hour sichern', 'Tisch reservieren' oder Countdown-Timer für begrenzte Specials hinzu.",
    step3Title: "3. QR-Codes drucken & Erfolge messen",
    step3Desc: "Drucke den generierten QR-Code für Tische, Theken oder Schaufenster. Verfolge Scans, Watch-Time & Conversions in Echtzeit.",

    // Key Features
    featTitle: "Mächtige Funktionen für moderne Gastronomen & Event-Venues",
    featSub: "Ein einziges Modul. Unendliche Möglichkeiten, deinen Umsatz pro Gast zu steigern.",
    f1Title: "Echtzeit-Angebote & Happy Hour Pushs",
    f1Desc: "Ändere Aktionen sekundenschnell. Starte spontane Flash Sales, wenn das Lokal ruhiger ist, ohne Neudruck von Karten.",
    f2Title: "Eingebauter KI Video & Text Generator",
    f2Desc: "Nutze Claude KI, um verkaufsstarke Schlagzeilen, Farbthemen und Reel-Inhalte auf Knopfdruck generieren zu lassen.",
    f3Title: "Detaillierte Scan- & Conversions-Analytics",
    f3Desc: "Erfahre genau, welche Produkte das meiste Interesse wecken, wie lange Gäste zusehen und welche Angebote gekauft werden.",
    f4Title: "Kein App-Download für deine Gäste",
    f4Desc: "Funktioniert auf jedem iPhone und Android direkt im Browser. Lädt blitzschnell in unter 1 Sekunde.",

    // Call to Action
    ctaTitle: "Verwandle dein Venue in ein vertikales Erlebnis!",
    ctaSub: "Scan the Flow — 30 Tage kostenlos & risikofrei testen.",
    ctaBtn: "Jetzt Scan the Flow aktivieren"
  },
  en: {
    back: "Back to Main Portal",
    badge: "SCENVY FLOW",
    title: "SCENVY Flow — Scan the Flow (9:16 Video Marketing)",
    subtitle: "Turn passive QR code scans into high-converting mobile social video experiences with real-time offers and countdown deals.",
    tryBtn: "Start Scan the Flow",
    demoBtn: "Try Live Reel Demo",
    
    // Workflow Steps
    stepsTitle: "In 3 Easy Steps to Engaged Guests",
    stepsSub: "No developer needed. Get your reels live on your location's table standees in under 5 minutes.",
    step1Title: "1. Upload Media or Use AI",
    step1Desc: "Upload existing MP4 videos, smartphone clips, or photos. Or describe your offer and generate your reel using AI.",
    step2Title: "2. Configure Offers & CTAs",
    step2Desc: "Add interactive call-to-action buttons like 'Claim Happy Hour', 'Reserve Table', or countdown timers for limited specials.",
    step3Title: "3. Print QR Codes & Track Success",
    step3Desc: "Print the generated QR code for tables, bars, or window displays. Track scans, watch time & conversions in real-time.",

    // Key Features
    featTitle: "Powerful Features for Modern Venues & Hospitality",
    featSub: "A single module with endless possibilities to increase your revenue per guest.",
    f1Title: "Real-time Offers & Happy Hour Pushes",
    f1Desc: "Change campaigns in seconds. Launch spontaneous flash sales whenever business is slow without reprinting physical menus.",
    f2Title: "Built-in AI Video & Copy Generator",
    f2Desc: "Leverage Claude AI to generate high-converting headlines, color themes, and reel content at the push of a button.",
    f3Title: "Detailed Scan & Conversion Analytics",
    f3Desc: "Know exactly which products generate the most interest, how long guests watch, and which deals lead to orders.",
    f4Title: "No App Download Required",
    f4Desc: "Works seamlessly on any iPhone or Android natively in the browser with sub-second loading times.",

    // Call to Action
    ctaTitle: "Turn Your Venue into a Vertical Video Experience!",
    ctaSub: "Scan the Flow — 30 days free & risk-free trial.",
    ctaBtn: "Activate Scan the Flow Now"
  }
}

export default function ReelsAddonShowcase() {
  const nav = useNavigate()
  const [lang, setLang] = useState(() => localStorage.getItem('scenvy_lang') || 'de')
  const t = T[lang] || T.de

  return (
    <div style={{ background: C.bg, color: C.white, fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* HEADER NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 66, background: 'rgba(13,13,20,.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={16} /> {t.back}
          </Link>
          <div style={{ width: 1, height: 20, background: C.border }} />
          <ScenvyLogoFull height={35} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
            {[['de', '🇩🇪'], ['en', '🇬🇧']].map(([l, f]) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: lang === l ? C.purple : 'transparent', fontSize: 14 }}>
                {f}
              </button>
            ))}
          </div>

          <button onClick={() => nav('/auth')} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: grad(C.purple, C.pink), color: C.white, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {t.tryBtn} →
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ padding: '70px 5% 50px', maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `${C.purple}22`, border: `1px solid ${C.purple}55`, padding: '6px 18px', borderRadius: 30, marginBottom: 20 }}>
          <ScenvyAppIcon module="flow" size={26} />
          <span style={{ fontSize: 11, fontWeight: 800, color: C.purple, letterSpacing: 1.5 }}>{t.badge}</span>
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
          {t.title}
        </h1>

        <p style={{ fontSize: 17, color: C.muted, maxWidth: 760, margin: '0 auto 36px', lineHeight: 1.6 }}>
          {t.subtitle}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={() => nav('/auth?mode=register')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: grad(C.purple, C.pink), color: C.white, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 20px ${C.purple}55` }}>
            {t.tryBtn} →
          </button>

          <button onClick={() => nav('/l/demo')} style={{ padding: '14px 28px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Play size={16} fill={C.white} /> {t.demoBtn}
          </button>
        </div>
      </section>

      {/* WORKFLOW STEPS */}
      <section style={{ padding: '60px 5%', background: `${C.card}44`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>{t.stepsTitle}</h2>
            <p style={{ fontSize: 15, color: C.muted }}>{t.stepsSub}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: <Sparkles size={24} color={C.purple} />, title: t.step1Title, desc: t.step1Desc },
              { icon: <Zap size={24} color={C.pink} />, title: t.step2Title, desc: t.step2Desc },
              { icon: <QrCode size={24} color="#00E676" />, title: t.step3Title, desc: t.step3Desc },
            ].map((step, idx) => (
              <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEY FEATURES */}
      <section style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 12 }}>{t.featTitle}</h2>
            <p style={{ fontSize: 15, color: C.muted }}>{t.featSub}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { icon: <Flame color={C.pink} size={22} />, title: t.f1Title, desc: t.f1Desc },
              { icon: <Sparkles color={C.purple} size={22} />, title: t.f2Title, desc: t.f2Desc },
              { icon: <BarChart2 color="#FF9500" size={22} />, title: t.f3Title, desc: t.f3Desc },
              { icon: <Smartphone color="#00E676" size={22} />, title: t.f4Title, desc: t.f4Desc }
            ].map((item, idx) => (
              <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
                <div style={{ marginBottom: 14 }}>{item.icon}</div>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ padding: '80px 5%', textAlign: 'center', background: `linear-gradient(180deg, ${C.card}00 0%, ${C.card}aa 100%)`, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>{t.ctaTitle}</h2>
          <p style={{ fontSize: 16, color: C.muted, marginBottom: 32 }}>{t.ctaSub}</p>
          <button onClick={() => nav('/auth?mode=register')} style={{ padding: '16px 36px', borderRadius: 12, border: 'none', background: grad(C.purple, C.pink), color: C.white, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 4px 20px ${C.purple}55` }}>
            {t.ctaBtn} →
          </button>
        </div>
      </section>
    </div>
  )
}

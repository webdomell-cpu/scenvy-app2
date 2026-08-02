import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SG_TOKENS, C } from '@/tokens'
import { ScenvyModuleIcon, ScenvyFlowIcon, ScenvyMenuIcon, ScenvyBoardIcon, ScenvyHostIcon, ScenvyStoreIcon, ScenvyLinkIcon, ScenvyMagicIcon } from '@/components/ScenvyIcons'
import { Sparkles, ArrowRight, Copy, Check, Layers, Smartphone, Monitor, Shield, Zap, CheckCircle2 } from 'lucide-react'

export default function StyleGuide() {
  const [copied, setCopied] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const copySnippet = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2500)
  }

  const cssVariablesCode = `:root {
  --bg-primary: #0B0F14;
  --bg-secondary: #121821;
  --text-primary: #FFFFFF;
  --text-muted: #A0A8B8;
  --border-soft: rgba(255, 255, 255, 0.08);
  --gradient-primary: linear-gradient(135deg, #4F8CFF 0%, #7A5CFF 100%);
  --gradient-accent: linear-gradient(135deg, #FF4FD8 0%, #FF8A4F 100%);
}`

  return (
    <div style={{ background: '#0B0F14', color: '#FFFFFF', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#121821', sticky: 'top', top: 0, zIndex: 100, padding: '16px 5%' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScenvyFlowIcon size={36} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>SCENVY STYLE GUIDE</div>
              <div style={{ fontSize: 11, color: '#A0A8B8' }}>Copy-Paste Ready Webflow & React Design System</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/dashboard" style={{ color: '#A0A8B8', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Dashboard</Link>
            <Link to="/" style={{ color: '#A0A8B8', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Landing Page</Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 120px' }}>
        
        {/* Intro */}
        <section style={{ marginBottom: 60, background: '#121821', padding: 36, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'linear-gradient(135deg, #4F8CFF 0%, #7A5CFF 100%)', opacity: 0.15, filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 12, fontWeight: 800, color: '#4F8CFF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> Webflow Style Guide System v2.5
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, marginBottom: 16, lineHeight: 1.1 }}>
            The Operating System Style Guide
          </h1>
          <p style={{ fontSize: 18, color: '#A0A8B8', maxWidth: 780, lineHeight: 1.6, marginBottom: 24 }}>
            Systematischer Aufbau aller UI-Komponenten, CSS-Variablen, Typografie-Klassen, Card-Systeme und SVG-Brandings für die gesamte SCENVY Plattform.
          </p>
          <button
            onClick={() => copySnippet(cssVariablesCode, 'vars')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4F8CFF 0%, #7A5CFF 100%)', color: '#FFF', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 24px rgba(79, 140, 255, 0.3)' }}
          >
            {copied === 'vars' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            <span>{copied === 'vars' ? 'Variables Copied!' : 'Copy CSS Variables'}</span>
          </button>
        </section>

        {/* 1. COLORS & VARIABLES */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#A0A8B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>02. Colors & Variables</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Global Color Variables</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 32 }}>
            <div style={{ background: '#121821', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ height: 60, borderRadius: 10, background: '#0B0F14', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>bg-primary</div>
              <div style={{ fontSize: 13, color: '#A0A8B8' }}>#0B0F14 (Base Dark Background)</div>
            </div>

            <div style={{ background: '#121821', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ height: 60, borderRadius: 10, background: '#121821', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>bg-secondary</div>
              <div style={{ fontSize: 13, color: '#A0A8B8' }}>#121821 (Card / Container Surface)</div>
            </div>

            <div style={{ background: '#121821', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ height: 60, borderRadius: 10, background: 'linear-gradient(135deg, #4F8CFF 0%, #7A5CFF 100%)', marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>gradient-primary</div>
              <div style={{ fontSize: 13, color: '#A0A8B8' }}>Blue (#4F8CFF) → Purple (#7A5CFF)</div>
            </div>

            <div style={{ background: '#121821', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ height: 60, borderRadius: 10, background: 'linear-gradient(135deg, #FF4FD8 0%, #FF8A4F 100%)', marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>gradient-accent</div>
              <div style={{ fontSize: 13, color: '#A0A8B8' }}>Pink (#FF4FD8) → Orange (#FF8A4F)</div>
            </div>
          </div>

          {/* Module Icons */}
          <div style={{ background: '#121821', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>SCENVY CI Module SVG Vector Icons</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <ScenvyFlowIcon size={44} />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: '#8B5CF6' }}>FLOW</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScenvyMenuIcon size={44} />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: '#F97316' }}>MENU</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScenvyBoardIcon size={44} />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: '#3B82F6' }}>BOARD</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScenvyHostIcon size={44} />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: '#10B981' }}>HOST</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScenvyStoreIcon size={44} />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: '#EC4899' }}>STORE</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScenvyLinkIcon size={44} />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: '#06B6D4' }}>LINK</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <ScenvyMagicIcon size={44} />
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: '#F59E0B' }}>MAGIC</div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. TYPOGRAPHY SYSTEM */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#A0A8B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>03. Typography System</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Headings & Paragraphs</h2>

          <div style={{ background: '#121821', padding: 32, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 4 }}>heading-h1 (64px / Bold)</div>
              <h1 style={{ fontSize: 64, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>The Operating System</h1>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 4 }}>heading-h2 (48px / Bold)</div>
              <h2 style={{ fontSize: 48, fontWeight: 800, margin: 0, lineHeight: 1.15 }}>Create & Manage Experiences</h2>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 4 }}>heading-h3 (28px / Medium)</div>
              <h3 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Smart Digital Signage & TV Display Sync</h3>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 4 }}>text-large (18px)</div>
              <p style={{ fontSize: 18, color: '#A0A8B8', margin: 0, lineHeight: 1.6 }}>
                Automate gastro guest engagement with AI-powered video reels, instant QR menus, and dynamic table service concierges.
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 4 }}>text-base (16px) & text-small (14px)</div>
              <p style={{ fontSize: 16, color: '#FFF', margin: '0 0 8px' }}>Standard text body block for platform dashboards and interactive components.</p>
              <p style={{ fontSize: 14, color: '#A0A8B8', margin: 0 }}>Subtext, helper descriptions, and secondary metadata captions.</p>
            </div>
          </div>
        </section>

        {/* 3. BUTTON SYSTEM */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#A0A8B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>04. Button System</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Interactive Controls & Hover States</h2>

          <div style={{ background: '#121821', padding: 32, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            {/* Primary Button */}
            <div>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 8 }}>button-primary</div>
              <button style={{ padding: '14px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #4F8CFF 0%, #7A5CFF 100%)', color: '#FFF', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(79, 140, 255, 0.35)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span>Get Started Now</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Secondary Button */}
            <div>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 8 }}>button-secondary</div>
              <button style={{ padding: '14px 24px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span>Explore Features</span>
              </button>
            </div>

            {/* Accent Button */}
            <div>
              <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 8 }}>button-accent</div>
              <button style={{ padding: '14px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #FF4FD8 0%, #FF8A4F 100%)', color: '#FFF', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255, 79, 216, 0.35)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} />
                <span>AI Reel Generator</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4. CARD SYSTEM */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#A0A8B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>05. Card System</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Base & Feature Cards</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Feature Card 1 */}
            <div className="card-feature" style={{ background: '#121821', padding: 28, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
              <ScenvyFlowIcon size={40} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>SCENVY FLOW</h3>
              <p style={{ fontSize: 14, color: '#A0A8B8', lineHeight: 1.6, marginBottom: 20 }}>
                Automatisierte Video & Story Reels für Gastronomie, Events und Sonderaktionen.
              </p>
              <a href="#flow" style={{ color: '#8B5CF6', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>Mehr erfahren</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Feature Card 2 */}
            <div className="card-feature" style={{ background: '#121821', padding: 28, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
              <ScenvyMenuIcon size={40} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>SCENVY MENU</h3>
              <p style={{ fontSize: 14, color: '#A0A8B8', lineHeight: 1.6, marginBottom: 20 }}>
                Smarte digitale Speisekarte mit KI-Erkennung, Allergenfiltern und Multilingualer Übersetzung.
              </p>
              <a href="#menu" style={{ color: '#F97316', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>Speisekarte ansehen</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Feature Card 3 */}
            <div className="card-feature" style={{ background: '#121821', padding: 28, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
              <ScenvyBoardIcon size={40} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>SCENVY BOARD</h3>
              <p style={{ fontSize: 14, color: '#A0A8B8', lineHeight: 1.6, marginBottom: 20 }}>
                Echtzeit-Synchronisation für TV-Displays, Digital Signage Screens und Gäste-Monitore.
              </p>
              <a href="#board" style={{ color: '#3B82F6', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>Displays steuern</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </section>

        {/* 5. REUSABLE COMPONENTS */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#A0A8B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>08. Reusable Components</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>Device Mockup & CTA Block</h2>

          {/* CTA Block */}
          <div style={{ background: 'linear-gradient(135deg, rgba(79,140,255,0.15) 0%, rgba(122,92,255,0.15) 100%)', border: '1px solid rgba(79,140,255,0.3)', padding: 40, borderRadius: 24, textAlignment: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <h3 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Bereit für die Zukunft der Gastronomie?</h3>
            <p style={{ fontSize: 16, color: '#A0A8B8', maxWidth: 600, margin: 0 }}>
              Starten Sie noch heute risikofrei mit SCENVY FLOW, Speisekarten-Scan und QR-Steuerung.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <button style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #4F8CFF 0%, #7A5CFF 100%)', color: '#FFF', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                Jetzt kostenlos starten
              </button>
            </div>
          </div>

          {/* Device Mockup */}
          <div style={{ background: '#121821', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 280, height: 560, background: '#000', borderRadius: 36, border: '8px solid #1e293b', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 24, background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: 60, height: 4, borderRadius: 2, background: '#334155' }} />
              </div>
              <div style={{ flex: 1, background: 'linear-gradient(160deg, #1a0533 0%, #3d1168 55%, #0b0f14 100%)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ScenvyFlowIcon size={24} />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>Demo Reel</span>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>50% Off Cocktails</div>
                  <div style={{ fontSize: 11, color: '#A0A8B8', marginBottom: 12 }}>Happy Hour Daily 17-19h</div>
                  <div style={{ padding: '10px 16px', borderRadius: 10, background: '#8B5CF6', textAlign: 'center', fontWeight: 800, fontSize: 12 }}>
                    An der Bar bestellen
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

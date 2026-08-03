import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull, ScenvyLogoIcon } from '@/components/ScenvyLogo'
import { ScenvyAppIcon } from '@/components/ScenvyBrandShowcase'
import { 
  Utensils, Sparkles, QrCode, FileText, Check, ArrowRight, Video, 
  Smartphone, Upload, Globe, Zap, BarChart2, ShieldCheck, Play, 
  ChevronRight, Layers, Award, Star, Download, Menu, X, ArrowLeft
} from 'lucide-react'

// i18n Inline
const T = {
  de: {
    back: "Zurück zur Übersicht",
    badge: "SCENVY MENU",
    title: "SCENVY Menu — Gastronomie & Restaurant Add-on",
    subtitle: "Verwandle deine Speisekarte, PDF oder Tafel-Fotos mit KI in ein faszinierendes 9:16 Video-Reel Erlebnis & Tisch-QR-Code (inkl. SCENVY SNAP).",
    tryBtn: "Jetzt im Dashboard testen",
    demoBtn: "Live-Erlebnis ansehen",
    
    // Workflow Steps
    stepsTitle: "So funktioniert das Add-on Schritt für Schritt",
    stepsSub: "In nur 4 einfachen Schritten wird deine Speisekarte digital zum Umsatz-Booster.",
    step1Title: "1. Speisekarte hochladen oder fotografieren",
    step1Desc: "Lade deine bestehende PDF-Speisekarte hoch oder mache einfach ein Foto deiner Speisekarte, Tageskarte oder Kreidetafel.",
    step2Title: "2. KI-Analyse & WYSIWYG Editor",
    step2Desc: "Unsere KI liest Gerichte, Beschreibungen, Preise & Allergene automatisch aus. Passe alle Details bequem im Live-WYSIWYG-Editor an.",
    step3Title: "3. Dual-Links & QR-Code Erstellung",
    step3Desc: "Erhalte automatisch 2 Links & QR-Codes: Einen für das 9:16 Video-Reel Highlight und einen für das komplette digitale Web-Menü.",
    step4Title: "4. Autarke HTML-Datei & QR-Aufsteller",
    step4Desc: "Lade die komplette Speisekarte als autarke single index.html herunter oder drucke QR-Tischaufsteller für deine Gäste.",

    // Dual Mode Section
    dualTitle: "Maximale Flexibilität: Duale Links & QR-Codes",
    dualSub: "Du musst dich nicht entscheiden – du bekommst automatisch beide Formate für jeden Tisch und Kanal:",
    dual1Title: "🎬 Link 1: 9:16 Video Reel Experience",
    dual1Desc: "Faszinierendes, vertikales Story-Format mit Musik & Animationen. Perfekt für Social Media, Instagram Stories, Tisch-Aufsteller & Impulskäufe.",
    dual2Title: "📖 Link 2: Komplettes Digitales Web-Menü",
    dual2Desc: "Interaktives, vollwertiges Web-Menü mit Kategorien, Allergene-Filter, Fotos & Kontakttasten. Funktioniert ultraschnell auf jedem Smartphone.",
    htmlTitle: "📄 Single-File Standalone HTML-Export",
    htmlDesc: "Möchtest du volle Unabhängigkeit? Lade deine Speisekarte als eine einzige, autarke index.html-Datei herunter und hoste sie beliebig ohne Abhängigkeiten.",

    // Demo Simulator
    simTitle: "Interaktive Vorschau",
    simSub: "Wähle eine Gastronomie-Kategorie und erlebe, wie deine Gäste die Speisekarte am Tisch sehen:",
    catItalian: "🍕 Trattoria & Pizza",
    catBurger: "🍔 Burger & Grill",
    catSushi: "🍣 Sushi & Asian",
    
    // Guide Section
    guideTitle: "Detaillierte Anleitung für Gastronomen",
    guideSub: "So nutzt du den AI Speisekarten Generator optimal in deinem Betrieb:",
    g1Title: "1. Aktivierung im Scenvy Dashboard",
    g1Desc: "Navigiere im Dashboard in der linken Menüleiste auf 'AI Speisekarte'. Das Add-on ist für alle Pro- & Enterprise-Tenants direkt freigeschaltet.",
    g2Title: "2. Dokument verarbeiten & Gerichte anpassen",
    g2Desc: "Nutze den WYSIWYG-Editor, um Gerichte anzupassen, Fotos auszuwechseln, Tagesempfehlungen zu markieren oder Preise spontan zu ändern.",
    g3Title: "3. QR-Codes & Druckmedien exportieren",
    g3Desc: "Lade druckfertige PDF-Vorlagen mit deinen individuellen Tisch-QR-Codes herunter. Jeder Tisch kann einen eigenen QR-Code erhalten.",
    g4Title: "4. Live-Analytics & Beliebte Gerichte einsehen",
    g4Desc: "Verfolge im Dashboard live, welche Gerichte wie oft angesehen werden und welche Reels die höchste Aufmerksamkeit bei Gästen erzeugen.",

    // Benefits
    benefitsTitle: "Warum Restaurants das AI Reel Add-on lieben",
    b1Title: "30% mehr Umsatz bei Desserts & Drinks",
    b1Desc: "Visuelle Video-Reels wecken nachweislich mehr Appetit als reiner Text.",
    b2Title: "Keine Sprachbarrieren mehr",
    b2Desc: "Gäste aus aller Welt lesen die Speisekarte automatisch in ihrer Sprache.",
    b3Title: "Keine App-Installation nötig",
    b3Desc: "Öffnet direkt im mobilen Browser mit unter 0,8 Sekunden Ladezeit.",
    b4Title: "Echtzeit-Anpassungen",
    b4Desc: "Ausverkauftes Gericht? Ändere es in 5 Sekunden im Dashboard – ohne Neudruck.",

    // Call to Action
    ctaTitle: "Bereit für die Zukunft der Gastronomie?",
    ctaSub: "Testen Sie den AI Speisekarten Reel Generator heute noch unverbindlich.",
    ctaBtn: "Add-on im Dashboard starten"
  },
  en: {
    back: "Back to Overview",
    badge: "EXCLUSIVE GASTRONOMY ADD-ON",
    title: "AI Menu Reel Generator",
    subtitle: "Transform your printed menu, PDF or chalkboard photos into an engaging 9:16 Video Reel experience & Table QR code using AI.",
    tryBtn: "Try in Dashboard Now",
    demoBtn: "View Live Experience",
    
    // Workflow Steps
    stepsTitle: "How the Add-on works step-by-step",
    stepsSub: "Turn your traditional menu into a revenue-boosting digital reel & web-menu experience in 4 easy steps.",
    step1Title: "1. Upload or Snap Your Menu",
    step1Desc: "Upload your existing PDF menu or take a photo of your printed menu, daily specials board or chalkboard.",
    step2Title: "2. AI Analysis & WYSIWYG Editor",
    step2Desc: "Our AI automatically extracts dishes, prices & allergens. Fine-tune any details using our live WYSIWYG editor.",
    step3Title: "3. Dual Links & QR Code Generation",
    step3Desc: "Get 2 links & QR codes automatically: One for the 9:16 Video Reel highlight and one for the full digital web menu.",
    step4Title: "4. Standalone HTML Export & Table Standees",
    step4Desc: "Download your entire menu as a single autarkic index.html file or print QR table standees for your guests.",

    // Dual Mode Section
    dualTitle: "Maximum Flexibility: Dual Links & QR Codes",
    dualSub: "No need to choose — you get both formats automatically for every table and marketing channel:",
    dual1Title: "🎬 Link 1: 9:16 Video Reel Experience",
    dual1Desc: "Engaging vertical story format with music & animations. Ideal for social media, Instagram stories & impulse purchases.",
    dual2Title: "📖 Link 2: Full Digital Web Menu",
    dual2Desc: "Interactive full web menu with categories, allergen filters, dish photos & direct contact buttons. Loads lightning fast on any phone.",
    htmlTitle: "📄 Single-File Standalone HTML Export",
    htmlDesc: "Want total hosting independence? Export your menu as a single autarkic index.html file to host anywhere without external dependencies.",

    // Demo Simulator
    simTitle: "Interactive Preview",
    simSub: "Select a cuisine style to test what guests experience on their smartphones:",
    catItalian: "🍕 Trattoria & Pizza",
    catBurger: "🍔 Burger & Grill",
    catSushi: "🍣 Sushi & Asian",

    // Guide Section
    guideTitle: "Comprehensive Guide for Restaurant Owners",
    guideSub: "How to get the most out of the AI Menu Generator in your daily business:",
    g1Title: "1. Activation in Scenvy Dashboard",
    g1Desc: "Navigate to 'AI Menu' in the left menu bar of your dashboard. The add-on is unlocked for all Pro & Enterprise tenants.",
    g2Title: "2. Document Processing & Editing",
    g2Desc: "Use the live WYSIWYG editor to adjust items, replace dish photos, feature daily specials, or update prices on the fly.",
    g3Title: "3. QR Code & Print Export",
    g3Desc: "Download print-ready PDF templates containing your custom table QR codes. Each table can have its unique tracked QR code.",
    g4Title: "4. Live Analytics & Guest Preferences",
    g4Desc: "Track in real-time which dishes are viewed most frequently and which video reels drive the highest guest engagement.",

    // Benefits
    benefitsTitle: "Why Restaurants Love the AI Reel Add-on",
    b1Title: "+30% Sales Boost on Desserts & Drinks",
    b1Desc: "Mouth-watering video reels trigger emotional cravings far better than static text.",
    b2Title: "Zero Language Barriers",
    b2Desc: "International guests automatically view the menu translated into their language.",
    b3Title: "No App Download Required",
    b3Desc: "Opens instantly in any mobile web browser in under 0.8 seconds.",
    b4Title: "Real-time Menu Updates",
    b4Desc: "Sold out of a special? Update it in 5 seconds from your phone without reprinting.",

    // Call to Action
    ctaTitle: "Ready for the Future of Dining?",
    ctaSub: "Test the AI Menu Reel Generator today inside your Scenvy workspace.",
    ctaBtn: "Launch Add-on in Dashboard"
  }
}

// Sample Data for Live Simulator
const SIMULATOR_DATA = {
  italian: {
    restaurant: "Trattoria Bella Vista",
    dish: "Trüffel Tagliolini & Parmigiano",
    price: "18,90 €",
    desc: "Frische Eiernudeln geschwenkt in Salbeibutter, serviert im echten Parmigiano-Laib mit frischem schwarzem Sommertrüffel.",
    tags: ["🌱 Vegetarisch", "🍷 Weintipp: Barolo", "⭐ Chef's Special"],
    videoUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80"
  },
  burger: {
    restaurant: "Smash & Smoke Craft Burgers",
    dish: "Double Truffle Smash Burger",
    price: "15,50 €",
    desc: "Zwei kross gebratene Black Angus Smash Patties, doppelt Cheddar, getrüffelte Mayo, krosser Bio-Bacon im Brioche Bun.",
    tags: ["🔥 Hot Seller", "🥓 Double Bacon", "🍺 Craft Beer Match"],
    videoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
  },
  sushi: {
    restaurant: "Oishii Asian & Omakase",
    dish: "Dragon Roll Flambé Special",
    price: "21,00 €",
    desc: "Tempura Garnelen, Avocado, umhüllt mit flambiertem Lachs, Unagi-Sauce, Keta-Kaviar und frischem Schnittlauch.",
    tags: ["🍣 Signature Roll", "🔥 Flambiert", "🌶️ Mild Spicy"],
    videoUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80"
  }
}

export default function MenuAddonShowcase() {
  const nav = useNavigate()
  const [lang, setLang] = useState(() => localStorage.getItem('scenvy_lang') || (navigator.language?.startsWith('de') ? 'de' : 'en'))
  const [selectedCat, setSelectedCat] = useState('italian')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const t = T[lang]
  const currentSim = SIMULATOR_DATA[selectedCat]

  return (
    <div style={{ background: C.bg, color: C.white, fontFamily: "'Inter', sans-serif", minHeight: '100vh', overflowX: 'hidden', paddingBottom: 80 }}>
      <style>{`
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulseGlow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }

        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-toggle { display: flex !important; }
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
          .hero-actions { justify-content: center !important; }
          .simulator-container { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .guide-grid { grid-template-columns: 1fr !important; }
          .benefits-grid { grid-template-columns: 1fr !important; }
        }

        @media (min-width: 901px) {
          .mobile-nav-toggle { display: none !important; }
        }
      `}</style>

      {/* HEADER / NAVIGATION */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 66, background: 'rgba(13,13,20,.95)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => nav('/')}>
          <ScenvyLogoFull height={40} />
        </div>

        {/* Desktop Navigation Right */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <ArrowLeft size={16} /> {t.back}
          </button>
          
          <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
            {[['de','🇩🇪'],['en','🇬🇧']].map(([l,f]) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: lang===l?C.purple:'transparent', fontSize: 15, fontFamily: 'inherit' }}>
                {f}
              </button>
            ))}
          </div>

          <button onClick={() => nav('/auth?mode=register')} style={{ background: grad(C.purple, C.pink), color: C.white, border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Utensils size={16} /> {t.tryBtn}
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="mobile-nav-toggle" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 2 }}>
            {[['de','🇩🇪'],['en','🇬🇧']].map(([l,f]) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '3px 6px', borderRadius: 5, border: 'none', cursor: 'pointer', background: lang===l?C.purple:'transparent', fontSize: 13, fontFamily: 'inherit' }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer', padding: 6 }}>
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 66, left: 0, right: 0, bottom: 0, background: 'rgba(13,13,20,0.98)', backdropFilter: 'blur(20px)', zIndex: 995, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button onClick={() => { setMobileMenuOpen(false); nav('/'); }} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.white, borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            <ArrowLeft size={18} /> {t.back}
          </button>
          <button onClick={() => { setMobileMenuOpen(false); nav('/auth?mode=register'); }} style={{ background: grad(C.purple, C.pink), color: C.white, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
            {t.tryBtn}
          </button>
        </div>
      )}

      {/* HERO SECTION */}
      <section style={{ paddingTop: 120, paddingBottom: 60, paddingLeft: '5%', paddingRight: '5%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 100, left: '10%', width: 500, height: 500, background: C.purple, borderRadius: '50%', filter: 'blur(160px)', opacity: 0.15, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 200, right: '10%', width: 450, height: 450, background: C.pink, borderRadius: '50%', filter: 'blur(160px)', opacity: 0.15, pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 50, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `${C.purple}22`, border: `1px solid ${C.purple}55`, borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
              <ScenvyAppIcon module="menu" size={26} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.pink, letterSpacing: 1 }}>{t.badge}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
              {t.title}
            </h1>

            <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 540 }}>
              {t.subtitle}
            </p>

            <div className="hero-actions" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={() => nav('/auth?mode=register')} style={{ background: grad(C.purple, C.pink), color: C.white, border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 30px ${C.purple}55` }}>
                <Utensils size={18} /> {t.tryBtn}
              </button>
              <a href="#simulator" style={{ background: C.card, color: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Play size={16} fill={C.white} /> {t.demoBtn}
              </a>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.6)', width: '100%', maxWidth: 420 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: grad(C.purple, C.pink), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Utensils size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Scenvy AI Engine</div>
                    <div style={{ fontSize: 11, color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} /> Ready to scan
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 10, background: `${C.pink}33`, color: C.pink, padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>9:16 REEL</span>
              </div>

              {/* Sample Upload Card */}
              <div style={{ background: '#0D0D14', borderRadius: 16, border: `1px dashed ${C.purple}`, padding: 20, textAlign: 'center', marginBottom: 16 }}>
                <FileText size={32} color={C.purple} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Speisekarte_2026.pdf</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>12 Gerichte erkannt • 4 Kategorien • DE/EN</div>
              </div>

              {/* Processing Progress Bar */}
              <div style={{ background: `${C.purple}22`, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${C.purple}44` }}>
                <Sparkles size={20} color={C.pink} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <span>KI Video Generation</span>
                    <span style={{ color: C.pink }}>100% Complete</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: C.card, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: grad(C.purple, C.pink) }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DUAL LINKS & STANDALONE HTML SECTION */}
      <section style={{ padding: '80px 5%', background: `${C.purple}08`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: 11, color: C.pink, fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>DUAL FORMAT OUTPUT</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 900, marginBottom: 12 }}>{t.dualTitle}</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 640, margin: '0 auto' }}>{t.dualSub}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {/* Card 1: Reel Link */}
            <div style={{ background: C.card, border: `1px solid ${C.purple}55`, borderRadius: 24, padding: 28, position: 'relative' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.purple}22`, color: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Video size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: C.white }}>{t.dual1Title}</h3>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>{t.dual1Desc}</p>
              <div style={{ background: '#0D0D14', padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 11, color: C.purple, fontWeight: 700 }}>
                https://scenvy.app/m/demo?view=reel
              </div>
            </div>

            {/* Card 2: Digital Web Menu */}
            <div style={{ background: C.card, border: `1px solid ${C.pink}55`, borderRadius: 24, padding: 28, position: 'relative' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.pink}22`, color: C.pink, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Globe size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: C.white }}>{t.dual2Title}</h3>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>{t.dual2Desc}</p>
              <div style={{ background: '#0D0D14', padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 11, color: C.pink, fontWeight: 700 }}>
                https://scenvy.app/m/demo?view=menu
              </div>
            </div>

            {/* Card 3: Standalone HTML Export */}
            <div style={{ background: C.card, border: `1px solid ${C.blue}55`, borderRadius: 24, padding: 28, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.blue}22`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <FileText size={24} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: C.white }}>{t.htmlTitle}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>{t.htmlDesc}</p>
              </div>
              <div>
                <div style={{ background: '#0D0D14', padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 12 }}>
                  scenvy-digital-menu.html (Autarkic Single-File)
                </div>
                <button
                  onClick={() => {
                    const sampleHtml = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SCENVY Standalone Digital Menu</title><style>body{margin:0;padding:20px;background:#0d0d14;color:#fff;font-family:sans-serif;text-align:center;}h1{color:#8B5CF6;}.item{background:#1a1a24;padding:16px;margin:10px 0;border-radius:12px;border:1px solid #333;}.price{color:#EC4899;font-weight:bold;}</style></head><body><h1>Trattoria Bella Vista</h1><p>Digitales Menü – Autarke Single-File Version</p><div class="item"><h3>Pizza Margherita</h3><p>Frische Tomatensauce, Mozzarella & Basilikum</p><div class="price">€9.50</div></div><div class="item"><h3>Pasta Carbonara</h3><p>Guanciale, Eigelb, Pecorino & schwarzer Pfeffer</p><div class="price">€13.90</div></div><script>console.log("SCENVY Standalone Menu loaded successfully.");</script></body></html>`;
                    const blob = new Blob([sampleHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'scenvy-digital-menu.html';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: C.blue, color: C.white, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Download size={14} /> Sample Single-File HTML Downloaden
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section style={{ padding: '80px 5%', background: `${C.card}44`, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>WORKFLOW & PROCESS</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 900, marginBottom: 12 }}>{t.stepsTitle}</h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 600, margin: '0 auto' }}>{t.stepsSub}</p>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { num: "01", icon: <Upload size={24} color={C.purple} />, title: t.step1Title, desc: t.step1Desc },
              { num: "02", icon: <Globe size={24} color={C.pink} />, title: t.step2Title, desc: t.step2Desc },
              { num: "03", icon: <Video size={24} color={C.blue} />, title: t.step3Title, desc: t.step3Desc },
              { num: "04", icon: <QrCode size={24} color={C.green} />, title: t.step4Title, desc: t.step4Desc }
            ].map((st, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, position: 'relative' }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.dim, opacity: 0.3, position: 'absolute', top: 16, right: 20 }}>{st.num}</div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#0D0D14', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {st.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{st.title}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE SIMULATOR */}
      <section id="simulator" style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>INTERAKTIVE DEMO</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 900, marginBottom: 12 }}>{t.simTitle}</h2>
            <p style={{ fontSize: 16, color: C.muted }}>{t.simSub}</p>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
            {[
              { id: 'italian', label: t.catItalian },
              { id: 'burger', label: t.catBurger },
              { id: 'sushi', label: t.catSushi }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setSelectedCat(tab.id)}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: 12, 
                  border: `1px solid ${selectedCat === tab.id ? C.purple : C.border}`, 
                  background: selectedCat === tab.id ? `${C.purple}22` : C.card, 
                  color: selectedCat === tab.id ? C.white : C.muted, 
                  fontWeight: 700, 
                  fontSize: 14, 
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Simulator Box */}
          <div className="simulator-container" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 40, alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 28, padding: 36 }}>
            {/* Phone Frame */}
            <div style={{ margin: '0 auto', width: 280, height: 530, background: '#000', borderRadius: 36, border: '6px solid #2A2A38', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              {/* Phone Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 18, background: '#2A2A38', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, zIndex: 10 }} />

              {/* Reel Image / Video Mock */}
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <img src={currentSim.videoUrl} alt={currentSim.dish} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Gradient Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)' }} />

                {/* Top Bar */}
                <div style={{ position: 'absolute', top: 28, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 12, backdropFilter: 'blur(8px)', color: C.white }}>
                    {currentSim.restaurant}
                  </div>
                  <div style={{ fontSize: 10, background: C.purple, padding: '3px 8px', borderRadius: 8, fontWeight: 800 }}>LIVE REEL</div>
                </div>

                {/* Bottom Dish Info */}
                <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 5 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {currentSim.tags.map((tg, idx) => (
                      <span key={idx} style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: C.white }}>
                        {tg}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: 18, fontWeight: 900, color: C.white, marginBottom: 4 }}>{currentSim.dish}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.pink, marginBottom: 8 }}>{currentSim.price}</div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4, marginBottom: 12 }}>{currentSim.desc}</p>

                  <button style={{ width: '100%', padding: '10px 0', background: grad(C.purple, C.pink), border: 'none', borderRadius: 10, color: C.white, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    🛒 Jetzt am Tisch bestellen
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Description */}
            <div>
              <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>AUTOMATION DETAILS</div>
              <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>{currentSim.dish}</h3>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
                {currentSim.desc}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
                <div style={{ background: '#0D0D14', padding: 16, borderRadius: 14, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Erkanntes Gericht</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>100% Präzise KI</div>
                </div>
                <div style={{ background: '#0D0D14', padding: 16, borderRadius: 14, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Ladezeit am Tisch</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.green }}>&lt; 0.8 Sekunden</div>
                </div>
              </div>

              <button onClick={() => nav('/auth?mode=register')} style={{ background: grad(C.purple, C.pink), color: C.white, border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                {t.ctaBtn} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED USER GUIDE / ANLEITUNG */}
      <section style={{ padding: '80px 5%', background: `${C.card}33`, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{ fontSize: 11, color: C.purple, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>SCHRITT-FÜR-SCHRITT HANDBUCH</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 900, marginBottom: 12 }}>{t.guideTitle}</h2>
            <p style={{ fontSize: 16, color: C.muted }}>{t.guideSub}</p>
          </div>

          <div className="guide-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {[
              { num: "01", icon: <Utensils size={22} color={C.purple} />, title: t.g1Title, desc: t.g1Desc },
              { num: "02", icon: <FileText size={22} color={C.pink} />, title: t.g2Title, desc: t.g2Desc },
              { num: "03", icon: <QrCode size={22} color={C.blue} />, title: t.g3Title, desc: t.g3Desc },
              { num: "04", icon: <BarChart2 size={22} color={C.green} />, title: t.g4Title, desc: t.g4Desc }
            ].map((g, idx) => (
              <div key={idx} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, display: 'flex', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0D0D14', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {g.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: C.white }}>{g.title}</h3>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS GRID */}
      <section style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>VORTEILE FÜR GASTRONOMEN</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 900, marginBottom: 12 }}>{t.benefitsTitle}</h2>
          </div>

          <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {[
              { title: t.b1Title, desc: t.b1Desc, icon: <Zap size={22} color={C.purple} /> },
              { title: t.b2Title, desc: t.b2Desc, icon: <Globe size={22} color={C.pink} /> },
              { title: t.b3Title, desc: t.b3Desc, icon: <Smartphone size={22} color={C.blue} /> },
              { title: t.b4Title, desc: t.b4Desc, icon: <ShieldCheck size={22} color={C.green} /> }
            ].map((b, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0D0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {b.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{b.title}</h4>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section style={{ padding: '80px 5%', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: `linear-gradient(135deg, ${C.card} 0%, rgba(124,58,237,0.15) 100%)`, border: `1px solid ${C.purple}55`, borderRadius: 32, padding: '50px 30px', boxShadow: `0 20px 60px ${C.purple}33` }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: grad(C.purple, C.pink), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Utensils size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, marginBottom: 16 }}>{t.ctaTitle}</h2>
          <p style={{ fontSize: 16, color: C.muted, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>{t.ctaSub}</p>
          <button onClick={() => nav('/auth?mode=register')} style={{ background: grad(C.purple, C.pink), color: C.white, border: 'none', borderRadius: 12, padding: '16px 36px', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 10px 30px ${C.purple}55` }}>
            {t.ctaBtn}
          </button>
        </div>
      </section>
    </div>
  )
}

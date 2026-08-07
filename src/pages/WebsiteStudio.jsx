import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { useAuth } from '@/lib/AuthContext'
import { AppLauncherBar } from '@/components/AppLauncherBar'
import { 
  Globe, Layout, Code, Sparkles, Plus, Save, Trash2, Eye, ExternalLink, 
  Settings, Type, Palette, MoveUp, MoveDown, Check, ArrowLeft, RefreshCw, 
  Sliders, Copy, Monitor, Smartphone, Layers, Play, Zap, FileText, CheckCircle
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore'

// Default template pages if firestore is empty
const INITIAL_TEMPLATES = [
  {
    id: 'page_main_landing',
    slug: 'hauptseite',
    title: 'SCENVY Haupt-Landing-Page',
    description: 'Offizielle Landingpage für Gäste, Venues und Partner mit Video-Reel Showcase.',
    isPublished: true,
    theme: {
      bg: '#0A0A10',
      text: '#F3F4F6',
      accent: '#7C3AED',
      fontFamily: 'Inter, sans-serif',
      fontSizeScale: 1.0,
      customCss: `/* Custom CSS & Keyframe Animationen */
@keyframes floatGlow {
  0% { transform: translateY(0px); filter: drop-shadow(0 10px 20px rgba(124,58,237,0.3)); }
  50% { transform: translateY(-8px); filter: drop-shadow(0 20px 30px rgba(255,45,141,0.5)); }
  100% { transform: translateY(0px); filter: drop-shadow(0 10px 20px rgba(124,58,237,0.3)); }
}
.animated-hero-title {
  animation: floatGlow 4s ease-in-out infinite;
}
`
    },
    blocks: [
      {
        id: 'b1',
        type: 'hero',
        kicker: 'DIE ZUKUNFT DES VENUE-MARKETINGS',
        title: 'Verwandle jeden Ort in ein scrollbares Erlebnis.',
        subtitle: 'SCENVY verwandelt QR-Codes in TikTok-artige vertikale Reels. Echtzeit-Angebote & KI-Inhalte ohne App-Download.',
        ctaText: 'Jetzt Kostenlos Ausprobieren →',
        ctaLink: '/auth',
        secondaryCtaText: 'Live Demo Ansehen',
        secondaryCtaLink: '#demo',
        fontSize: 32,
        paddingY: 48,
        bgGradient: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(255,45,141,0.1) 100%)'
      },
      {
        id: 'b2',
        type: 'features',
        title: 'Was SCENVY einzigartig macht',
        subtitle: 'Ein System. Alle Werkzeuge für maximale Gäste-Interaktion.',
        fontSize: 24,
        paddingY: 36,
        items: [
          { title: 'Interactive Reels', desc: 'TikTok-artige Vollbild-Videos direkt im mobilen Web-Browser.' },
          { title: 'Live Happy Hour Push', desc: 'Spontane Deals in unter 60 Sekunden auf alle Gästebildschirme streamen.' },
          { title: 'KI Content Creator', desc: 'Generiere fesselnde Marketing-Reels per Knopfdruck mit KI.' }
        ]
      },
      {
        id: 'b3',
        type: 'cta',
        title: 'Bereit deinen Umsatz zu steigern?',
        subtitle: 'Über 2.000 Venues vertrauen bereits auf das SCENVY Ecosystem.',
        ctaText: 'Jetzt Standort Registrieren →',
        ctaLink: '/auth',
        fontSize: 28,
        paddingY: 40
      }
    ]
  },
  {
    id: 'page_sommer_special',
    slug: 'sommer-event-2026',
    title: 'Sommer Rooftop & Cocktail Night',
    description: 'Aktions-Landing-Page für das Sommer-Event mit exklusiven Vorbestellungen.',
    isPublished: true,
    theme: {
      bg: '#0F0E17',
      text: '#FFFFFE',
      accent: '#FF2D8D',
      fontFamily: 'Inter, sans-serif',
      fontSizeScale: 1.1,
      customCss: `/* Pulsierender Button */
@keyframes pulseBtn {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,45,141,0.7); }
  70% { transform: scale(1.03); box-shadow: 0 0 0 15px rgba(255,45,141,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,45,141,0); }
}
.pulse-cta { animation: pulseBtn 2s infinite; }`
    },
    blocks: [
      {
        id: 'sb1',
        type: 'hero',
        kicker: 'EXKLUSIVES PROMO-EVENT',
        title: 'Summer Rooftop Lounge & Live DJ',
        subtitle: 'Genieße 2-for-1 Signature Cocktails, Live House Beats und den besten Sonnenuntergang der Stadt.',
        ctaText: 'Tisch & V.I.P. Pass Sichern →',
        ctaLink: '#booking',
        fontSize: 34,
        paddingY: 52,
        bgGradient: 'linear-gradient(135deg, rgba(255,45,141,0.25) 0%, rgba(249,115,22,0.15) 100%)'
      }
    ]
  }
]

export default function WebsiteStudio() {
  const nav = useNavigate()
  const { user, tenant } = useAuth()
  
  const [pages, setPages] = useState([])
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [activeTab, setActiveTab] = useState('editor') // 'editor' | 'code' | 'settings' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'mobile'
  const [isSaving, setIsSaving] = useState(false)
  const [notifyMsg, setNotifyMsg] = useState('')
  const [showNewPageModal, setShowNewPageModal] = useState(false)
  
  // Form for new page
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')

  // Selected Page State
  const currentPage = pages.find(p => p.id === selectedPageId) || pages[0]

  useEffect(() => {
    loadPages()
  }, [])

  const triggerNotify = (msg) => {
    setNotifyMsg(msg)
    setTimeout(() => setNotifyMsg(''), 3500)
  }

  const loadPages = async () => {
    try {
      const snap = await getDocs(collection(db, 'custom_pages'))
      if (!snap.empty) {
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPages(loaded)
        if (!selectedPageId && loaded.length > 0) {
          setSelectedPageId(loaded[0].id)
        }
      } else {
        setPages(INITIAL_TEMPLATES)
        setSelectedPageId(INITIAL_TEMPLATES[0].id)
      }
    } catch (e) {
      console.warn('Firestore fallback to local initial templates:', e)
      setPages(INITIAL_TEMPLATES)
      setSelectedPageId(INITIAL_TEMPLATES[0].id)
    }
  }

  const savePagesToBackend = async (updatedPagesList) => {
    setIsSaving(true)
    try {
      for (const p of updatedPagesList) {
        await setDoc(doc(db, 'custom_pages', p.id), {
          ...p,
          updatedAt: new Date().toISOString()
        })
      }
      triggerNotify('✅ Alle Webseiten & Landing-Pages erfolgreich im Backend gespeichert!')
    } catch (e) {
      console.error('Save error:', e)
      triggerNotify('💾 Lokal aktualisiert (Backend-Hinweis: ' + e.message + ')')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreatePage = async (e) => {
    e.preventDefault()
    if (!newPageTitle.trim()) return
    const slug = (newPageSlug || newPageTitle).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const newPageObj = {
      id: 'page_' + Date.now(),
      slug: slug || 'seite-' + Date.now(),
      title: newPageTitle,
      description: 'Neue benutzerdefinierte Landing-Page.',
      isPublished: true,
      theme: {
        bg: '#0A0A10',
        text: '#F3F4F6',
        accent: '#7C3AED',
        fontFamily: 'Inter, sans-serif',
        fontSizeScale: 1.0,
        customCss: `/* Neue Custom CSS Styles */\n`
      },
      blocks: [
        {
          id: 'b_' + Date.now(),
          type: 'hero',
          kicker: 'WILLKOMMEN',
          title: newPageTitle,
          subtitle: 'Bearbeite diesen Text direkt im Live-Editor oder füge Custom Animationen hinzu.',
          ctaText: 'Aktion Starten',
          ctaLink: '#',
          fontSize: 30,
          paddingY: 40,
          bgGradient: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(236,72,153,0.15) 100%)'
        }
      ]
    }

    const nextList = [newPageObj, ...pages]
    setPages(nextList)
    setSelectedPageId(newPageObj.id)
    setShowNewPageModal(false)
    setNewPageTitle('')
    setNewPageSlug('')
    await savePagesToBackend(nextList)
  }

  const handleDeletePage = async (pageId) => {
    if (pages.length <= 1) {
      alert('Mindestens eine Seite muss im System erhalten bleiben.')
      return
    }
    if (!confirm('Möchtest du diese Landing-Page wirklich löschen?')) return

    const nextList = pages.filter(p => p.id !== pageId)
    setPages(nextList)
    setSelectedPageId(nextList[0].id)
    try {
      await deleteDoc(doc(db, 'custom_pages', pageId))
      triggerNotify('🗑️ Seite gelöscht.')
    } catch (e) {
      triggerNotify('🗑️ Seite lokal gelöscht.')
    }
  }

  const updateCurrentPage = (updater) => {
    if (!currentPage) return
    const updated = typeof updater === 'function' ? updater(currentPage) : updater
    const nextList = pages.map(p => p.id === currentPage.id ? updated : p)
    setPages(nextList)
  }

  // Block management
  const updateBlock = (blockId, field, value) => {
    updateCurrentPage(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b)
    }))
  }

  const addBlockToPage = (type) => {
    if (!currentPage) return
    let newB = { id: 'b_' + Date.now(), type, fontSize: 24, paddingY: 32 }
    if (type === 'hero') {
      newB = { ...newB, kicker: 'NEUE SEKTION', title: 'Beeindruckender Titel', subtitle: 'Beschreibung der Aktion hier eingeben.', ctaText: 'Mehr Erfahren', ctaLink: '#' }
    } else if (type === 'features') {
      newB = { ...newB, title: 'Unsere Highlights', subtitle: 'Drei starke Argumente', items: [{ title: 'Punkt 1', desc: 'Vorteil A' }, { title: 'Punkt 2', desc: 'Vorteil B' }] }
    } else if (type === 'cta') {
      newB = { ...newB, title: 'Jetzt Starten', subtitle: 'Verpasse keine Angebote mehr.', ctaText: 'Hier Klicken', ctaLink: '#' }
    } else if (type === 'code_embed') {
      newB = { ...newB, title: 'Custom Code / Animation Block', htmlContent: '<div class="custom-widget" style="padding: 20px; background: rgba(124,58,237,0.1); border-radius: 12px; text-align: center; border: 1px solid rgba(124,58,237,0.3);">⚡ Interaktiver Custom Widget Block</div>' }
    }

    updateCurrentPage(prev => ({
      ...prev,
      blocks: [...prev.blocks, newB]
    }))
    triggerNotify('➕ Neuer Block hinzugefügt!')
  }

  const removeBlock = (blockId) => {
    updateCurrentPage(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId)
    }))
  }

  const moveBlock = (index, dir) => {
    if (!currentPage) return
    const nextBlocks = [...currentPage.blocks]
    const targetIndex = index + dir
    if (targetIndex < 0 || targetIndex >= nextBlocks.length) return
    const temp = nextBlocks[index]
    nextBlocks[index] = nextBlocks[targetIndex]
    nextBlocks[targetIndex] = temp
    updateCurrentPage(prev => ({ ...prev, blocks: nextBlocks }))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07090E', color: C.white, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top App Launcher */}
      <AppLauncherBar user={user} tenant={tenant} activePage="website_studio" />

      {/* Main Header Bar */}
      <header style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => nav('/dashboard')}
            style={{ padding: '8px 12px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> Haupt-App
          </button>
          <div>
            <div style={{ fontSize: 11, color: C.purple, fontWeight: 800, letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={14} /> SCENVY WEBSEITEN & LANDING-PAGE STUDIO
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 10 }}>
              Live Visual CMS & Code Editor
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {notifyMsg && (
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green, background: `${C.green}18`, padding: '6px 14px', borderRadius: 20, border: `1px solid ${C.green}44` }}>
              {notifyMsg}
            </div>
          )}

          <button
            onClick={() => setShowNewPageModal(true)}
            style={{ padding: '9px 16px', borderRadius: 10, background: C.bg, border: `1px solid ${C.purple}`, color: C.purple, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} /> Neue Seite Erstellen
          </button>

          <button
            onClick={() => savePagesToBackend(pages)}
            disabled={isSaving}
            style={{ padding: '10px 22px', borderRadius: 10, background: grad(C.purple, C.pink), border: 'none', color: C.white, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 16px ${C.purple}44` }}
          >
            <Save size={16} /> {isSaving ? 'Speichere...' : 'Alle Änderungen Speichern'}
          </button>
        </div>
      </header>

      {/* Main Studio Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 120px)' }}>
        
        {/* Left Sidebar: Page List & Selector */}
        <aside style={{ background: C.card, borderRight: `1px solid ${C.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>
              VERFÜGBARE LANDING-PAGES ({pages.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pages.map(p => {
                const isSel = p.id === currentPage?.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPageId(p.id)}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: isSel ? `${C.purple}22` : C.bg,
                      border: `1px solid ${isSel ? C.purple : C.border}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: isSel ? C.white : C.muted }}>
                        {p.title}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: p.isPublished ? `${C.green}22` : `${C.orange}22`, color: p.isPublished ? C.green : C.orange }}>
                        {p.isPublished ? 'LIVE' : 'ENTWURF'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.dim, fontFamily: 'monospace' }}>
                      /p/{p.slug}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Info Box */}
          <div style={{ marginTop: 'auto', background: C.bg, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.white, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color={C.purple} /> Direkt-Publishing & SEO
            </div>
            Jede hier gespeicherte Landing-Page ist sofort unter <code style={{ color: C.purple }}>/p/{currentPage?.slug}</code> erreichbar und für Suchmaschinen optimiert.
          </div>
        </aside>

        {/* Right Workspace: Editor Tabs & Live Preview */}
        <main style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          
          {currentPage && (
            <>
              {/* Toolbar Header for Current Page */}
              <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.white }}>{currentPage.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Slug: <code style={{ color: C.purple }}>/p/{currentPage.slug}</code></span>
                      <span>•</span>
                      <button
                        onClick={() => updateCurrentPage(p => ({ ...p, isPublished: !p.isPublished }))}
                        style={{ background: 'none', border: 'none', color: currentPage.isPublished ? C.green : C.orange, cursor: 'pointer', fontWeight: 800, fontSize: 12, padding: 0 }}
                      >
                        {currentPage.isPublished ? '● Veröffentlicht (Aktiv)' : '○ Entwurf (Inaktiv)'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor Tab Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.bg, padding: 4, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  {[
                    { id: 'editor', label: '🎨 Visueller Editor', icon: <Layout size={14} /> },
                    { id: 'code', label: '💻 Code & Animationen', icon: <Code size={14} /> },
                    { id: 'settings', label: '⚙️ Einstellungen', icon: <Settings size={14} /> },
                    { id: 'preview', label: '👁️ Live Vorschau', icon: <Eye size={14} /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: activeTab === tab.id ? C.purple : 'transparent',
                        color: activeTab === tab.id ? C.white : C.muted,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Live Link */}
                <a
                  href={`/p/${currentPage.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', padding: '8px 14px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.blue, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={13} /> Landing-Page Aufrufen
                </a>
              </div>

              {/* TAB 1: VISUELLER EDITOR (WYSIWYG & BLOCKS) */}
              {activeTab === 'editor' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                  
                  {/* Left Column: Visual Blocks List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>Seiten-Struktur & Inhaltselemente</div>
                      
                      {/* Add Block Dropdown */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => addBlockToPage('hero')} style={{ padding: '6px 12px', borderRadius: 8, background: `${C.purple}22`, border: `1px solid ${C.purple}`, color: C.purple, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Hero Sektion</button>
                        <button onClick={() => addBlockToPage('features')} style={{ padding: '6px 12px', borderRadius: 8, background: `${C.blue}22`, border: `1px solid ${C.blue}`, color: C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Features Grid</button>
                        <button onClick={() => addBlockToPage('cta')} style={{ padding: '6px 12px', borderRadius: 8, background: `${C.pink}22`, border: `1px solid ${C.pink}`, color: C.pink, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Call-to-Action</button>
                        <button onClick={() => addBlockToPage('code_embed')} style={{ padding: '6px 12px', borderRadius: 8, background: `${C.green}22`, border: `1px solid ${C.green}`, color: C.green, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Custom Code Block</button>
                      </div>
                    </div>

                    {/* Render Each Editable Block */}
                    {currentPage.blocks.map((block, idx) => (
                      <div key={block.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Block Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: C.purple }}>
                            <Layers size={16} /> Block #{idx + 1}: {block.type.toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} style={{ padding: '4px 8px', borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer' }}><MoveUp size={12} /></button>
                            <button onClick={() => moveBlock(idx, 1)} disabled={idx === currentPage.blocks.length - 1} style={{ padding: '4px 8px', borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer' }}><MoveDown size={12} /></button>
                            <button onClick={() => removeBlock(block.id)} style={{ padding: '4px 8px', borderRadius: 6, background: `${C.pink}22`, border: `1px solid ${C.pink}`, color: C.pink, cursor: 'pointer' }}><Trash2 size={12} /></button>
                          </div>
                        </div>

                        {/* Block Form Inputs */}
                        {block.type === 'hero' && (
                          <div style={{ display: 'grid', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>KICKER / OBERTITEL</label>
                              <input type="text" value={block.kicker || ''} onChange={e => updateBlock(block.id, 'kicker', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 13 }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>HAUPTTITEL (ÜBERSCHRIFT)</label>
                              <input type="text" value={block.title || ''} onChange={e => updateBlock(block.id, 'title', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 15, fontWeight: 800 }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>UNTERTITEL / DESCRIPTION</label>
                              <textarea rows={2} value={block.subtitle || ''} onChange={e => updateBlock(block.id, 'subtitle', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 13, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>CTA BUTTON TEXT</label>
                                <input type="text" value={block.ctaText || ''} onChange={e => updateBlock(block.id, 'ctaText', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 12 }} />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>CTA LINK (URL)</label>
                                <input type="text" value={block.ctaLink || ''} onChange={e => updateBlock(block.id, 'ctaLink', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 12 }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {block.type === 'features' && (
                          <div style={{ display: 'grid', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>SEKTIONS-TITEL</label>
                              <input type="text" value={block.title || ''} onChange={e => updateBlock(block.id, 'title', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 14, fontWeight: 800 }} />
                            </div>
                          </div>
                        )}

                        {block.type === 'cta' && (
                          <div style={{ display: 'grid', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>TITEL</label>
                              <input type="text" value={block.title || ''} onChange={e => updateBlock(block.id, 'title', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 14, fontWeight: 800 }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>BUTTON TEXT</label>
                                <input type="text" value={block.ctaText || ''} onChange={e => updateBlock(block.id, 'ctaText', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 12 }} />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>BUTTON LINK</label>
                                <input type="text" value={block.ctaLink || ''} onChange={e => updateBlock(block.id, 'ctaLink', e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.white, fontSize: 12 }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {block.type === 'code_embed' && (
                          <div style={{ display: 'grid', gap: 12 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block' }}>CUSTOM HTML / CODE CONTENT</label>
                            <textarea rows={4} value={block.htmlContent || ''} onChange={e => updateBlock(block.id, 'htmlContent', e.target.value)} style={{ width: '100%', background: '#05070B', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px', color: C.green, fontSize: 12, fontFamily: 'monospace' }} />
                          </div>
                        )}

                        {/* Size & Padding Adjuster (Ding Größe / Abstände ändern) */}
                        <div style={{ background: C.bg, padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Type size={14} color={C.blue} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Schriftgröße (Titel):</span>
                            <button onClick={() => updateBlock(block.id, 'fontSize', Math.max(16, (block.fontSize || 24) - 2))} style={{ padding: '2px 8px', borderRadius: 4, background: C.card, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer' }}>-</button>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.white }}>{block.fontSize || 24}px</span>
                            <button onClick={() => updateBlock(block.id, 'fontSize', Math.min(60, (block.fontSize || 24) + 2))} style={{ padding: '2px 8px', borderRadius: 4, background: C.card, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer' }}>+</button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Sliders size={14} color={C.purple} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Sektions-Abstand (Padding):</span>
                            <button onClick={() => updateBlock(block.id, 'paddingY', Math.max(10, (block.paddingY || 32) - 10))} style={{ padding: '2px 8px', borderRadius: 4, background: C.card, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer' }}>-</button>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.white }}>{block.paddingY || 32}px</span>
                            <button onClick={() => updateBlock(block.id, 'paddingY', Math.min(120, (block.paddingY || 32) + 10))} style={{ padding: '2px 8px', borderRadius: 4, background: C.card, border: `1px solid ${C.border}`, color: C.white, cursor: 'pointer' }}>+</button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Right Column: Style & Theme Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Palette size={16} color={C.pink} /> Design & Farb-Schema
                      </div>

                      <div style={{ display: 'grid', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>HINTERGRUNDFARBE</label>
                          <input type="color" value={currentPage.theme?.bg || '#0A0A10'} onChange={e => updateCurrentPage(p => ({ ...p, theme: { ...p.theme, bg: e.target.value } }))} style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer' }} />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>AKZENTFARBE (BUTTONS & GLOW)</label>
                          <input type="color" value={currentPage.theme?.accent || '#7C3AED'} onChange={e => updateCurrentPage(p => ({ ...p, theme: { ...p.theme, accent: e.target.value } }))} style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer' }} />
                        </div>

                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>TEXTFARBE</label>
                          <input type="color" value={currentPage.theme?.text || '#F3F4F6'} onChange={e => updateCurrentPage(p => ({ ...p, theme: { ...p.theme, text: e.target.value } }))} style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: CODE & ANIMATIONS EDITOR */}
              {activeTab === 'code' && (
                <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Code size={18} color={C.green} /> Custom CSS & Animationen Editor
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Füge individuelle Keyframe-Animationen, Hover-Effekte oder globale CSS-Regeln für diese Landing-Page ein.
                      </div>
                    </div>
                  </div>

                  <textarea
                    rows={16}
                    value={currentPage.theme?.customCss || ''}
                    onChange={e => updateCurrentPage(p => ({ ...p, theme: { ...p.theme, customCss: e.target.value } }))}
                    style={{
                      width: '100%',
                      background: '#05070B',
                      color: '#34D399',
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 13,
                      fontFamily: 'Consolas, Monaco, monospace',
                      lineHeight: 1.5,
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              {/* TAB 3: EINSTELLUNGEN & SEO */}
              {activeTab === 'settings' && (
                <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 24, display: 'grid', gap: 16, maxWidth: 640 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>Seiteneinstellungen & SEO Meta-Daten</div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>SEITENTITEL</label>
                    <input type="text" value={currentPage.title || ''} onChange={e => updateCurrentPage(p => ({ ...p, title: e.target.value }))} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 14 }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>URL SLUG (PFAD)</label>
                    <input type="text" value={currentPage.slug || ''} onChange={e => updateCurrentPage(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 14, fontFamily: 'monospace' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>SEO BESCHREIBUNG (META DESCRIPTION)</label>
                    <textarea rows={3} value={currentPage.description || ''} onChange={e => updateCurrentPage(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13 }} />
                  </div>

                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 10 }}>
                    <button
                      onClick={() => handleDeletePage(currentPage.id)}
                      style={{ padding: '10px 18px', borderRadius: 8, background: `${C.pink}22`, border: `1px solid ${C.pink}`, color: C.pink, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={15} /> Diese Seite unwiderruflich löschen
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: LIVE PREVIEW MODE */}
              {activeTab === 'preview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  {/* Device Switcher */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, padding: 6, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setPreviewDevice('desktop')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: previewDevice === 'desktop' ? C.purple : 'transparent', color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Monitor size={14} /> Desktop (100%)</button>
                    <button onClick={() => setPreviewDevice('mobile')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: previewDevice === 'mobile' ? C.purple : 'transparent', color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Smartphone size={14} /> Mobile View (375px)</button>
                  </div>

                  {/* Render Page Preview Box */}
                  <div style={{
                    width: previewDevice === 'mobile' ? '375px' : '100%',
                    minHeight: '600px',
                    background: currentPage.theme?.bg || '#0A0A10',
                    color: currentPage.theme?.text || '#F3F4F6',
                    borderRadius: 16,
                    border: `1px solid ${C.border}`,
                    padding: 32,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                    transition: 'all 0.3s ease'
                  }}>
                    <style>{currentPage.theme?.customCss || ''}</style>

                    {currentPage.blocks.map(b => (
                      <div key={b.id} style={{ padding: `${b.paddingY || 32}px 0`, textContent: 'center' }}>
                        {b.kicker && <div style={{ fontSize: 12, color: currentPage.theme?.accent || C.purple, fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>{b.kicker}</div>}
                        {b.title && <div className="animated-hero-title" style={{ fontSize: b.fontSize || 32, fontWeight: 900, marginBottom: 12 }}>{b.title}</div>}
                        {b.subtitle && <div style={{ fontSize: 15, opacity: 0.8, maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.6 }}>{b.subtitle}</div>}
                        {b.ctaText && (
                          <a href={b.ctaLink || '#'} className="pulse-cta" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, background: currentPage.theme?.accent || C.purple, color: '#FFF', fontWeight: 800, textDecoration: 'none' }}>
                            {b.ctaText}
                          </a>
                        )}
                        {b.htmlContent && <div dangerouslySetInnerHTML={{ __html: b.htmlContent }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </>
          )}

        </main>

      </div>

      {/* New Page Modal */}
      {showNewPageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, width: '100%', maxWidth: 460 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.white, marginBottom: 6 }}>Neue Landing-Page Erstellen</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Erstelle eine neue eigenständige Unterseite mit eigenem URL-Pfad.</div>

            <form onSubmit={handleCreatePage} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>SEITENTITEL</label>
                <input type="text" placeholder="z.B. Sommer Special Angebot" value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} required style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>URL SLUG (PFAD)</label>
                <input type="text" placeholder="z.B. sommer-special" value={newPageSlug} onChange={e => setNewPageSlug(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 13, fontFamily: 'monospace' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowNewPageModal(false)} style={{ padding: '8px 16px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Abbrechen</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 8, background: C.purple, border: 'none', color: C.white, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>✓ Seite Anlegen</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

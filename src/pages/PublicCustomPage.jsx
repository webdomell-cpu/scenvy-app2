import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { C } from '@/tokens'
import { ScenvyLogoFull } from '@/components/ScenvyLogo'
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react'

export default function PublicCustomPage() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPageData()
  }, [slug])

  const loadPageData = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'custom_pages'), where('slug', '==', slug || 'hauptseite'))
      const snap = await getDocs(q)
      if (!snap.empty) {
        setPage(snap.docs[0].data())
      } else {
        // Fallback for default pages
        if (slug === 'sommer-event-2026') {
          setPage({
            title: 'Sommer Rooftop & Cocktail Night',
            isPublished: true,
            theme: { bg: '#0F0E17', text: '#FFFFFE', accent: '#FF2D8D', customCss: '' },
            blocks: [
              {
                id: 'sb1',
                type: 'hero',
                kicker: 'EXKLUSIVES PROMO-EVENT',
                title: 'Summer Rooftop Lounge & Live DJ',
                subtitle: 'Genieße 2-for-1 Signature Cocktails, Live House Beats und den besten Sonnenuntergang der Stadt.',
                ctaText: 'Tisch & V.I.P. Pass Sichern →',
                ctaLink: '/auth',
                fontSize: 34,
                paddingY: 52
              }
            ]
          })
        } else {
          setPage({
            title: 'SCENVY Ecosystem',
            isPublished: true,
            theme: { bg: '#0A0A10', text: '#F3F4F6', accent: '#7C3AED', customCss: '' },
            blocks: [
              {
                id: 'b1',
                type: 'hero',
                kicker: 'DIE ZUKUNFT DES VENUE-MARKETINGS',
                title: 'Verwandle jeden Ort in ein scrollbares Erlebnis.',
                subtitle: 'SCENVY verwandelt QR-Codes in TikTok-artige vertikale Reels.',
                ctaText: 'Jetzt Ausprobieren →',
                ctaLink: '/auth',
                fontSize: 32,
                paddingY: 48
              }
            ]
          })
        }
      }
    } catch (e) {
      console.warn('Load error fallback:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#0A0A10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!page || !page.isPublished) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A10', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>404 — Seite Nicht Gefunden oder Inaktiv</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Diese Landing-Page ist aktuell nicht veröffentlicht oder existiert nicht.</div>
        <Link to="/" style={{ padding: '10px 20px', borderRadius: 10, background: C.purple, color: '#FFF', textDecoration: 'none', fontWeight: 800 }}>
          Zurück zur Hauptseite
        </Link>
      </div>
    )
  }

  const [lang, setLang] = useState('de')

  return (
    <div style={{ minHeight: '100vh', background: page.theme?.bg || '#0A0A10', color: page.theme?.text || '#F3F4F6', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{page.theme?.customCss || ''}</style>

      {/* Public Header */}
      <header style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,16,0.85)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <ScenvyLogoFull size="md" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Sprachumschalter DE / EN */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
            <button
              onClick={() => setLang('de')}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: lang === 'de' ? C.purple : 'transparent', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              🇩🇪 DE
            </button>
            <button
              onClick={() => setLang('en')}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: lang === 'en' ? C.purple : 'transparent', color: '#FFF', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              🇬🇧 EN
            </button>
          </div>

          <Link to="/auth" style={{ textDecoration: 'none', padding: '9px 18px', borderRadius: 10, background: page.theme?.accent || C.purple, color: '#FFF', fontWeight: 800, fontSize: 13 }}>
            {lang === 'de' ? 'Kostenlos Starten' : 'Get Started Free'}
          </Link>
        </div>
      </header>

      {/* Main Blocks Content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
        {page.blocks?.map((b) => (
          <section key={b.id} style={{ padding: `${b.paddingY || 40}px 0`, textAlign: 'center' }}>
            {b.kicker && (
              <div style={{ fontSize: 12, color: page.theme?.accent || C.purple, fontWeight: 800, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
                {b.kicker}
              </div>
            )}

            {b.title && (
              <h1 className="animated-hero-title" style={{ fontSize: b.fontSize || 34, fontWeight: 900, lineHeight: 1.2, marginBottom: 16, maxWidth: 800, margin: '0 auto 16px' }}>
                {b.title}
              </h1>
            )}

            {b.subtitle && (
              <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 640, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {b.subtitle}
              </p>
            )}

            {b.ctaText && (
              <Link to={b.ctaLink || '/auth'} className="pulse-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, background: page.theme?.accent || C.purple, color: '#FFF', fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                {b.ctaText} <ArrowRight size={16} />
              </Link>
            )}

            {b.type === 'features' && b.items && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 40, textAlign: 'left' }}>
                {b.items.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={18} color={page.theme?.accent || C.purple} /> {item.title}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {b.htmlContent && (
              <div style={{ marginTop: 24 }} dangerouslySetInnerHTML={{ __html: b.htmlContent }} />
            )}
          </section>
        ))}
      </main>

      {/* Public Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 32, textAlign: 'center', fontSize: 12, opacity: 0.6 }}>
        © 2026 SCENVY. Powered by SCENVY Webseiten Studio. Alle Rechte vorbehalten.
      </footer>
    </div>
  )
}

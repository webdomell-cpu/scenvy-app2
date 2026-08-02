import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { fetchLocation, fetchReelsByLocation, recordScan, recordClick } from '@/lib/db'
import { toGuestReel } from '@/storage'
import { ScenvyLogoIcon } from '@/components/ScenvyLogo'
import { Heart, Sparkles, Film, Utensils, Music, Tag, Share2, ArrowRight } from 'lucide-react'

function getDefaultDemoReels(venueName = 'DT-Demo Venue') {
  return [
    {
      id: 'demo-1',
      title: '50% Off Signature Cocktails',
      sub: venueName,
      hook: 'HAPPY HOUR — JETZT AN DER BAR 🍹',
      cta: 'Jetzt Bestellen',
      ctaUrl: '#',
      bg: 'linear-gradient(160deg,#1a0533 0%,#3d1168 55%,#0d0d14 100%)',
      accent: '#7C3AED',
      tag: 'HAPPY HOUR',
      emoji: '🍹',
      mediaUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
      mediaType: 'image',
      duration: 5
    },
    {
      id: 'demo-2',
      title: "Chef's Special Tasting Menu",
      sub: venueName,
      hook: 'TASTING MENU & WINE PAIRING 🍽️',
      cta: 'Speisekarte Ansehen',
      ctaUrl: '#',
      bg: 'linear-gradient(160deg,#33001a 0%,#680d3d 55%,#0d0d14 100%)',
      accent: '#FF2D8D',
      tag: 'SPECIAL',
      emoji: '🍽️',
      mediaUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
      mediaType: 'image',
      duration: 5
    },
    {
      id: 'demo-3',
      title: 'Live DJ Lounge & Terrace Night',
      sub: venueName,
      hook: 'AB 21:00 UHR ON THE ROOFTOP 🎵',
      cta: 'Tisch Reservieren',
      ctaUrl: '#',
      bg: 'linear-gradient(160deg,#071433 0%,#163a68 55%,#0d0d14 100%)',
      accent: '#00D4FF',
      tag: 'TONIGHT',
      emoji: '🎵',
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
      mediaType: 'image',
      duration: 5
    }
  ]
}

export default function GuestView() {
  const { locationId } = useParams()
  const [location, setLocation] = useState(null)
  const [reels, setReels] = useState([])
  const [curr, setCurr] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState({})
  const [mediaError, setMediaError] = useState({})

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const cleanLocId = (locationId || '').trim().toLowerCase()
        const isDemo = cleanLocId === 'demo' || cleanLocId === 'dt-demo' || cleanLocId === 'dt_demo' || cleanLocId === 'dt-demo-gastro'

        if (isDemo) {
          const demoLoc = { name: 'DT-Demo Gastro Venue', address: 'Berlin Gastro Mile 12' }
          setLocation(demoLoc)
          const rData = await fetchReelsByLocation('dt-demo')
          if (!ignore) {
            const mapped = (rData || []).map(toGuestReel).filter(Boolean)
            setReels(mapped.length ? mapped : getDefaultDemoReels('DT-Demo Gastro Venue'))
          }
          setLoading(false)
          return
        }

        const loc = await fetchLocation(locationId)
        if (loc) {
          setLocation(loc)
          recordScan(locationId)
        } else {
          setLocation({ name: 'SCENVY Partner Venue', address: 'Standort Gastro Mile 12' })
        }
        const rData = await fetchReelsByLocation(locationId)
        if (!ignore) {
          const mapped = (rData || []).map(toGuestReel).filter(Boolean)
          setReels(mapped.length ? mapped : getDefaultDemoReels(loc?.name || 'SCENVY Partner Venue'))
        }
      } catch (err) {
        console.error('Error loading guest view:', err)
        if (!ignore) setReels(getDefaultDemoReels('SCENVY Partner Venue'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [locationId])

  // Auto-advance slide timer based on reel duration
  useEffect(() => {
    if (!reels.length || reels.length <= 1) return
    const activeReel = reels[curr] || reels[0]
    const slideDurationSec = activeReel?.duration || 5
    const timer = setTimeout(() => {
      setCurr(prev => (prev + 1) % reels.length)
    }, slideDurationSec * 1000)
    return () => clearTimeout(timer)
  }, [curr, reels])

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#0D0D14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const activeReels = reels.length ? reels : getDefaultDemoReels(location?.name || 'SCENVY Venue')
  const r = activeReels[curr] || activeReels[0]

  const fallbackImages = {
    OFFER: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
    EVENT: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
    MENU: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
    PROMO: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
    'HAPPY HOUR': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
    SPECIAL: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
    TONIGHT: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
    DEFAULT: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop'
  }

  const resolvedFallback = fallbackImages[r?.tag] || fallbackImages[r?.type] || fallbackImages.DEFAULT
  const activeMediaUrl = (mediaError[r?.id] || !r?.mediaUrl) ? resolvedFallback : r.mediaUrl

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0D0D14', color: '#fff', overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: '100%', background: r.bg || 'linear-gradient(160deg,#1a0533 0%,#3d1168 55%,#0d0d14 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 20px 40px', position: 'relative', transition: 'background 0.5s ease' }}>
        {activeMediaUrl && (
          (r.mediaType === 'video' && !mediaError[r.id]) ? (
            <video
              src={activeMediaUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setMediaError(prev => ({ ...prev, [r.id]: true }))}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
            />
          ) : (
            <img
              src={activeMediaUrl}
              alt={r.title}
              onError={() => setMediaError(prev => ({ ...prev, [r.id]: true }))}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }}
            />
          )
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,13,20,0.5) 0%, rgba(13,13,20,0.2) 40%, rgba(13,13,20,0.9) 100%)' }} />

        {/* Top bar & progress */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {activeReels.map((_, i) => (
              <div key={i} onClick={() => setCurr(i)} style={{ flex: 1, height: 3, borderRadius: 2, background: i === curr ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'background 0.3s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ScenvyLogoIcon size={32} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{location?.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{location?.address}</div>
              </div>
            </div>
            <span style={{ background: r.accent || '#7C3AED', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
              {r.tag}
            </span>
          </div>
        </div>

        {/* Action controls / overlay */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ maxWidth: '80%' }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, marginBottom: 8, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {r.title}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>{r.hook}</p>
            {r.ctaUrl && (
              <a
                href={r.ctaUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => recordClick(r.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: r.accent || '#7C3AED', color: '#fff', fontWeight: 800, padding: '14px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              >
                <span>{r.cta}</span>
                <ArrowRight size={16} />
              </a>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <button
              onClick={() => setLiked(l => ({ ...l, [r.id]: !l[r.id] }))}
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: 'none', width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Heart size={20} fill={liked[r.id] ? '#FF2D8D' : 'none'} color={liked[r.id] ? '#FF2D8D' : '#fff'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useRef } from 'react'
import {
  Film,
  Sparkles,
  Play,
  Pause,
  Upload,
  Camera,
  Trash2,
  Share2,
  Copy,
  Eye,
  X,
  RefreshCw,
  Plus,
  CheckCircle2,
  Flame,
  Clock,
  ExternalLink
} from 'lucide-react'
import { C, grad } from '@/tokens'
import { copyToClipboard } from '@/storage'

export default function MobileFlowTab({
  reels = [],
  tenantId,
  tenant,
  saveReel,
  deleteReel,
  notify
}) {
  const [filter, setFilter] = useState('all') // 'all' | 'live' | 'paused'
  const [showCreatorModal, setShowCreatorModal] = useState(false)
  const [previewReel, setPreviewReel] = useState(null)
  const [reelToDelete, setReelToDelete] = useState(null)

  // AI Generator with Vorlage Upload State
  const [genMode, setGenMode] = useState('video') // 'video' | 'image'
  const [offerText, setOfferText] = useState('')
  const [reelType, setReelType] = useState('offer') // 'offer' | 'event' | 'menu' | 'promo'
  const [templateMedia, setTemplateMedia] = useState(null)
  const [templateType, setTemplateType] = useState('image')
  const [templateUseMode, setTemplateUseMode] = useState('both') // 'both' | 'inspiration_only' | 'direct_media'
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progressStep, setProgressStep] = useState('')

  const cameraInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const PRESETS = [
    { label: '🍸 Signature Cocktail', text: '50% auf alle Cocktails zur Happy Hour mit Live-DJ' },
    { label: '🥩 Ribeye Steak Grill', text: 'Zartes Angus Ribeye Steak mit hausgemachten Trüffel-Pommes' },
    { label: '🍕 Steinofen Pizza', text: 'Knusprige Pizza mit frischem Büffel-Mozzarella & Basilikum' },
    { label: '☕ Brunch & Latte Art', text: 'Sonntagsbrunch mit frischen Croissants und Avocado-Schnittchen' },
    { label: '🍔 Double Smash Burger', text: 'Saftiger Beef-Burger mit geschmolzenem Cheddar und Bacon' }
  ]

  const filteredReels = reels.filter(r => {
    if (filter === 'live') return r.status === 'live'
    if (filter === 'paused') return r.status === 'paused' || r.status === 'draft'
    return true
  })

  const liveCount = reels.filter(r => r.status === 'live').length

  const handleTemplateSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingTemplate(true)
    const isVid = file.type?.includes('video') || file.name?.endsWith('.mp4') || file.name?.endsWith('.mov')
    setTemplateType(isVid ? 'video' : 'image')

    const reader = new FileReader()
    reader.onload = (ev) => {
      setTemplateMedia(ev.target?.result)
      setUploadingTemplate(false)
      notify('✅ Vorlage hochgeladen & für KI bereit')
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!offerText.trim() && !templateMedia) {
      notify('⚠️ Bitte Beschreibung eingeben oder Vorlage hochladen')
      return
    }

    setGenerating(true)
    setProgressStep('🤖 SCENVY AI analysiert Text & Vorlage...')
    setTimeout(() => setProgressStep('✨ Generiere Story-Konzept & Hook...'), 1200)
    setTimeout(() => setProgressStep('🎥 Finalisiere 9:16 Visuals & Branding...'), 2400)

    try {
      const isVideo = genMode === 'video'
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: tenant?.name || 'Unser Restaurant',
          offer: offerText || 'Highlight aus Vorlage',
          type: reelType,
          tone: 'exciting',
          isVideo,
          duration: 5,
          userImage: templateUseMode !== 'inspiration_only' ? templateMedia : null,
          referenceImage: templateMedia || null,
          templateUseMode
        })
      })

      if (!res.ok) throw new Error('Generierung fehlgeschlagen')
      const data = await res.json()

      const newReel = {
        tenant_id: tenantId,
        title: data.headline || offerText || 'SCENVY Highlight',
        type: reelType,
        status: 'live',
        imageUrl: data.imageUrl || data.mediaUrl || templateMedia,
        mediaUrl: data.mediaUrl || data.imageUrl || templateMedia,
        mediaType: data.mediaType || (isVideo ? 'video' : 'image'),
        hook: data.hook || 'JETZT ERLEBEN 🔥',
        subtext: data.subtext || `Exklusiv bei ${tenant?.name || 'uns'}`,
        ctaText: data.cta || 'Jetzt ansehen',
        ctaUrl: '',
        duration: data.duration || 5,
        hashtags: data.hashtags || ['scenvy', reelType],
        emoji: data.emoji || (isVideo ? '🎥' : '✨'),
        urgency: data.urgency || '',
        colorMood: data.colorMood || 'purple',
        location_id: 'ALL'
      }

      await saveReel.mutateAsync({ reel: newReel, tenantId })
      setGenerating(false)
      setShowCreatorModal(false)
      setOfferText('')
      setTemplateMedia(null)
      notify('✨ Neues Reel erfolgreich erstellt & live geschaltet!')
    } catch (err) {
      console.warn('Flow AI Gen Fallback:', err)
      const isVideo = genMode === 'video'
      const fallbackVid = 'https://assets.mixkit.co/videos/preview/mixkit-barman-preparing-a-cocktail-in-a-glass-42867-large.mp4'
      const fallbackImg = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=720&auto=format&fit=crop'
      const fallbackMedia = templateMedia || (isVideo ? fallbackVid : fallbackImg)
      const fallbackHeadline = offerText.length > 40 ? offerText.slice(0, 40) + '…' : (offerText || 'Highlight aus Vorlage')

      try {
        const newReel = {
          tenant_id: tenantId,
          title: fallbackHeadline,
          type: reelType,
          status: 'live',
          imageUrl: fallbackMedia,
          mediaUrl: fallbackMedia,
          mediaType: templateType === 'video' ? 'video' : (isVideo ? 'video' : 'image'),
          hook: 'JETZT ENTDECKEN 🔥',
          subtext: `Exklusiv bei ${tenant?.name || 'uns'} – nur für kurze Zeit!`,
          ctaText: 'Jetzt ansehen',
          ctaUrl: '',
          duration: 5,
          hashtags: ['scenvy', reelType, 'highlight'],
          emoji: isVideo ? '🎥' : '✨',
          urgency: 'Nur heute verfügbar',
          colorMood: 'purple',
          location_id: 'ALL'
        }
        await saveReel.mutateAsync({ reel: newReel, tenantId })
        setShowCreatorModal(false)
        setOfferText('')
        setTemplateMedia(null)
        notify('✨ Reel erfolgreich mit Vorlage erstellt & live geschaltet!')
      } catch (saveErr) {
        notify('⚠️ Fehler beim Speichern des Reels')
      }
      setGenerating(false)
    }
  }

  const handleToggleStatus = async (r) => {
    try {
      const nextStatus = r.status === 'live' ? 'paused' : 'live'
      await saveReel.mutateAsync({
        reel: { ...r, status: nextStatus },
        tenantId
      })
      notify(nextStatus === 'live' ? '🟢 Reel jetzt LIVE' : '⚪ Reel pausiert')
    } catch (e) {
      notify('⚠️ Fehler beim Aktualisieren')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteReel.mutateAsync({ id, tenantId })
      notify('🗑️ Reel gelöscht')
      setReelToDelete(null)
    } catch (e) {
      notify('⚠️ Fehler beim Löschen')
      setReelToDelete(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Top Header & Action ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Film size={20} color="#8B5CF6" />
            <span>SCENVY FLOW</span>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            {reels.length} Reels • {liveCount} Live im Gästefeed
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreatorModal(true)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
            color: '#FFF',
            border: 'none',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)'
          }}
        >
          <Sparkles size={15} /> <span>Neues Reel</span>
        </button>
      </div>

      {/* ── Filter Pills ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          ['all', `Alle (${reels.length})`],
          ['live', `🟢 Live (${liveCount})`],
          ['paused', `⚪ Pausiert (${reels.length - liveCount})`]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              border: filter === key ? '1px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.1)',
              background: filter === key ? 'rgba(124, 58, 237, 0.2)' : '#111622',
              color: filter === key ? '#FFF' : '#94A3B8',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Reel Cards Grid ── */}
      {filteredReels.length === 0 ? (
        <div style={{ padding: 36, textAlign: 'center', background: '#111622', borderRadius: 18, border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Keine Reels in diesem Filter</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 16 }}>
            Erstelle vertikale 9:16 Video-Stories mit KI & eigener Vorlage.
          </div>
          <button
            onClick={() => setShowCreatorModal(true)}
            style={{ padding: '10px 18px', borderRadius: 10, background: '#7C3AED', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            Jetzt Reel erstellen
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {filteredReels.map((r) => {
            const isLive = r.status === 'live'
            const isVideo = r.mediaType === 'video' || (r.mediaUrl && r.mediaUrl.endsWith('.mp4'))
            const mediaSrc = r.mediaUrl || r.imageUrl || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=720&auto=format&fit=crop'
            const guestReelUrl = `${window.location.origin}/reel/${r.location_id || r.id || 'all'}`

            return (
              <div
                key={r.id}
                style={{
                  background: '#111622',
                  borderRadius: 16,
                  border: `1px solid ${isLive ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* 9:16 Thumbnail Container */}
                <div
                  onClick={() => setPreviewReel(r)}
                  style={{
                    position: 'relative',
                    aspectRatio: '9/14',
                    background: '#09090E',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  {isVideo ? (
                    <video
                      src={mediaSrc}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                      playsInline
                      loop
                    />
                  ) : (
                    <img
                      src={mediaSrc}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt={r.title}
                    />
                  )}

                  {/* Gradient Overlay for Text Readability */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 100%)' }} />

                  {/* Top Badges */}
                  <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: isLive ? 'rgba(16, 185, 129, 0.9)' : 'rgba(100, 116, 139, 0.85)',
                      color: '#FFF',
                      letterSpacing: 0.5
                    }}>
                      {isLive ? 'LIVE' : 'PAUSIERT'}
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#FFF'
                    }}>
                      {isVideo ? '🎥 5s' : '📸 FOTO'}
                    </span>
                  </div>

                  {/* Bottom Text inside Reel */}
                  <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                    {r.hook && (
                      <div style={{ fontSize: 9.5, fontWeight: 900, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {r.hook}
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', lineHeight: 1.25, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.title || 'Reel Highlight'}
                    </div>
                  </div>

                  {/* Play Icon Hint */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    opacity: 0.85
                  }}>
                    <Play size={18} fill="#FFF" />
                  </div>
                </div>

                {/* Bottom Controls */}
                <div style={{ padding: '10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(r)}
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: isLive ? '#10B981' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {isLive ? 'Pausieren' : 'Aktivieren'}
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => { copyToClipboard(guestReelUrl); notify('🔗 Reel-Link kopiert') }}
                      style={{ padding: 6, borderRadius: 6, background: 'rgba(255, 255, 255, 0.06)', border: 'none', color: '#FFF', cursor: 'pointer' }}
                      title="Link kopieren"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReelToDelete(r)}
                      style={{ padding: 6, borderRadius: 6, background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                      title="Löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: KI REEL CREATOR MIT VORLAGE UPLOAD
          ════════════════════════════════════════════════ */}
      {showCreatorModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            background: '#13131F',
            borderTop: '1px solid rgba(124, 58, 237, 0.4)',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxWidth: 500,
            maxHeight: '92dvh',
            overflowY: 'auto',
            padding: '22px 18px 32px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={18} color="#A78BFA" /> Neues KI Reel erstellen
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                  9:16 Story mit Text + Vorlagen-Upload
                </div>
              </div>
              <button onClick={() => setShowCreatorModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Format Mode: Video vs Image */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setGenMode('video')}
                style={{
                  padding: '10px 8px',
                  borderRadius: 12,
                  border: genMode === 'video' ? '1.5px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: genMode === 'video' ? 'rgba(124, 58, 237, 0.22)' : '#09090E',
                  color: genMode === 'video' ? '#FFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🎥 5s Video-Story
              </button>
              <button
                type="button"
                onClick={() => setGenMode('image')}
                style={{
                  padding: '10px 8px',
                  borderRadius: 12,
                  border: genMode === 'image' ? '1.5px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: genMode === 'image' ? 'rgba(124, 58, 237, 0.22)' : '#09090E',
                  color: genMode === 'image' ? '#FFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                📸 9:16 KI Bild
              </button>
            </div>

            {/* Prompt Text Input */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#CBD5E1', display: 'block', marginBottom: 6 }}>
                THEMA / ANGEBOT / PROMPT *
              </label>
              <textarea
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
                placeholder="z.B. Erfrischender Hugo mit frischer Minze auf unserer Sonnenterrasse..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '11px 13px',
                  borderRadius: 12,
                  background: '#09090E',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFF',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>
                💡 SCHNELLE VORLAGEN:
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOfferText(p.text)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      background: '#09090E',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#CBD5E1',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 📎 UPLOAD ALS VORLAGE (ZUSÄTZLICH ZUM TEXT) */}
            <div style={{
              background: 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: 14,
              padding: 14,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C084FC', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={13} /> UPLOAD ALS VORLAGE (OPTIONAL ZUSÄTZLICH ZUM TEXT)
                </span>
                {templateMedia && (
                  <button
                    type="button"
                    onClick={() => setTemplateMedia(null)}
                    style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✕ Entfernen
                  </button>
                )}
              </div>

              {templateMedia ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#09090E', borderRadius: 10, padding: 8 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                      {templateType === 'video' ? (
                        <video src={templateMedia} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop />
                      ) : (
                        <img src={templateMedia} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Vorlage" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>
                        ✨ Als KI-Vorlage aktiv
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                        Die KI analysiert diese Vorlage multimodal und stimmt Texte & Farben darauf ab.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTemplateUseMode('both')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 8,
                        fontSize: 10.5,
                        fontWeight: templateUseMode === 'both' ? 800 : 500,
                        background: templateUseMode === 'both' ? 'rgba(124, 58, 237, 0.3)' : 'transparent',
                        border: `1px solid ${templateUseMode === 'both' ? '#7C3AED' : 'rgba(255,255,255,0.1)'}`,
                        color: templateUseMode === 'both' ? '#FFF' : '#94A3B8',
                        cursor: 'pointer'
                      }}
                    >
                      🎯 Inspiration & Reel-Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateUseMode('inspiration_only')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 8,
                        fontSize: 10.5,
                        fontWeight: templateUseMode === 'inspiration_only' ? 800 : 500,
                        background: templateUseMode === 'inspiration_only' ? 'rgba(124, 58, 237, 0.3)' : 'transparent',
                        border: `1px solid ${templateUseMode === 'inspiration_only' ? '#7C3AED' : 'rgba(255,255,255,0.1)'}`,
                        color: templateUseMode === 'inspiration_only' ? '#FFF' : '#94A3B8',
                        cursor: 'pointer'
                      }}
                    >
                      💡 Nur als Inspiration
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: 'rgba(124, 58, 237, 0.15)',
                      border: '1px dashed rgba(124, 58, 237, 0.5)',
                      color: '#FFF',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Camera size={16} color="#C084FC" /> Foto knipsen
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px dashed rgba(255, 255, 255, 0.18)',
                      color: '#FFF',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Upload size={16} color="#94A3B8" /> Foto / Video wählen
                  </button>

                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleTemplateSelected} style={{ display: 'none' }} />
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleTemplateSelected} style={{ display: 'none' }} />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                color: '#FFF',
                border: 'none',
                fontWeight: 900,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.5)'
              }}
            >
              {generating ? (
                <>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{progressStep || 'Generiere Reel mit KI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Reel jetzt mit KI generieren →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: FULLSCREEN REEL PREVIEW PLAYER
          ════════════════════════════════════════════════ */}
      {previewReel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: 430, maxHeight: 920, overflow: 'hidden' }}>
            {previewReel.mediaType === 'video' || (previewReel.mediaUrl && previewReel.mediaUrl.endsWith('.mp4')) ? (
              <video
                src={previewReel.mediaUrl || previewReel.imageUrl}
                autoPlay
                playsInline
                loop
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={previewReel.imageUrl || previewReel.mediaUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt={previewReel.title}
              />
            )}

            {/* Gradient Overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />

            {/* Close Button */}
            <button
              onClick={() => setPreviewReel(null)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                zIndex: 10,
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            {/* Content Overlay */}
            <div style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
              {previewReel.hook && (
                <div style={{ fontSize: 13, fontWeight: 900, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {previewReel.hook}
                </div>
              )}
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', lineHeight: 1.2, marginTop: 4 }}>
                {previewReel.title}
              </div>
              {previewReel.subtext && (
                <div style={{ fontSize: 13, color: '#CBD5E1', marginTop: 6, lineHeight: 1.4 }}>
                  {previewReel.subtext}
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <button
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 14
                  }}
                >
                  {previewReel.ctaText || 'Jetzt reservieren'} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE REEL CONFIRMATION ── */}
      {reelToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#13131F', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 20, maxWidth: 360, width: '100%', padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Trash2 size={24} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>
              Reel löschen?
            </div>
            <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 20 }}>
              Möchtest du "{reelToDelete.title}" wirklich aus dem Flow entfernen?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setReelToDelete(null)} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#FFF', border: 'none', fontWeight: 700 }}>
                Abbrechen
              </button>
              <button onClick={() => handleDelete(reelToDelete.id)} style={{ flex: 1, padding: 11, borderRadius: 10, background: '#EF4444', color: '#FFF', border: 'none', fontWeight: 800 }}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

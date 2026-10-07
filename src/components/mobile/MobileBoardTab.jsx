import React, { useState } from 'react'
import {
  Tv,
  ExternalLink,
  Plus,
  Play,
  Layers,
  Copy,
  CheckCircle2,
  RefreshCw,
  QrCode,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { copyToClipboard, qrImageUrl } from '@/storage'

export default function MobileBoardTab({
  displays = [],
  reels = [],
  menuReels = [],
  tenant,
  tenantId,
  saveDisplay,
  notify
}) {
  const [boardMode, setBoardMode] = useState('reels') // 'reels' | 'menu' | 'splitscreen'
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPairingModal, setShowPairingModal] = useState(false)
  const [newScreenName, setNewScreenName] = useState('')
  const [newScreenLoc, setNewScreenLoc] = useState('')

  const activeReel = reels.find(r => r.status === 'live') || reels[0] || null
  const activeMenu = menuReels[0] || null
  const boardTvUrl = `${window.location.origin}/board`

  // Default display fleet if empty
  const displayList = displays.length > 0 ? displays : [
    { id: 'd1', name: 'Theken-TV (Bar)', location: 'Theke / Empfang', status: 'online' },
    { id: 'd2', name: 'Gastraum Haupt-Screen', location: 'Restaurant Mitte', status: 'online' }
  ]

  const handleAddDisplay = async (e) => {
    e.preventDefault()
    if (!newScreenName.trim()) return
    try {
      await saveDisplay.mutateAsync({
        tenantId,
        display: {
          name: newScreenName.trim(),
          location: newScreenLoc.trim() || 'Gastraum',
          status: 'online',
          playlistId: 'pl_default'
        }
      })
      setNewScreenName('')
      setNewScreenLoc('')
      setShowAddModal(false)
      notify('📺 Bildschirm erfolgreich hinzugefügt')
    } catch (e) {
      notify('⚠️ Fehler beim Speichern')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tv size={20} color="#3B82F6" />
            <span>SCENVY BOARD</span>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            Digital Signage TV-Screens (im Ansatz)
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPairingModal(true)}
          style={{
            padding: '9px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: '#FFF',
            border: 'none',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
          }}
        >
          <QrCode size={14} /> <span>TV verbinden</span>
        </button>
      </div>

      {/* ── Signage Mode Switcher (Was läuft auf dem Fernseher) ── */}
      <div style={{ background: '#111622', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          📺 Ausstrahlung auf TV-Screens wählen
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            ['reels', '🎬 Reel Loops', 'Video-Stories'],
            ['menu', '🍽️ Speisekarte', 'Menü Highlights'],
            ['splitscreen', '🌟 Split-Screen', 'Kombi-Modus']
          ].map(([mode, label, desc]) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setBoardMode(mode); notify(`📺 TV-Modus umgestellt auf: ${label}`) }}
              style={{
                padding: '10px 6px',
                borderRadius: 12,
                border: boardMode === mode ? '1.5px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                background: boardMode === mode ? 'rgba(59, 130, 246, 0.22)' : '#09090E',
                color: boardMode === mode ? '#FFF' : '#94A3B8',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 800 }}>{label}</div>
              <div style={{ fontSize: 9.5, color: boardMode === mode ? '#93C5FD' : '#64748B', marginTop: 2 }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 16:9 TV Live-Vorschau ── */}
      <div style={{ background: '#111622', borderRadius: 18, border: '1px solid rgba(59, 130, 246, 0.3)', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} />
            <span>Live TV-Vorschau (16:9 Querformat)</span>
          </div>
          <span style={{ fontSize: 10, color: '#3B82F6', fontWeight: 800 }}>
            {boardMode.toUpperCase()} AKTIV
          </span>
        </div>

        {/* 16:9 Simulated TV Screen Frame */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 10,
          background: '#000',
          border: '3px solid #1E293B',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
        }}>
          {boardMode === 'reels' ? (
            /* Mode: Reels on TV */
            activeReel ? (
              <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeReel.mediaType === 'video' || (activeReel.mediaUrl && activeReel.mediaUrl.endsWith('.mp4')) ? (
                  <video src={activeReel.mediaUrl || activeReel.imageUrl} muted autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={activeReel.imageUrl || activeReel.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="TV Reel" />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#FCD34D' }}>{activeReel.hook || 'EMPFEHLUNG'}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>{activeReel.title}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: '#7C3AED', color: '#FFF' }}>
                    {tenant?.name || 'SCENVY'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>
                Keine aktiven Reels vorhanden
              </div>
            )
          ) : boardMode === 'menu' ? (
            /* Mode: Digital Menu Board */
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #09090E 0%, #171727 100%)', padding: 12, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#FFF' }}>🍽️ {activeMenu?.branding?.name || tenant?.name || 'TAGESKARTE'}</span>
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>FRISCH ZUBEREITET</span>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#FFF' }}>Signature Gericht</div>
                  <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Hausgemachte Spezialität</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#F59E0B', marginTop: 2 }}>18.50 €</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#FFF' }}>Saisonales Highlight</div>
                  <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Mit regionalen Zutaten</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#F59E0B', marginTop: 2 }}>22.00 €</div>
                </div>
              </div>
            </div>
          ) : (
            /* Split Screen */
            <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ background: '#0D0D14', padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#FFF' }}>{tenant?.name || 'UNSERE HIGHLIGHTS'}</div>
                <div style={{ fontSize: 10, color: '#F59E0B', marginTop: 4 }}>✦ Speisen frisch vom Küchenchef</div>
                <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2 }}>Scanne den Tisch-QR-Code zum Bestellen</div>
              </div>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  src={activeReel?.imageUrl || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=720&auto=format&fit=crop'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt=""
                />
              </div>
            </div>
          )}
        </div>

        {/* TV Stand Icon Element */}
        <div style={{ width: 40, height: 4, background: '#334155', margin: '3px auto 0', borderRadius: 2 }} />
      </div>

      {/* ── Display Fleet (Screens) ── */}
      <div style={{ background: '#111622', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>📺 TV-Bildschirm Flotte</div>
            <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{displayList.length} Screens verknüpft</div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#93C5FD',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            + Neuer Screen
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayList.map((d, i) => (
            <div
              key={d.id || i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 12,
                background: '#09090E',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                  <Tv size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{d.location || 'Gastraum'}</div>
                </div>
              </div>

              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                background: d.status === 'online' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(148, 163, 184, 0.18)',
                color: d.status === 'online' ? '#10B981' : '#94A3B8'
              }}>
                {d.status === 'online' ? '🟢 ONLINE' : '⚪ STANDBY'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Smart-TV Pairing Modal ── */}
      {showPairingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#13131F', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 24, maxWidth: 380, width: '100%', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📺</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>
              Smart-TV mit SCENVY verbinden
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>
              Öffne diese URL im Web-Browser deines Fernsehers (Samsung, LG, FireTV Stick):
            </div>

            <div style={{ background: '#09090E', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA', wordBreak: 'break-all' }}>
                {boardTvUrl}
              </div>
              <button
                onClick={() => { copyToClipboard(boardTvUrl); notify('🔗 TV-URL in Zwischenablage kopiert') }}
                style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, background: '#3B82F6', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
              >
                URL kopieren
              </button>
            </div>

            <button
              onClick={() => setShowPairingModal(false)}
              style={{ width: '100%', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', fontWeight: 800, cursor: 'pointer' }}
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* ── Add Display Modal ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form onSubmit={handleAddDisplay} style={{ background: '#13131F', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 20, maxWidth: 360, width: '100%', padding: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 12 }}>
              Neuen TV-Screen registrieren
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4 }}>NAME DES BILDSCHIRMS</label>
                <input
                  value={newScreenName}
                  onChange={e => setNewScreenName(e.target.value)}
                  placeholder="z.B. Fernseher Theke"
                  style={{ width: '100%', padding: 10, borderRadius: 10, background: '#09090E', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'block', marginBottom: 4 }}>STANDORT / RAUM</label>
                <input
                  value={newScreenLoc}
                  onChange={e => setNewScreenLoc(e.target.value)}
                  placeholder="z.B. Gastraum links"
                  style={{ width: '100%', padding: 10, borderRadius: 10, background: '#09090E', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: '#FFF', border: 'none', fontWeight: 700 }}>
                Abbrechen
              </button>
              <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 10, background: '#3B82F6', color: '#FFF', border: 'none', fontWeight: 800 }}>
                Registrieren
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

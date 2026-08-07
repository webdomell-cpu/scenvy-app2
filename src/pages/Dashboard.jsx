import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull, ScenvyLogoIcon } from '@/components/ScenvyLogo'
import { copyToClipboard, downloadQR, qrImageUrl, getGuestUrl } from '@/storage'
import { useAuth } from '@/lib/AuthContext'
import {
  useReels, useSaveReel, useDeleteReel,
  useLocations, useSaveLocation, useDeleteLocation,
  useAnalyticsSummary, uploadMedia,
  useMedia, useSaveMedia, useDeleteMedia,
  useTenant, useSaveTenantProfile, formatDateTime,
  createStripePortal,
  useDisplays, useSaveDisplay, usePlaylists, useSavePlaylist, useLayouts
} from '@/lib/db'
import { AppLauncherBar } from '@/components/AppLauncherBar'
import { launchSubdomainModule } from '@/lib/sso'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Home, Film, MapPin, BarChart2, Sparkles, Settings, Menu, QrCode, Eye, MousePointer, Video, Plus, Trash2, RefreshCw, Copy, LogOut, Upload, Link, X, Image, ExternalLink, CreditCard as Edit2, Download, Globe, Save, Mail, Shield, Library, Building2, Phone, Utensils, Tv, ConciergeBell, Layers } from 'lucide-react'
import MenuGenerator from '@/pages/MenuGenerator'

// ── i18n ─────────────────────────────────────────────────
const T = {
  de:{ nav:{overview:'Übersicht',reels:'Reels',locations:'Standorte',analytics:'Analytics',ai:'KI-Generator',menu_generator:'AI Speisekarte',qr:'QR-Codes',media:'Mediathek',settings:'Einstellungen',company:'Firmendaten'}, logout:'Abmelden', thisWeek:'diese Woche', active:'Aktiv', inactive:'Inaktiv', scans:'Scans', watchRate:'Watch Rate', deactivate:'Deaktivieren', activate:'Aktivieren', save:'Speichern', cancel:'Abbrechen', edit:'Bearbeiten', delete:'Löschen' },
  en:{ nav:{overview:'Overview',reels:'Reels',locations:'Locations',analytics:'Analytics',ai:'AI Generator',menu_generator:'AI Menu',qr:'QR Codes',media:'Media Library',settings:'Settings',company:'Company Data'}, logout:'Log out', thisWeek:'this week', active:'Active', inactive:'Inactive', scans:'Scans', watchRate:'Watch Rate', deactivate:'Deactivate', activate:'Activate', save:'Save', cancel:'Cancel', edit:'Edit', delete:'Delete' },
}

const pill=(label,color)=>(<span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:`${color}28`,color,border:`1px solid ${color}44`}}>{label}</span>)

// ── Reel Modal ────────────────────────────────────────────
function ReelModal({ reel, locs, tenantId, onClose, onSave, notify, mediaItems }) {
  const [showMediathek, setShowMediathek] = useState(false)

  const isEdit = !!reel?.id
  const [title,       setTitle]       = useState(reel?.title       || '')
  const [type,        setType]        = useState(reel?.type        || 'offer')
  const [locationId,  setLocationId]  = useState(reel?.locationId || reel?.location_id || 'ALL')
  const [ctaText,     setCtaText]     = useState(reel?.cta         || 'Order Now')
  const [ctaUrl,      setCtaUrl]      = useState(reel?.ctaUrl      || reel?.cta_url || '')
  const [ctaAction,   setCtaAction]   = useState(reel?.ctaAction   || reel?.cta_action || 'url')
  const [emoji,       setEmoji]       = useState(reel?.emoji       || '🍹')
  const [preview,     setPreview]     = useState(reel?.mediaUrl    || reel?.media_url || null)
  const [status,      setStatus]      = useState(reel?.status      || 'draft')
  const [scheduledAt, setScheduledAt]  = useState(reel?.scheduledAt || reel?.scheduled_at || '')
  const [duration,    setDuration]    = useState(reel?.duration    || 5)
  const [uploading,   setUploading]   = useState(false)
  const fileRef = useRef()

  const EMOJI_PRESETS = ['🍹', '🍸', '🍷', '🍺', '🥂', '🥩', '🍕', '🍔', '🍣', '🥗', '🥐', '🍨', '☕', '🎂', '🎉', '⚡', '🔥', '✨', '🏷️', '📌', '📷', '🎥']

  const colorMap = { offer:C.purple, event:C.pink, menu:C.blue, promo:C.orange }

  const handleFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    setUploading(true)
    try {
      const url = await uploadMedia(f, tenantId)
      setPreview(url)
      notify('✅ Datei hochgeladen')
    } catch { notify('❌ Upload fehlgeschlagen') }
    setUploading(false)
  }

  const handleDrop = (e) => { e.preventDefault(); const f=e.dataTransfer.files?.[0]; if(f){const inp=fileRef.current;inp.files=e.dataTransfer.files;handleFile({target:inp})} }

  const save = () => {
    if (!title.trim()) { notify('Bitte Titel eingeben'); return }
    const loc = locs.find(l=>l.id===locationId)
    onSave({
      ...(reel?.id ? {id:reel.id} : {}),
      tenant_id:   tenantId,
      location_id: locationId,
      locationId:  locationId,
      title, type,
      cta:        ctaText,
      cta_url:    ctaUrl,
      cta_action: ctaAction,
      emoji,
      color:      colorMap[type]||C.purple,
      status:     status,
      scheduledAt: scheduledAt,
      scheduled_at: scheduledAt,
      duration:   Number(duration) || 5,
      mediaUrl:   preview,
      media_url:  preview,
      media_type: preview?.includes('.mp4')||preview?.includes('.mov') ? 'video' : 'image',
      loc:        loc?.name || (locationId === 'ALL' ? 'Alle Standorte' : ''),
      ctaUrl, ctaAction, 
    })
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',backdropFilter:'blur(12px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,width:'100%',maxWidth:840,maxHeight:'90vh',overflow:'auto'}}>
        <div style={{padding:'20px 24px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:C.card,zIndex:10}}>
          <div style={{fontWeight:800,fontSize:17,display:'flex',alignItems:'center',gap:8}}>
            <span>{isEdit?'✏️ Reel bearbeiten':'➕ Reel erstellen'}</span>
            <span style={{fontSize:11,padding:'2px 8px',borderRadius:12,background:status==='live'?`${C.green}22`:status==='scheduled'?`${C.orange}22`:C.card2,color:status==='live'?C.green:status==='scheduled'?C.orange:C.muted,fontWeight:700}}>
              {status==='live'?'● LIVE':status==='scheduled'?'📅 GEPLANT':status==='paused'?'⏸ PAUSIERT':'📝 ENTWURF'}
            </span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer'}}><X size={20}/></button>
        </div>
        <div style={{padding:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          {/* Left Column */}
          <div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:7,fontWeight:600,letterSpacing:1}}>FOTO / VIDEO</label>
              <div onDrop={handleDrop} onDragOver={e=>e.preventDefault()} onClick={()=>!uploading&&fileRef.current?.click()}
                style={{border:`2px dashed ${preview?C.purple:C.border}`,borderRadius:12,overflow:'hidden',cursor:'pointer',minHeight:110,display:'flex',alignItems:'center',justifyContent:'center',background:`${C.purple}08`,position:'relative'}}>
                {uploading ? <div style={{textAlign:'center'}}><RefreshCw size={24} color={C.purple} style={{animation:'spin 1s linear infinite'}}/><div style={{fontSize:12,color:C.muted,marginTop:8}}>Wird hochgeladen...</div></div>
                  : preview ? <>
                      {preview.includes('.mp4')||preview.includes('.mov')||preview.includes('video')?
                        <video src={preview} autoPlay muted loop playsInline style={{width:'100%',maxHeight:160,objectFit:'cover'}} />:
                        <img src={preview} style={{width:'100%',maxHeight:160,objectFit:'cover'}} alt=""/>
                      }
                      <button onClick={e=>{e.stopPropagation();setPreview(null)}} style={{position:'absolute',top:6,right:6,background:C.pink,border:'none',borderRadius:'50%',width:24,height:24,color:C.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={11}/></button>
                    </>
                  : <div style={{textAlign:'center',padding:20}}><Upload size={26} color={C.purple} style={{marginBottom:8}}/><div style={{fontSize:13,color:C.muted}}>Hier klicken oder reinziehen</div><div style={{fontSize:11,color:C.dim,marginTop:3}}>MP4, MOV, JPG, PNG</div></div>
                }
                <input ref={fileRef} type="file" accept="video/*,image/*" onChange={handleFile} style={{display:'none'}}/>
              </div>
              <button onClick={() => setShowMediathek(true)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.purple}`, background: `${C.purple}22`, color: C.purple, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                🖼️ Aus Mediathek wählen
              </button>
            </div>

            {/* Sub Modal: Mediathek Select */}
            {showMediathek && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ background: C.card, borderRadius: 24, width: '100%', maxWidth: 800, maxHeight: '80vh', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>🖼️ Mediathek durchsuchen</div>
                    <button onClick={() => setShowMediathek(false)} style={{ background: 'none', border: 'none', color: C.white, cursor: 'pointer' }}><X size={24} /></button>
                  </div>
                  <div style={{ padding: 24, overflowY: 'auto' }}>
                    {(!mediaItems || mediaItems.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
                        Keine Medien in deiner Mediathek vorhanden. Lade zuerst in der Mediathek hoch.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
                        {mediaItems.map(m => (
                          <div key={m.id} onClick={() => { setPreview(m.url); setShowMediathek(false); notify('✅ Medium aus Mediathek übernommen!'); }} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: `2px solid transparent`, background: C.card2, position: 'relative' }}>
                            {m.type === 'video' ? (
                              <video src={m.url} style={{ width: '100%', height: 120, objectFit: 'cover' }} muted />
                            ) : (
                              <img src={m.url} style={{ width: '100%', height: 120, objectFit: 'cover' }} alt="" />
                            )}
                            <div style={{ padding: '6px 8px', fontSize: 10, background: 'rgba(0,0,0,0.8)', color: '#FFF', position: 'absolute', bottom: 0, left: 0, right: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.name || 'Unbenannt'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>TITEL *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="z.B. Happy Hour Special 2-for-1" style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
            </div>

            {/* Emoji Selector */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>EMOJI AUSWÄHLEN</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',background:C.bg,padding:10,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8}}>
                {EMOJI_PRESETS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    style={{
                      fontSize: 18,
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: emoji === e ? `2px solid ${C.purple}` : '1px solid transparent',
                      background: emoji === e ? `${C.purple}33` : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.1s'
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:11,color:C.muted}}>Eigenes Emoji:</span>
                <input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{width:50,padding:'4px 8px',borderRadius:6,border:`1px solid ${C.border}`,background:C.card2,color:C.white,fontSize:16,textAlign:'center'}}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>TYP</label>
                <select value={type} onChange={e=>setType(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.card2,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}>
                  <option value="offer">🏷️ Angebot</option><option value="event">🎉 Event</option><option value="menu">🍽️ Menü</option><option value="promo">⚡ Promo</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>STANDORT</label>
                <select value={locationId} onChange={e=>setLocationId(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.card2,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}>
                  <option value="ALL">🌐 Alle Standorte (Global / ALL)</option>
                  {locs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            {/* Slide Duration Input for non-video reels */}
            <div style={{marginTop:16}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>ANZEIGEDAUER SLIDE (SEKUNDEN)</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {[3, 5, 7, 10, 15].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDuration(sec)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: Number(duration) === sec ? `1px solid ${C.purple}` : `1px solid ${C.border}`,
                      background: Number(duration) === sec ? `${C.purple}33` : C.card2,
                      color: Number(duration) === sec ? C.white : C.muted,
                      fontWeight: Number(duration) === sec ? 700 : 400,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {sec}s
                  </button>
                ))}
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  style={{width:60,padding:'6px 8px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:12,textAlign:'center'}}
                />
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:4}}>Automatische Weiterschaltung für Bild- & Text-Reels (Standard: 5 Sek).</div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Status & Schedule Config */}
            <div style={{background:`${C.purple}11`,border:`1px solid ${C.purple}33`,borderRadius:14,padding:18,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <Sparkles size={15} color={C.purple}/> STATUS & VERÖFFENTLICHUNG
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:14}}>
                {[
                  ['draft', '📝 Entwurf', C.muted],
                  ['scheduled', '📅 Geplant', C.orange],
                  ['live', '● Sofort Live', C.green],
                  ['paused', '⏸ Pausiert', C.pink]
                ].map(([st, label, col]) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: status === st ? `1px solid ${col}` : `1px solid ${C.border}`,
                      background: status === st ? `${col}22` : C.bg,
                      color: status === st ? col : C.muted,
                      fontWeight: status === st ? 700 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Schedule Datetime input */}
              {status === 'scheduled' && (
                <div style={{marginTop:10}}>
                  <label style={{fontSize:11,color:C.orange,display:'block',marginBottom:6,letterSpacing:1,fontWeight:700}}>VERÖFFENTLICHUNGSDATUM & UHRZEIT *</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.orange}`,
                      background: C.bg,
                      color: C.white,
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{fontSize:10,color:C.muted,marginTop:4}}>Reel wird zum gewählten Zeitpunkt automatisch live geschaltet.</div>
                </div>
              )}
            </div>

            {/* CTA Config */}
            <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:8}}><Link size={15} color={C.purple}/>CTA-Button</div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>BUTTON-TEXT</label>
                <input value={ctaText} onChange={e=>setCtaText(e.target.value)} placeholder="z.B. Jetzt bestellen" style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>AKTION</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {[['url','🔗 Link'],['phone','📞 Anruf'],['menu','🍽️ Menü'],['reserve','📅 Reservieren'],['order','🛒 Bestellen']].map(([v,l])=>(
                    <button key={v} onClick={()=>setCtaAction(v)} style={{padding:'7px 10px',borderRadius:8,border:`1px solid ${ctaAction===v?C.purple:C.border}`,background:ctaAction===v?`${C.purple}22`:'transparent',color:ctaAction===v?C.white:C.muted,fontSize:11,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>ZIEL-URL / TELEFON</label>
                <input value={ctaUrl} onChange={e=>setCtaUrl(e.target.value)} placeholder={ctaAction==='phone'?'+49 123 456789':'https://...'} style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
              </div>
            </div>

            {/* Preview */}
            <div style={{background:C.card2,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:8,letterSpacing:1}}>LIVE VORSCHAU</div>
              <div style={{background:`linear-gradient(160deg,${colorMap[type]||C.purple}44,${C.bg})`,borderRadius:10,padding:14,textAlign:'center'}}>
                <div style={{fontSize:32,marginBottom:6}}>{emoji}</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>{title||'Reel-Titel'}</div>
                {ctaUrl&&<div style={{fontSize:10,color:C.blue,marginBottom:6,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}><ExternalLink size={9}/>{ctaUrl.replace('https://','')}</div>}
                <div style={{padding:'8px 0',borderRadius:8,background:grad(colorMap[type]||C.purple,C.pink),fontSize:12,fontWeight:700}}>{ctaText||'Button'} →</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{padding:'14px 24px',borderTop:`1px solid ${C.border}`,display:'flex',gap:12,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'10px 22px',borderRadius:10,border:`1px solid ${C.border}`,background:'transparent',color:C.muted,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>Abbrechen</button>
          <button onClick={save} disabled={uploading} style={{padding:'10px 28px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit'}}>
            {isEdit?'✓ Speichern':'Reel speichern →'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Sidebar ───────────────────────────────────────────────
function Sidebar({ page, setPage, open, setOpen, t, user, logout, tenant }) {
  const nav = useNavigate()
  
  const tenantItems = [
    { id: 'overview', name: 'Übersicht', icon: <Home size={18}/> },
    { id: 'locations', name: 'Standorte', icon: <MapPin size={18}/> },
    { id: 'qr', name: 'QR-Codes & Tags', icon: <QrCode size={18}/> },
    { id: 'media', name: 'Mediathek', icon: <Library size={18}/> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart2 size={18}/> },
    { id: 'company', name: 'Firmendaten', icon: <Building2 size={18}/> },
    { id: 'settings', name: 'Einstellungen', icon: <Settings size={18}/> },
  ]

  const allModuleItems = [
    { id: 'reels', modKey: 'flow', name: 'SCENVY FLOW', sub: 'Reels & Video-Feed', badge: 'CONTENT', icon: <Film size={18}/>, color: '#8B5CF6' },
    { id: 'menu_generator', modKey: 'menu', name: 'SCENVY MENU', sub: 'Digitale Speisekarten', badge: 'KI SNAP', icon: <Utensils size={18}/>, color: '#F97316' },
    { id: 'board', modKey: 'board', name: 'SCENVY BOARD', sub: 'Digital Signage TV', badge: 'DISPLAY', icon: <Tv size={18}/>, color: '#3B82F6' },
    { id: 'host', modKey: 'host', name: 'SCENVY HOST', sub: 'Gäste-Concierge', badge: 'SERVICE', icon: <ConciergeBell size={18}/>, color: '#10B981' },
  ]
  const mods = tenant?.modules || { flow: true, menu: true, board: false, host: false }
  const moduleItems = allModuleItems.filter(m => mods[m.modKey])

  return (
    <div style={{
      width: open ? 250 : 68,
      background: C.card,
      borderRight: `1px solid ${C.border}`,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .3s cubic-bezier(0.16, 1, 0.3, 1)',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 50,
      boxShadow: '4px 0 24px rgba(0,0,0,0.3)'
    }}>
      {/* Top Logo Header */}
      <div style={{
        padding: open ? '18px 20px 14px' : '18px 10px 14px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        flexShrink: 0,
        background: C.bg
      }}>
        {open ? <ScenvyLogoFull height={48} tagline={false} /> : <ScenvyLogoIcon size={44} />}
      </div>

      {/* Scrollable Navigation Area with Custom Scrollbar */}
      <nav 
        className="scenvy-sidebar-scroll"
        style={{
          padding: '12px 10px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <style>{`
          .scenvy-sidebar-scroll::-webkit-scrollbar {
            width: 5px;
          }
          .scenvy-sidebar-scroll::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.4);
          }
          .scenvy-sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.3);
            border-radius: 10px;
          }
          .scenvy-sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
          }
        `}</style>

        {/* Section 1: Mandant / Tenant Basis */}
        <div>
          {open && (
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, letterSpacing: 1.5, padding: '0 8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🏢</span> TENANT PLATTFORM
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tenantItems.map(item => {
              const isActive = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  title={!open ? item.name : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: open ? '7px 10px' : '7px 0',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? `${C.purple}22` : 'transparent',
                    color: isActive ? C.white : C.muted,
                    justifyContent: open ? 'flex-start' : 'center',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    lineHeight: 1.25,
                    transition: 'all 0.15s ease',
                    borderLeft: isActive ? `3px solid ${C.purple}` : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ color: isActive ? C.purple : C.muted, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                  {open && (
                    <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, flex: 1, lineHeight: 1.25 }}>
                      {item.name}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section 2: SCENVY Sub-Brands & Modules */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          {open && (
            <div style={{ fontSize: 10, color: C.pink, fontWeight: 800, letterSpacing: 1.5, padding: '0 8px 8px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
              <span>🚀 GEBUCHTE MODULE</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {moduleItems.map(item => {
              const isActive = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  title={!open ? `${item.name} (${item.badge})` : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: open ? '8px 10px' : '8px 0',
                    borderRadius: 10,
                    border: `1px solid ${isActive ? `${item.color}66` : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer',
                    background: isActive ? `${item.color}22` : C.card2,
                    color: isActive ? C.white : C.muted,
                    justifyContent: open ? 'flex-start' : 'center',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    boxShadow: isActive ? `0 4px 16px ${item.color}22` : 'none',
                    lineHeight: 1.25,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = `${item.color}44`
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.transform = 'none'
                    }
                  }}
                >
                  <span style={{ color: item.color, flexShrink: 0, display: 'flex', alignItems: 'center', padding: open ? 0 : '0 12px' }}>
                    {item.icon}
                  </span>
                  {open && (
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{item.name}</span>
                        <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: `${item.color}33`, color: item.color, fontWeight: 800 }}>
                          {item.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.sub}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Footer Actions */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.bg, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.card,
            color: C.muted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700
          }}
        >
          <Menu size={16}/>
          {open && <span>Sidebar Einklappen</span>}
        </button>
      </div>
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────
function Overview({ setPage, reels, locs, t }) {
  const liveCount = reels.filter(r=>r.status==='live').length
  const totalScans = locs.reduce((s,l)=>s+(l.scans||0),0)
  return (
    <div>
      <div style={{marginBottom:26}}>
        <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:6}}>DASHBOARD</div>
        <div style={{fontSize:26,fontWeight:800}}>Willkommen zurück 👋</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>Deine Performance heute auf einen Blick.</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
        {[
          {label:t.nav.locations, value:locs.length,    delta:`${locs.filter(l=>l.active).length} aktiv`,   icon:<MapPin size={18} color={C.purple}/>,      color:C.purple},
          {label:'Live Reels',    value:liveCount,       delta:`von ${reels.length} Reels`,                  icon:<Video size={18} color={C.green}/>,        color:C.green},
          {label:t.scans,         value:totalScans.toLocaleString(), delta:`${t.thisWeek}`,                  icon:<QrCode size={18} color={C.blue}/>,        color:C.blue},
          {label:'Content',       value:reels.length,    delta:`${reels.filter(r=>r.status==='draft').length} Entwürfe`, icon:<Film size={18} color={C.pink}/>, color:C.pink},
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <span style={{fontSize:12,color:C.muted}}>{s.label}</span>
              <div style={{width:36,height:36,borderRadius:10,background:`${s.color}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>{s.icon}</div>
            </div>
            <div style={{fontSize:28,fontWeight:800,marginBottom:4}}>{s.value}</div>
            <div style={{fontSize:12,color:C.green}}>{s.delta}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
            <span style={{fontSize:14,fontWeight:700}}>Aktuelle Reels</span>
            <button onClick={()=>setPage('reels')} style={{fontSize:12,color:C.purple,background:'none',border:'none',cursor:'pointer'}}>Alle →</button>
          </div>
          {reels.length===0 && <div style={{fontSize:13,color:C.muted,padding:'20px 0',textAlign:'center'}}>Noch keine Reels. Erstelle deinen ersten!</div>}
          {reels.slice(0,5).map(r=>(
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 0',borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:34,height:34,borderRadius:8,background:`${r.color||C.purple}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,overflow:'hidden',flexShrink:0}}>
                {r.mediaUrl?r.mediaType==='video'?<video src={r.mediaUrl} autoPlay muted loop playsInline style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} />:<img src={r.mediaUrl} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} alt=""/>:r.emoji||'🎬'}
              </div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{r.title}</div><div style={{fontSize:11,color:C.muted}}>📍 {(r.locationId==='ALL'||r.location_id==='ALL'||!r.location_id||r.locationId==='all') ? '🌐 Alle Standorte' : (locs.find(l=>l.id===(r.locationId||r.location_id))?.name || r.loc || r.locations?.name || '–')}</div></div>
              {pill(r.status==='live'?'● LIVE':r.status?.toUpperCase()||'DRAFT', r.status==='live'?C.green:r.status==='scheduled'?C.orange:C.muted)}
            </div>
          ))}
        </div>
        <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
            <span style={{fontSize:14,fontWeight:700}}>Standorte</span>
            <button onClick={()=>setPage('locations')} style={{fontSize:12,color:C.purple,background:'none',border:'none',cursor:'pointer'}}>Verwalten →</button>
          </div>
          {locs.length===0 && <div style={{fontSize:13,color:C.muted,padding:'20px 0',textAlign:'center'}}>Noch keine Standorte. Füge deinen ersten hinzu!</div>}
          {locs.map(l=>(
            <div key={l.id} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 0',borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:l.active?C.green:C.dim,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{l.name}</div><div style={{fontSize:11,color:C.muted}}>{l.city}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:13,fontWeight:700}}>{(l.scans||0).toLocaleString()}</div><div style={{fontSize:10,color:C.blue}}>{l.wr||0}% watch</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Module Sub-Header (Second Navigation Row) ─────────────
function ModuleSubHeader({ activeModule, activeTab, setActiveTab, reelsCount = 0 }) {
  if (!['reels', 'menu_generator', 'menu', 'board', 'host'].includes(activeModule)) return null

  let config = null
  if (activeModule === 'reels') {
    config = {
      badge: '🎬 SCENVY FLOW',
      badgeColor: C.purple,
      tabs: [
        { id: 'feed', label: '🎬 Reel Feed & Galerie', badge: reelsCount ? `${reelsCount}` : null },
        { id: 'ai_prompter', label: '✨ KI Prompter & Generator' },
        { id: 'planner', label: '📅 Reel Planer & Timetable' },
        { id: 'settings', label: '⚙️ Einstellungen' }
      ]
    }
  } else if (activeModule === 'menu_generator' || activeModule === 'menu') {
    config = {
      badge: '🍽️ SCENVY MENU',
      badgeColor: C.orange,
      tabs: [
        { id: 'create', label: '🚀 SNAP KI Speisekarte' },
        { id: 'list', label: '📋 Digitale Menüs' },
        { id: 'design', label: '🎨 Branding & Templates' },
        { id: 'settings', label: '⚙️ Einstellungen' }
      ]
    }
  } else if (activeModule === 'board') {
    config = {
      badge: '📺 SCENVY BOARD',
      badgeColor: C.blue,
      tabs: [
        { id: 'overview', label: '📺 Screen Übersicht' },
        { id: 'playlists', label: '⏱ Signage Playlists' },
        { id: 'settings', label: '⚙️ Display Pairings' }
      ]
    }
  } else if (activeModule === 'host') {
    config = {
      badge: '🏨 SCENVY HOST',
      badgeColor: C.green,
      tabs: [
        { id: 'overview', label: '🛎️ Tisch-Ruf & Services' },
        { id: 'guestbook', label: '📖 Digitale Gästemappe' },
        { id: 'reviews', label: '⭐ Feedback & Bewertungen' }
      ]
    }
  }

  if (!config) return null

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      padding: '10px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexShrink: 0,
      zIndex: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11,
          fontWeight: 900,
          color: config.badgeColor,
          background: `${config.badgeColor}22`,
          padding: '5px 12px',
          borderRadius: 8,
          border: `1px solid ${config.badgeColor}44`,
          letterSpacing: 1
        }}>
          {config.badge}
        </span>
        <div style={{ height: 16, width: 1, background: C.border }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {config.tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 9,
                  border: isActive ? `1px solid ${config.badgeColor}66` : '1px solid transparent',
                  background: isActive ? `${config.badgeColor}25` : 'transparent',
                  color: isActive ? C.white : C.muted,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isActive ? config.badgeColor : C.card2,
                    color: C.white,
                    fontWeight: 800
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Reels Page ────────────────────────────────────────────
function ReelsPage({ reels, locs, tenantId, notify, t, subTab = 'feed', setSubTab }) {
  const [filter,   setFilter]   = useState('all')
  const [editReel, setEditReel] = useState(null)
  const saveReel   = useSaveReel()
  const deleteReel = useDeleteReel()

  const shown = filter==='all' ? reels : reels.filter(r=>r.status===filter)

  const handleSave = async (data) => {
    try { await saveReel.mutateAsync({ reel:data, tenantId }); notify('✅ Reel gespeichert') }
    catch { notify('❌ Fehler beim Speichern') }
    setEditReel(null)
  }

  const handleDelete = async (id) => {
    try { await deleteReel.mutateAsync({ id, tenantId }); notify('Reel gelöscht') }
    catch { notify('❌ Fehler beim Löschen') }
  }

  const handleUpdateStatus = async (r, newStatus) => {
    try {
      await saveReel.mutateAsync({ reel: { ...r, status: newStatus }, tenantId })
      notify(`Status auf "${newStatus.toUpperCase()}" geändert`)
    } catch {
      notify('❌ Fehler beim Aktualisieren')
    }
  }

  if (subTab === 'ai_prompter') {
    return <AIGenerator tenantId={tenantId} locs={locs} notify={notify} />
  }

  if (subTab === 'planner') {
    const scheduled = reels.filter(r => r.status === 'scheduled')
    return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <div style={{fontSize:11,color:C.pink,fontWeight:800,letterSpacing:2,marginBottom:4}}>CONTENT PLANER</div>
            <div style={{fontSize:24,fontWeight:900}}>📅 Sende-Planer & Timetable</div>
            <div style={{fontSize:13,color:C.muted,marginTop:4}}>Übersicht aller geplanten und aktiven Video-Reels nach Veröffentlichungsdatum.</div>
          </div>
          <button onClick={() => setEditReel({ status: 'scheduled' })} style={{padding:'9px 18px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            <Plus size={16}/> Neuer Plan-Slot
          </button>
        </div>

        {scheduled.length === 0 ? (
          <div style={{background:C.card,borderRadius:16,padding:40,textAlign:'center',border:`2px dashed ${C.border}`}}>
            <Film size={40} color={C.dim} style={{marginBottom:12}}/>
            <div style={{fontSize:16,fontWeight:700,color:C.white}}>Aktuell keine geplanten Reels</div>
            <div style={{fontSize:13,color:C.muted,marginTop:4,marginBottom:16}}>Plane Aktionen, Happy Hours & Event-Ankündigungen im Voraus.</div>
            <button onClick={() => setEditReel({ status: 'scheduled' })} style={{padding:'8px 16px',borderRadius:8,background:C.purple,color:C.white,border:'none',fontWeight:700,fontSize:13,cursor:'pointer'}}>
              Reel jetzt einplanen
            </button>
          </div>
        ) : (
          <div style={{display:'grid',gap:14}}>
            {scheduled.map(r => (
              <div key={r.id} style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:54,height:54,borderRadius:12,background:`${r.color||C.purple}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
                    {r.emoji||'🎬'}
                  </div>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>{r.title}</div>
                    <div style={{fontSize:12,color:C.orange,fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
                      📅 Geplant für: {r.scheduledAt || r.scheduled_at ? new Date(r.scheduledAt || r.scheduled_at).toLocaleString('de-DE') : 'Datum nicht festgelegt'}
                    </div>
                  </div>
                </div>

                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <button onClick={() => handleUpdateStatus(r, 'live')} style={{padding:'7px 14px',borderRadius:8,border:'none',background:`${C.green}22`,color:C.green,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                    🚀 Sofort Live
                  </button>
                  <button onClick={() => setEditReel(r)} style={{padding:'7px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.white,fontSize:12,cursor:'pointer'}}>
                    ✏️ Datum ändern
                  </button>
                  <button onClick={() => handleDelete(r.id)} style={{padding:'7px 10px',borderRadius:8,border:'none',background:`${C.pink}22`,color:C.pink,fontSize:12,cursor:'pointer'}}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {editReel!==null&&<ReelModal reel={Object.keys(editReel).length?editReel:null} locs={locs} tenantId={tenantId} mediaItems={mediaItems} onClose={()=>setEditReel(null)} onSave={handleSave} notify={notify}/>}
      </div>
    )
  }

  if (subTab === 'settings') {
    return (
      <div style={{maxWidth:600}}>
        <div style={{fontSize:11,color:C.pink,fontWeight:800,letterSpacing:2,marginBottom:4}}>EINSTELLUNGEN</div>
        <div style={{fontSize:24,fontWeight:900,marginBottom:20}}>⚙️ SCENVY FLOW Modul-Konfiguration</div>
        <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Autoplay & Player Verhalten</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Konfiguriere, wie Video-Reels auf den Smartphones der Gäste nach dem QR-Scan abgespielt werden.</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <label style={{display:'flex',alignItems:'center',gap:10,fontSize:13,cursor:'pointer'}}>
              <input type="checkbox" defaultChecked /> Auto-Mute Ton standardmäßig aktivieren
            </label>
            <label style={{display:'flex',alignItems:'center',gap:10,fontSize:13,cursor:'pointer'}}>
              <input type="checkbox" defaultChecked /> Endlose Video-Schleife (Infinite Loop)
            </label>
            <label style={{display:'flex',alignItems:'center',gap:10,fontSize:13,cursor:'pointer'}}>
              <input type="checkbox" defaultChecked /> Swipe-Geste zum nächsten Reel erlauben
            </label>
          </div>
        </div>
      </div>
    )
  }

  // Default 'feed' view
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div><div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:6}}>CONTENT ENGINE</div><div style={{fontSize:24,fontWeight:800}}>Reels Galerie</div></div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={() => setSubTab ? setSubTab('ai_prompter') : setEditReel({})} style={{padding:'9px 16px',borderRadius:9,border:`1px solid ${C.purple}`,background:`${C.purple}22`,color:C.purple,cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:7,fontFamily:'inherit'}}>
            <Sparkles size={14}/>KI Prompter & Generieren
          </button>
          <button onClick={()=>setEditReel({})} style={{padding:'9px 16px',borderRadius:9,border:'none',background:C.purple,color:C.white,cursor:'pointer',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:7,fontFamily:'inherit'}}>
            <Plus size={14}/>Reel manuell erstellen
          </button>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {[
          ['all', 'Alle Reels'],
          ['live', '● Live'],
          ['scheduled', '📅 Geplant'],
          ['draft', '📝 Entwurf'],
          ['paused', '⏸ Pausiert']
        ].map(([f, label]) => (
          <button key={f} onClick={()=>setFilter(f)} style={{padding:'6px 15px',borderRadius:8,border:'none',cursor:'pointer',background:filter===f?C.purple:C.card,color:filter===f?C.white:C.muted,fontSize:13,fontWeight:filter===f?600:400,fontFamily:'inherit'}}>
            {label} ({f==='all'?reels.length:reels.filter(r=>r.status===f).length})
          </button>
        ))}
      </div>

      {shown.length===0 && (
        <div style={{background:C.card,borderRadius:16,padding:40,textAlign:'center',border:`2px dashed ${C.border}`}}>
          <Film size={40} color={C.dim} style={{marginBottom:12}}/>
          <div style={{fontSize:16,color:C.muted}}>Keine Reels in dieser Ansicht.</div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:18}}>
        {shown.map(r=>(
          <div key={r.id} style={{background:C.card,borderRadius:18,overflow:'hidden',border:`1px solid ${C.border}`,boxShadow:'0 4px 20px rgba(0,0,0,0.25)'}}>
            <div style={{height:160,background:r.mediaUrl?'transparent':`linear-gradient(135deg,${r.color||C.purple}44,${C.bg})`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
              {r.mediaUrl ? (
                r.mediaType==='video'||r.mediaUrl.includes('.mp4')?
                  <video src={r.mediaUrl} autoPlay muted loop playsInline style={{width:'100%',height:'100%',objectFit:'cover'}} />:
                  <img src={r.mediaUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
              ) : (
                <div style={{fontSize:48}}>{r.emoji||'🎬'}</div>
              )}

              {/* Status Pill Badge */}
              <div style={{position:'absolute',top:10,left:10}}>
                {r.status==='live' && pill('● LIVE', C.green)}
                {r.status==='scheduled' && pill(`📅 GEPLANT${r.scheduledAt||r.scheduled_at?': '+new Date(r.scheduledAt||r.scheduled_at).toLocaleDateString('de-DE'):''}`, C.orange)}
                {r.status==='draft' && pill('📝 ENTWURF', C.muted)}
                {r.status==='paused' && pill('⏸ PAUSIERT', C.pink)}
              </div>

              <div style={{position:'absolute',top:10,right:10}}>{pill((r.type||'offer').toUpperCase(), r.color||C.purple)}</div>
              {r.mediaUrl&&<div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 40%,rgba(0,0,0,.75))'}}/>}
            </div>

            <div style={{padding:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:20}}>{r.emoji||'🎬'}</span>
                <span style={{fontSize:15,fontWeight:800}}>{r.title}</span>
              </div>
              <div style={{fontSize:12,color:C.muted,marginBottom:6}}>📍 {(r.locationId==='ALL'||r.location_id==='ALL'||!r.location_id||r.locationId==='all') ? '🌐 Alle Standorte (Global)' : (locs.find(l=>l.id===(r.locationId||r.location_id))?.name || r.loc || r.locations?.name || 'Standort')}</div>

              <div style={{fontSize:10,color:C.muted,marginBottom:10,display:'flex',flexDirection:'column',gap:2,background:C.bg,padding:'6px 8px',borderRadius:6,border:`1px solid ${C.border}`}}>
                <div>📅 Erstellt: {formatDateTime(r.created_at || r.createdAt || r.updated_at)}</div>
                <div>⏱️ Aktualisiert: {formatDateTime(r.updated_at || r.updatedAt || r.created_at)}</div>
              </div>

              {r.status==='scheduled' && (
                <div style={{fontSize:11,color:C.orange,fontWeight:700,marginBottom:10,background:`${C.orange}15`,padding:'4px 8px',borderRadius:6}}>
                  📅 Sendezeit: {r.scheduledAt || r.scheduled_at ? formatDateTime(r.scheduledAt || r.scheduled_at) : 'Nicht gewählt'}
                </div>
              )}

              <div style={{display:'flex',gap:6,marginTop:12}}>
                {r.status === 'live' ? (
                  <button onClick={()=>handleUpdateStatus(r, 'paused')} style={{flex:1,padding:'7px 0',borderRadius:8,border:'none',cursor:'pointer',background:`${C.pink}22`,color:C.pink,fontSize:12,fontWeight:700,fontFamily:'inherit'}}>
                    ⏸ Pausieren
                  </button>
                ) : (
                  <button onClick={()=>handleUpdateStatus(r, 'live')} style={{flex:1,padding:'7px 0',borderRadius:8,border:'none',cursor:'pointer',background:`${C.green}22`,color:C.green,fontSize:12,fontWeight:700,fontFamily:'inherit'}}>
                    🚀 Sofort Live
                  </button>
                )}

                <button onClick={()=>setEditReel(r)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${C.border}`,cursor:'pointer',background:C.bg,color:C.blue,display:'flex',alignItems:'center',justifyContent:'center'}} title="Bearbeiten">
                  <Edit2 size={14}/>
                </button>
                <button onClick={()=>handleDelete(r.id)} style={{width:36,height:36,borderRadius:8,border:`1px solid ${C.border}`,cursor:'pointer',background:C.bg,color:C.pink,display:'flex',alignItems:'center',justifyContent:'center'}} title="Löschen">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editReel!==null&&<ReelModal reel={Object.keys(editReel).length?editReel:null} locs={locs} tenantId={tenantId} mediaItems={mediaItems} onClose={()=>setEditReel(null)} onSave={handleSave} notify={notify}/>}
    </div>
  )
}

// ── AI Generator ──────────────────────────────────────────
function AIGenerator({ tenantId, locs, notify }) {
  const [inputMode,   setInputMode]   = useState('text') // 'text' | 'image' | 'video'
  const [form,        setForm]        = useState({ venue:'', offer:'', type:'offer', tone:'exciting', ctaUrl:'' })
  const [locationId,  setLocationId]  = useState('ALL')
  const [imgPreview,  setImgPreview]  = useState(null)
  const [imgDesc,     setImgDesc]     = useState('')
  const [result,      setResult]      = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [uploading,   setUploading]   = useState(false)

  // Status and scheduling choice for AI generated reel
  const [saveStatus,   setSaveStatus]   = useState('draft')
  const [scheduledAt,  setScheduledAt]  = useState('')

  const fileRef = useRef()
  const saveReel = useSaveReel()
  const { data: mediaItems = [] } = useMedia(tenantId)
  const [showMediathek, setShowMediathek] = useState(false)

  const PRESET_PROMPTS = [
    { label: '🍸 Signature Cocktail Happy Hour', text: '50% auf alle Signature Cocktails von 18 bis 20 Uhr mit Live-DJ' },
    { label: '🥩 Sizzling Tomahawk Steak', text: 'Zartes Angus Ribeye Steak frisch vom Grill serviert mit Trüffel-Pommes' },
    { label: '🥐 Sunday Luxury Brunch', text: 'Exklusiver All-You-Can-Eat Sonntagsbrunch inklusive Champagner-Empfang' },
    { label: '🎉 Weekend DJ Party Night', text: 'Weekend Vibes mit DJ Beats, Cocktails und Shisha auf der Rooftop Terrasse' },
    { label: '🍣 Sushi Omakase Experience', text: 'Frisches Omakase Sushi Set zubereitet vom Meisterköche-Team' }
  ]

  const handleImgFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    setUploading(true)
    try { const url = await uploadMedia(f, tenantId); setImgPreview(url) }
    catch { notify('❌ Upload fehlgeschlagen') }
    setUploading(false)
  }

  const generate = async () => {
    const offerText = inputMode==='image' ? imgDesc : form.offer
    if (!offerText.trim()) { notify('Bitte Beschreibung oder Prompt eingeben'); return }
    const loc = locs.find(l=>l.id===locationId)
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/ai/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ ...form, venue:loc?.name||form.venue, offer:offerText, isVideo: inputMode==='video' })
      })
      const data = await res.json()
      const media = data.imageUrl || data.mediaUrl
      if (media) setImgPreview(media)
      setResult(data)
    } catch {
      const moodMap={offer:'purple',event:'pink',menu:'blue',promo:'orange'}
      const fallbackImg = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop'
      const fallbackVid = 'https://assets.mixkit.co/videos/preview/mixkit-barman-preparing-a-cocktail-in-a-glass-42867-large.mp4'
      const media = inputMode === 'video' ? fallbackVid : fallbackImg
      setImgPreview(media)
      setResult({
        hook:'JETZT ERLEBEN 🔥',
        headline:offerText.length>40?offerText.slice(0,40)+'…':offerText,
        subtext:'Exklusiv für dich vorbereitet — jetzt entdecken!',
        cta:'Jetzt reservieren',
        hashtags:['scenvy',form.type,'gastronomie'],
        emoji: inputMode === 'video' ? '🎥' : '🍸',
        urgency:'Nur für begrenzte Zeit',
        colorMood:moodMap[form.type]||'purple',
        imageUrl: media,
        mediaUrl: media,
        mediaType: inputMode === 'video' ? 'video' : 'image'
      })
    }
    setLoading(false)
  }

  const save = async () => {
    const cm={purple:C.purple,pink:C.pink,blue:C.blue,orange:C.orange,green:C.green}
    const loc = locs.find(l=>l.id===locationId)
    try {
      await saveReel.mutateAsync({
        reel:{
          tenant_id:tenantId,
          location_id:locationId,
          locationId:locationId,
          title:result.headline,
          type:form.type,
          status:saveStatus,
          scheduledAt: scheduledAt,
          scheduled_at: scheduledAt,
          color:cm[result.colorMood]||C.purple,
          emoji:result.emoji,
          cta:result.cta,
          cta_url:form.ctaUrl,
          cta_action:'url',
          mediaUrl:imgPreview,
          media_type: inputMode==='video' ? 'video' : 'image',
          loc:loc?.name || (locationId === 'ALL' ? 'Alle Standorte' : '')
        },
        tenantId
      })
      notify(`✨ KI-Reel als "${saveStatus.toUpperCase()}" gespeichert!`)
      setResult(null); setImgPreview(null); setImgDesc(''); setForm(f=>({...f,offer:'',ctaUrl:''}))
    } catch(e) { notify('❌ ' + e.message) }
  }

  const accent = result ? ({purple:C.purple,pink:C.pink,blue:C.blue,orange:C.orange,green:C.green}[result.colorMood]||C.purple) : C.purple

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:C.pink,fontWeight:800,letterSpacing:2,marginBottom:4}}>GOOGLE GEMINI KI</div>
        <div style={{fontSize:24,fontWeight:900}}>Reel Generator & KI Prompter ✨</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>
          Beschreibe dein Angebot oder lade ein Bild/Video hoch → Google Gemini KI generiert das komplette Reel inklusive fotorealistischem KI-Bild oder Video-Visual.
        </div>
      </div>

      <div style={{display:'flex',gap:6,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:4,marginBottom:20,width:'fit-content'}}>
        {[
          ['text','✏️ Prompt / Beschreibung'],
          ['video','🎥 KI Video Reel'],
          ['image','📸 Foto Upload']
        ].map(([m,label])=>(
          <button key={m} onClick={()=>setInputMode(m)} style={{padding:'8px 18px',borderRadius:9,border:'none',cursor:'pointer',background:inputMode===m?C.purple:'transparent',color:inputMode===m?C.white:C.muted,fontWeight:inputMode===m?700:400,fontSize:13,fontFamily:'inherit'}}>{label}</button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:14,fontWeight:800,marginBottom:16}}>1. Eingabe & KI Prompter</div>

          {inputMode==='image'&&(
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>BILD HOCHLADEN</label>
              <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${imgPreview?C.purple:C.border}`,borderRadius:12,overflow:'hidden',cursor:'pointer',minHeight:100,display:'flex',alignItems:'center',justifyContent:'center',background:`${C.purple}08`,position:'relative'}}>
                {uploading ? <div style={{textAlign:'center'}}><RefreshCw size={22} color={C.purple} style={{animation:'spin 1s linear infinite'}}/></div>
                  : imgPreview ? <img src={imgPreview} style={{width:'100%',maxHeight:140,objectFit:'cover'}} alt=""/>
                  : <div style={{textAlign:'center',padding:16}}><Image size={24} color={C.purple} style={{marginBottom:6}}/><div style={{fontSize:12,color:C.muted}}>Foto hochladen</div></div>}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImgFile} style={{display:'none'}}/>
              </div>
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>DEINE IDEE / ANGEBOTS-PROMPT *</label>
            <textarea
              value={inputMode==='image' ? imgDesc : form.offer}
              onChange={e => inputMode==='image' ? setImgDesc(e.target.value) : setForm(p=>({...p,offer:e.target.value}))}
              rows={3}
              placeholder="z.B. Saftiges Wagyu Burger Special mit Trüffel-Mayo und krossen Pommes im Kerzenschein..."
              style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}}
            />
          </div>

          {/* Quick Preset Prompts */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6,fontWeight:600}}>SCHNELLE PROMPT-VORLAGEN:</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (inputMode==='image') setImgDesc(p.text)
                    else setForm(f => ({ ...f, offer: p.text }))
                  }}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    color: C.white,
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>STANDORT</label>
              <select value={locationId} onChange={e=>setLocationId(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.card2,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}>
                <option value="ALL">🌐 Alle Standorte (Global / ALL)</option>
                {locs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>TYP</label>
              <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.card2,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}>
                <option value="offer">🏷️ Angebot</option><option value="event">🎉 Event</option><option value="menu">🍽️ Menü</option><option value="promo">⚡ Promo</option>
              </select>
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,letterSpacing:1,fontWeight:600}}>CTA-BUTTON ZIEL (URL)</label>
            <input value={form.ctaUrl} onChange={e=>setForm(p=>({...p,ctaUrl:e.target.value}))} placeholder="https://app.scenvy.de/..." style={{width:'100%',padding:'10px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}/>
          </div>

          <button onClick={generate} disabled={loading} style={{width:'100%',padding:'14px 0',borderRadius:12,border:'none',cursor:loading?'wait':'pointer',background:loading?C.dim:grad(C.purple,C.pink),color:C.white,fontWeight:800,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',gap:10,fontFamily:'inherit'}}>
            {loading?<><RefreshCw size={18} style={{animation:'spin 1s linear infinite'}}/>Generiere KI Reel...</>:<><Sparkles size={18}/>Reel mit Gemini KI erstellen</>}
          </button>
        </div>

        <div>
          {!result ? (
            <div style={{background:C.card,borderRadius:16,padding:24,border:`2px dashed ${C.border}`,height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
              <Sparkles size={44} color={C.dim} style={{marginBottom:16}}/>
              <div style={{fontSize:16,fontWeight:700,color:C.muted}}>Generierte KI Vorschau</div>
              <div style={{fontSize:12,color:C.dim,marginTop:4,maxWidth:260}}>Klicke links auf "Reel erstellen", um Hook, Emojis, Farbstimmung & KI Visualisierung zu erhalten.</div>
            </div>
          ) : (
            <div>
              <div style={{background:`linear-gradient(160deg,${accent}28,${C.bg} 70%)`,border:`2px solid ${accent}44`,borderRadius:22,padding:20,marginBottom:14,animation:'fadeUp .3s ease'}}>
                {imgPreview && (
                  <div style={{position:'relative',borderRadius:14,overflow:'hidden',marginBottom:14,maxHeight:220}}>
                    <img src={imgPreview} style={{width:'100%',maxHeight:220,objectFit:'cover',display:'block'}} alt=""/>
                    <div style={{position:'absolute',inset:0,background:`linear-gradient(180deg,transparent 40%,${C.bg} 100%)`}}/>
                  </div>
                )}
                <div style={{background:`linear-gradient(180deg,${accent}33,${C.bg})`,borderRadius:16,padding:'24px 20px',textAlign:'center',marginBottom:14,display:'flex',flexDirection:'column',justifyContent:'space-between',minHeight:200,position:'relative',overflow:'hidden'}}>
                  <div style={{fontSize:44,animation:'pulse 2s ease-in-out infinite',position:'relative'}}>{result.emoji}</div>
                  <div style={{position:'relative'}}>
                    <div style={{fontSize:12,fontWeight:800,color:accent,letterSpacing:2,marginBottom:7}}>{result.hook}</div>
                    <div style={{fontSize:18,fontWeight:800,lineHeight:1.28,marginBottom:9}}>{result.headline}</div>
                    <div style={{fontSize:13,color:'rgba(255,255,255,.7)',marginBottom:10}}>{result.subtext}</div>
                    {result.urgency&&<div style={{fontSize:12,color:accent,fontWeight:600}}>⏱ {result.urgency}</div>}
                  </div>
                  <button style={{padding:'11px 28px',borderRadius:13,border:'none',background:accent,color:C.white,fontWeight:700,fontSize:15,cursor:'pointer',marginTop:12}}>{result.cta} →</button>
                </div>
              </div>

              {/* Status and Schedule Selection before save */}
              <div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:C.white}}>VERÖFFENTLICHUNGS-STATUS:</div>
                <div style={{display:'flex',gap:8,marginBottom:10}}>
                  {[
                    ['draft', '📝 Entwurf'],
                    ['scheduled', '📅 Geplant'],
                    ['live', '🚀 Sofort Live']
                  ].map(([st, lbl]) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSaveStatus(st)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: saveStatus === st ? `1px solid ${C.purple}` : `1px solid ${C.border}`,
                        background: saveStatus === st ? `${C.purple}22` : C.bg,
                        color: saveStatus === st ? C.white : C.muted,
                        fontSize: 12,
                        fontWeight: saveStatus === st ? 700 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {saveStatus === 'scheduled' && (
                  <div>
                    <label style={{fontSize:11,color:C.orange,display:'block',marginBottom:4,fontWeight:700}}>DATUM & UHRZEIT:</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                      style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${C.orange}`,background:C.bg,color:C.white,fontSize:12}}
                    />
                  </div>
                )}
              </div>

              <div style={{display:'flex',gap:10}}>
                <button onClick={save} style={{flex:1,padding:'12px 0',borderRadius:10,border:'none',cursor:'pointer',background:accent,color:C.white,fontWeight:800,fontSize:14,fontFamily:'inherit'}}>
                  ✓ Reel Speichern ({saveStatus.toUpperCase()})
                </button>
                <button onClick={()=>setResult(null)} style={{padding:'12px 18px',borderRadius:10,border:`1px solid ${C.border}`,background:'transparent',color:C.muted,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Nochmal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Location Modal ────────────────────────────────────────
function LocationModal({ location, tenantId, onClose, onSave, notify }) {
  const [name,    setName]    = useState(location?.name    || '')
  const [city,    setCity]    = useState(location?.city    || '')
  const [address, setAddress] = useState(location?.address || '')
  const [zip,     setZip]     = useState(location?.zip     || '')
  const [country, setCountry] = useState(location?.country || 'DE')
  const [active,  setActive]  = useState(location?.active !== false)

  const save = () => {
    if (!name.trim()) { notify('Bitte Standortname eingeben'); return }
    onSave({
      ...(location?.id ? { id: location.id } : {}),
      name, city, address, zip, country, active, tenant_id: tenantId
    })
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(10px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,width:'100%',maxWidth:480,padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:18,display:'flex',alignItems:'center',gap:8}}>
            <MapPin size={20} color={C.purple}/>
            <span>{location?.id ? 'Standort bearbeiten' : 'Neuen Standort anlegen'}</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer'}}><X size={20}/></button>
        </div>

        <div style={{display:'grid',gap:14}}>
          <div>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>STANDORTNAME *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Rooftop Lounge Berlin" style={{width:'100%',padding:'10px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}/>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>STRASSE & NR.</label>
            <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Alexanderplatz 1" style={{width:'100%',padding:'10px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1fr',gap:10}}>
            <div>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>PLZ</label>
              <input value={zip} onChange={e=>setZip(e.target.value)} placeholder="10178" style={{width:'100%',padding:'10px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>STADT</label>
              <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Berlin" style={{width:'100%',padding:'10px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>LAND</label>
              <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="DE" style={{width:'100%',padding:'10px 14px',borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none'}}/>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:4}}>
            <button
              type="button"
              onClick={() => setActive(!active)}
              style={{
                width: 40, height: 22, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: active ? C.green : C.dim, position: 'relative', transition: 'background 0.2s'
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: active ? 21 : 3, transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: active ? C.green : C.muted }}>
              {active ? '● Standort Aktiv' : '○ Standort Deaktiviert'}
            </span>
          </div>
        </div>

        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button onClick={save} style={{flex:1,padding:'12px 0',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:800,fontSize:14,cursor:'pointer'}}>
            ✓ Standort Speichern
          </button>
          <button onClick={onClose} style={{padding:'12px 18px',borderRadius:10,border:`1px solid ${C.border}`,background:'transparent',color:C.muted,cursor:'pointer',fontSize:13}}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Locations Page ────────────────────────────────────────
function LocationsPage({ locs, tenantId, notify }) {
  const [editLoc, setEditLoc] = useState(null)
  const { data: tenant } = useTenant(tenantId)
  const saveLoc = useSaveLocation()
  const deleteLoc = useDeleteLocation()

  const maxLocations = tenant?.max_locations
    ? Number(tenant.max_locations)
    : (tenant?.plan === 'pro' ? 5 : tenant?.plan === 'enterprise' ? 10 : 1)

  const handleAddNew = () => {
    if (locs.length >= maxLocations) {
      notify(`⚠️ Standort-Limit erreicht (${locs.length}/${maxLocations}). Das Paket erlaubt max. ${maxLocations} Standort${maxLocations > 1 ? 'e' : ''}. Für weitere Standorte wende dich bitte an den Support/Admin.`)
      return
    }
    setEditLoc({})
  }

  const handleSave = async (data) => {
    try {
      await saveLoc.mutateAsync({ location: data, tenantId })
      notify('✅ Standort gespeichert')
      setEditLoc(null)
    } catch (e) {
      notify('❌ Fehler beim Speichern: ' + e.message)
    }
  }

  const handleToggleActive = async (loc) => {
    try {
      await saveLoc.mutateAsync({ location: { ...loc, active: !loc.active }, tenantId })
      notify(loc.active ? 'Standort deaktiviert' : '✅ Standort aktiviert')
    } catch {
      notify('❌ Fehler beim Aktualisieren')
    }
  }

  const handleDelete = async (loc) => {
    if (!window.confirm(`Möchtest du den Standort "${loc.name}" wirklich löschen?`)) return
    try {
      await deleteLoc.mutateAsync({ id: loc.id, tenantId })
      notify('🗑️ Standort gelöscht')
    } catch (e) {
      notify('❌ Fehler beim Löschen')
    }
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,flexWrap:'wrap',gap:16}}>
        <div>
          <div style={{fontSize:11,color:C.pink,fontWeight:800,letterSpacing:2,marginBottom:4}}>STANDORTE</div>
          <div style={{fontSize:24,fontWeight:900}}>Standorte & QR-Venues</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4}}>Verwalte deine Tische, Venues, QR-Punkte und Adressen.</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{
            fontSize:12,fontWeight:800,padding:'8px 16px',borderRadius:20,
            background: locs.length >= maxLocations ? `${C.orange}22` : `${C.purple}22`,
            color: locs.length >= maxLocations ? C.orange : C.purple,
            border: `1px solid ${locs.length >= maxLocations ? C.orange : C.purple}44`,
            display:'flex',alignItems:'center',gap:6
          }}>
            <MapPin size={14}/> {locs.length} / {maxLocations} Standorte belegt
          </div>
          <button onClick={handleAddNew} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:800,fontSize:14,cursor:'pointer'}}>
            <Plus size={16}/> Neuer Standort
          </button>
        </div>
      </div>

      {locs.length >= maxLocations && (
        <div style={{background:`${C.orange}15`,border:`1px solid ${C.orange}44`,borderRadius:14,padding:'14px 18px',marginBottom:20,fontSize:13,color:C.white,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:18}}>⚠️</span>
            <div>
              <strong>Standort-Limit erreicht ({locs.length}/{maxLocations} Slots)</strong>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>Das Standard-Paket erlaubt bis zu 5 Standorte (1 im Testbereich). Du benötigst mehr? Ein Platform-Admin kann das Limit in den Mandanten-Einstellungen manuell erweitern.</div>
            </div>
          </div>
        </div>
      )}

      {locs.length === 0 ? (
        <div style={{background:C.card,borderRadius:16,padding:48,textAlign:'center',border:`2px dashed ${C.border}`}}>
          <MapPin size={44} color={C.dim} style={{marginBottom:12}}/>
          <div style={{fontSize:16,fontWeight:800,color:C.white}}>Noch keine Standorte hinterlegt</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4,marginBottom:20}}>Erstelle deinen ersten Standort, um QR-Codes zu generieren und Reels zuzuordnen.</div>
          <button onClick={handleAddNew} style={{padding:'10px 20px',borderRadius:10,border:'none',background:C.purple,color:C.white,fontWeight:700,fontSize:13,cursor:'pointer'}}>
            + Standort Hinzufügen
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:18}}>
          {locs.map(l => (
            <div key={l.id} style={{background:C.card,borderRadius:18,padding:22,border:`1px solid ${C.border}`,position:'relative'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div>
                  <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>{l.name}</div>
                  <div style={{fontSize:12,color:C.muted,display:'flex',alignItems:'center',gap:4}}>
                    <MapPin size={12} color={C.purple}/> {l.address ? `${l.address}, ` : ''}{l.city || 'Berlin'}
                  </div>
                </div>
                <span style={{
                  fontSize:10,fontWeight:800,padding:'4px 10px',borderRadius:12,
                  background: l.active ? `${C.green}22` : `${C.dim}44`,
                  color: l.active ? C.green : C.muted,
                  border: `1px solid ${l.active ? C.green : C.border}44`
                }}>
                  {l.active ? '● AKTIV' : '○ INAKTIV'}
                </span>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,background:C.bg,borderRadius:12,padding:12,marginBottom:16,border:`1px solid ${C.border}`}}>
                <div>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700}}>GÄSTE SCANS</div>
                  <div style={{fontSize:16,fontWeight:800,color:C.blue}}>{(l.scans||0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700}}>WATCH RATE</div>
                  <div style={{fontSize:16,fontWeight:800,color:C.green}}>{l.wr||88}%</div>
                </div>
              </div>

              <div style={{display:'flex',gap:8}}>
                <button
                  onClick={() => handleToggleActive(l)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                    background: l.active ? `${C.orange}22` : `${C.green}22`,
                    color: l.active ? C.orange : C.green,
                    fontSize: 12, fontWeight: 700, fontFamily: 'inherit'
                  }}
                >
                  {l.active ? 'Deaktivieren' : 'Aktivieren'}
                </button>
                <button
                  onClick={() => setEditLoc(l)}
                  style={{ padding: '8px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.blue, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                  title="Bearbeiten"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(l)}
                  style={{ padding: '8px 12px', borderRadius: 9, border: `1px solid ${C.pink}44`, background: `${C.pink}11`, color: C.pink, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                  title="Standort Löschen"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editLoc !== null && (
        <LocationModal
          location={Object.keys(editLoc).length ? editLoc : null}
          tenantId={tenantId}
          onClose={() => setEditLoc(null)}
          onSave={handleSave}
          notify={notify}
        />
      )}
    </div>
  )
}

// ── QR Page ───────────────────────────────────────────────
function QRPage({ locs, notify }) {
  return (
    <div>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:C.pink,fontWeight:800,letterSpacing:2,marginBottom:4}}>GÄSTE-CATCHER</div>
        <div style={{fontSize:24,fontWeight:900}}>QR-Codes & Tischaufsteller</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>Generiere hochauflösende QR-Codes für Tische, Theken und Werbe-Aufsteller.</div>
      </div>

      {locs.length === 0 ? (
        <div style={{background:C.card,borderRadius:16,padding:40,textAlign:'center',border:`2px dashed ${C.border}`}}>
          <QrCode size={40} color={C.dim} style={{marginBottom:12}}/>
          <div style={{fontSize:15,fontWeight:700,color:C.white}}>Keine Standorte vorhanden</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4}}>Lege zuerst einen Standort an, um QR-Codes zu generieren.</div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:20}}>
          {locs.map(l => {
            const guestUrl = getGuestUrl(l.id)
            return (
              <div key={l.id} style={{background:C.card,borderRadius:20,padding:24,border:`1px solid ${C.border}`,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{fontSize:18,fontWeight:800,marginBottom:2}}>{l.name}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:16}}>📍 {l.city || 'Berlin'}</div>

                <div style={{background:'#fff',padding:16,borderRadius:16,boxShadow:'0 10px 30px rgba(0,0,0,0.5)',marginBottom:16}}>
                  <img src={qrImageUrl(l.id, 200)} alt="QR Code" style={{width:180,height:180,display:'block'}}/>
                </div>

                <div style={{fontSize:11,color:C.blue,background:`${C.blue}15`,padding:'6px 12px',borderRadius:8,marginBottom:18,wordBreak:'break-all',maxWidth:'100%'}}>
                  🔗 {guestUrl}
                </div>

                <div style={{display:'flex',gap:8,width:'100%',flexWrap:'wrap'}}>
                  <button onClick={() => downloadQR(l.id, l.name)} style={{flex:1,minWidth:140,padding:'10px 0',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,fontWeight:700,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    <Download size={14}/> Download PNG
                  </button>
                  <button onClick={async () => { await copyToClipboard(guestUrl); notify('📋 Link in Zwischenablage kopiert!') }} style={{padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                    📋 Link
                  </button>
                  <button onClick={() => window.open(guestUrl, '_blank')} style={{padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:C.purple,fontWeight:700,fontSize:12,cursor:'pointer'}} title="Vorschau Öffnen">
                    <ExternalLink size={14}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Media Library Page ────────────────────────────────────
function MediaLibraryPage({ tenantId, notify }) {
  const { data: media=[], isLoading } = useMedia(tenantId)
  const saveMedia = useSaveMedia()
  const deleteMedia = useDeleteMedia()
  const fileRef = useRef(null)

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files||[])
    if (!files.length) return
    for (const f of files) {
      try {
        const url = await uploadMedia(f, tenantId)
        await saveMedia.mutateAsync({ media:{ url, type:f.type?.startsWith('video')?'video':'image', name:f.name, size:f.size }, tenantId })
      } catch(err) { notify('❌ ' + err.message) }
    }
    notify('✅ Upload erfolgreich')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (m) => {
    try { await deleteMedia.mutateAsync({ id:m.id, tenantId }); notify('Gelöscht') }
    catch(e) { notify('❌ ' + e.message) }
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:6}}>MEDIA</div>
          <div style={{fontSize:24,fontWeight:800}}>Mediathek</div>
        </div>
        <button onClick={()=>fileRef.current?.click()} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit'}}>
          <Upload size={16}/> Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleUpload} style={{display:'none'}}/>
      </div>

      {isLoading ? (
        <div style={{padding:40,textAlign:'center',color:C.muted}}>Lade Mediathek...</div>
      ) : media.length === 0 ? (
        <div style={{padding:60,textAlign:'center',background:C.card,borderRadius:16,border:`1px solid ${C.border}`}}>
          <Library size={40} color={C.muted} style={{marginBottom:12}}/>
          <div style={{fontSize:14,color:C.muted}}>Noch keine Medien. Lade Bilder oder Videos hoch.</div>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14}}>
          {media.map(m=>(
            <div key={m.id} style={{background:C.card,borderRadius:12,overflow:'hidden',border:`1px solid ${C.border}`,position:'relative'}}>
              {m.type==='video' ? (
                <video src={m.url} style={{width:'100%',height:140,objectFit:'cover'}} muted/>
              ) : (
                <img src={m.url} style={{width:'100%',height:140,objectFit:'cover'}} alt={m.name||''}/>
              )}
              <div style={{padding:10}}>
                <div style={{fontSize:11,color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name||'Unbenannt'}</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                  <span style={{fontSize:10,color:C.dim}}>{m.size?`${(m.size/1024/1024).toFixed(1)} MB`:''}</span>
                  <button onClick={()=>handleDelete(m)} style={{background:'none',border:'none',color:C.pink,cursor:'pointer',padding:4}}><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Company Settings Page ─────────────────────────────────
function CompanySettingsPage({ tenantId, notify }) {
  const { data: tenant, isLoading } = useTenant(tenantId)
  const saveTenant = useSaveTenantProfile()
  const [form, setForm] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState(null)

  useEffect(() => {
    if (!form && !isLoading) {
      setForm({
        company_name: tenant?.company_name || tenant?.name || '',
        company_address: tenant?.company_address || '',
        company_zip: tenant?.company_zip || '',
        company_city: tenant?.company_city || '',
        company_country: tenant?.company_country || 'DE',
        contact_name: tenant?.contact_name || '',
        contact_email: tenant?.contact_email || '',
        contact_phone: tenant?.contact_phone || '',
        vat_id: tenant?.vat_id || '',
        website: tenant?.website || '',
      })
    }
  }, [tenant, isLoading, form])

  if (isLoading || !form) return <div style={{padding:40,textAlign:'center',color:C.muted}}>Lade Firmendaten...</div>

  const setF = (k,v) => {
    setForm(f=>({...f,[k]:v}))
    setIsDirty(true)
  }

  const save = async () => {
    try {
      await saveTenant.mutateAsync({ id:tenantId, updates:form })
      setIsDirty(false)
      setLastSavedTime(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      notify('✅ Firmendaten erfolgreich gespeichert!')
    } catch(e) {
      notify('❌ ' + e.message)
    }
  }

  const input = (label, key, placeholder, type='text', icon) => (
    <div>
      <label style={{fontSize:11,color:C.muted,display:'block',marginBottom:6,fontWeight:600,letterSpacing:1}}>{label}</label>
      <div style={{position:'relative'}}>
        {icon&&<span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',display:'flex'}}>{icon}</span>}
        <input value={form[key]} onChange={e=>setF(key,e.target.value)} placeholder={placeholder} type={type}
          style={{width:'100%',padding:`11px 14px ${icon?'11px 34px':'11px 14px'}`,borderRadius:9,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:13,outline:'none',fontFamily:'inherit'}}/>
      </div>
    </div>
  )

  return (
    <div style={{maxWidth:700, position:'relative'}}>
      <div style={{display:'flex',justify:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:6}}>COMPANY</div>
          <div style={{fontSize:24,fontWeight:800}}>Firmendaten & Einstellungen</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4}}>Verwalte deine Unternehmensdaten für Rechnungen und Kontakt</div>
        </div>

        {lastSavedTime && !isDirty && (
          <div style={{fontSize:11,color:C.green,background:`${C.green}15`,padding:'6px 12px',borderRadius:20,border:`1px solid ${C.green}33`,fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
            ✓ Zuerst um {lastSavedTime} Uhr gespeichert
          </div>
        )}
      </div>

      <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:18}}>Unternehmen</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {input('FIRMENNAME *','company_name','Mein Restaurant GmbH')}
          {input('WEBSITE','website','www.mein-restaurant.de')}
          {input('STRASSE & NR.','company_address','Musterstr. 1')}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            {input('PLZ','company_zip','12345')}
            {input('STADT','company_city','Berlin')}
            {input('LAND','company_country','DE')}
          </div>
        </div>
      </div>

      <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`,marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:18}}>Kontaktperson</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
          {input('NAME','contact_name','Max Mustermann')}
          {input('E-MAIL','contact_email','kontakt@firma.de','email',<Mail size={14} color={C.muted}/>)}
          {input('TELEFON','contact_phone','+49 123 456789','tel',<Phone size={14} color={C.muted}/>)}
        </div>
      </div>

      <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`,marginBottom:24}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:18}}>Steuer</div>
        {input('UST-ID','vat_id','DE123456789')}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <button onClick={save} disabled={saveTenant.isPending}
          style={{display:'flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:10,border:'none',background:grad(C.purple,C.pink),color:C.white,cursor:saveTenant.isPending?'wait':'pointer',fontWeight:700,fontSize:14,fontFamily:'inherit'}}>
          <Save size={16}/> {saveTenant.isPending?'Speichert...':'Firmendaten speichern'}
        </button>

        {isDirty && (
          <span style={{fontSize:12,color:C.orange,fontWeight:700,animation:'pulse 1.5s infinite'}}>
            ⚠️ Ungespeicherte Änderungen – bitte auf Speichern klicken!
          </span>
        )}
      </div>

      {/* Persistent Floating Unsaved Notification Bar */}
      {isDirty && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: C.card,
          border: `1px solid ${C.orange}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          borderRadius: 16,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          zIndex: 99999
        }}>
          <span style={{fontSize: 13, fontWeight: 700, color: C.white}}>
            ✏️ Du hast Änderungen in den Einstellungen vorgenommen.
          </span>
          <button onClick={save} disabled={saveTenant.isPending} style={{
            padding: '8px 18px',
            borderRadius: 8,
            background: grad(C.purple, C.pink),
            color: C.white,
            border: 'none',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer'
          }}>
            {saveTenant.isPending ? 'Speichert...' : 'Jetzt Speichern'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Board Showcase Module ─────────────────────────────────
function BoardShowcase({ user, tenant }) {
  const tenantId = tenant?.id || user?.tenant_id || 'tenant_default'
  const { data: displays = [], isLoading } = useDisplays(tenantId)
  const { data: playlists = [] } = usePlaylists(tenantId)
  const saveDisplay = useSaveDisplay()

  const [newScreenName, setNewScreenName] = useState('')
  const [newScreenLoc, setNewScreenLoc] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [launching, setLaunching] = useState(false)

  const handleAddDisplay = async (e) => {
    e.preventDefault()
    if (!newScreenName.trim()) return
    await saveDisplay.mutateAsync({
      tenantId,
      display: {
        name: newScreenName,
        location: newScreenLoc || 'Eingangsbereich',
        status: 'online',
        playlistId: playlists[0]?.id || 'pl_default'
      }
    })
    setNewScreenName('')
    setNewScreenLoc('')
    setIsAdding(false)
  }

  const handleLaunchBoard = async () => {
    setLaunching(true)
    try {
      await launchSubdomainModule('board.scenvy.de', user, tenant, true)
    } catch (e) {
      console.warn('Launch board notice:', e)
    } finally {
      setTimeout(() => setLaunching(false), 800)
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Top Banner Launch Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(29,78,216,0.08) 100%)',
        borderRadius: 20,
        border: '1px solid rgba(59,130,246,0.3)',
        padding: 32,
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 11, color: '#60A5FA', fontWeight: 800, letterSpacing: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
            DIGITAL SIGNAGE SUBSYSTEM (board.scenvy.de)
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.white, lineHeight: 1.2, marginBottom: 10 }}>
            📺 SCENVY Board Signage Hub
          </div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            Steuere TV-Bildschirme, digitale Menükarten & Video-Loops in Echtzeit. Der Zugriff erfolgt direkt über die dedizierte App auf <code style={{ color: C.white }}>board.scenvy.de</code> mit automatischer Mandanten-Synchronisation.
          </div>
        </div>

        <button
          onClick={handleLaunchBoard}
          disabled={launching}
          style={{
            padding: '16px 32px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: C.white,
            border: 'none',
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <ExternalLink size={18} />
          {launching ? 'Öffne board.scenvy.de...' : 'In board.scenvy.de einsteigen (SSO) →'}
        </button>
      </div>

      {/* WebStudio CMS Banner Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(124,58,237,0.1) 100%)',
        borderRadius: 20,
        border: '1px solid rgba(16,185,129,0.3)',
        padding: 28,
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 11, color: '#34D399', fontWeight: 800, letterSpacing: 2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            WEBSITE & LANDING PAGE BUILDER & STUDIO
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.white, lineHeight: 1.2, marginBottom: 8 }}>
            🌐 SCENVY Webseiten Studio & CMS Backend
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            Erstelle und bearbeite deine Landing-Pages mit vollem visuellen Baukasten, WYSIWYG Inspector, Schriftgrößen-Anpassung, Custom CSS Animationen und sofortiger Veröffentlichung unter <code style={{ color: C.white }}>/p/{'{slug}'}</code>.
          </div>
        </div>

        <button
          onClick={() => nav('/website-studio')}
          style={{
            padding: '14px 28px',
            borderRadius: 12,
            background: '#10B981',
            color: '#000',
            border: 'none',
            fontWeight: 900,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 6px 20px rgba(16,185,129,0.3)'
          }}
        >
          🚀 Webstudio & CMS Editor Öffnen →
        </button>
      </div>

      {/* Display Fleet Summary */}
      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>📺 Registrierte Display-Bildschirme ({displays.length})</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Mandant: {tenant?.name || tenantId}</div>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            style={{ padding: '8px 16px', borderRadius: 8, background: `${C.blue}22`, color: C.blue, border: `1px solid ${C.blue}44`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {isAdding ? 'Abbrechen' : '+ Neuer Bildschirm hinzufügen'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddDisplay} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: C.bg, padding: 16, borderRadius: 12, marginBottom: 20, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Neues Display registrieren</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                type="text"
                placeholder="Bildschirm-Name (z.B. Bar TV 4K)"
                value={newScreenName}
                onChange={e => setNewScreenName(e.target.value)}
                style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Standort/Bereich (z.B. Eingangsbereich)"
                value={newScreenLoc}
                onChange={e => setNewScreenLoc(e.target.value)}
                style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.white, fontSize: 13, outline: 'none' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px', background: C.blue, color: C.white, border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: 13, alignSelf: 'flex-start' }}>
              ✓ Display Registrieren
            </button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {displays.length === 0 ? (
            <div style={{ padding: 24, background: C.bg, borderRadius: 12, textAlign: 'center', color: C.muted, fontSize: 13, gridColumn: '1 / -1' }}>
              Noch keine Bildschirme registriert. Nutze den Button oben oder verwalte deine Flotte direkt in <strong>board.scenvy.de</strong>.
            </div>
          ) : (
            displays.map(d => (
              <div key={d.id} style={{ background: C.bg, padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>{d.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: `${C.green}22`, color: C.green }}>
                      ● ONLINE
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>📍 {d.location || 'Hauptraum'}</div>
                </div>

                <button
                  onClick={handleLaunchBoard}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, color: C.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <ExternalLink size={13} /> Auf board.scenvy.de steuern
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Host Showcase Module ──────────────────────────────────
function HostShowcase() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.green, fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>GEBUCHTES MODUL</div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>🏨 SCENVY HOST — Digital Guest Concierge & Services</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          Mache Zimmer, Tische und Lounges mit digitalen Gäste-Services, Raum-Bestellungen und Feedback-Loops erreichbar.
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 32, textAlign: 'center', maxWidth: 680, margin: '40px auto 0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${C.green}22`, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ConciergeBell size={32} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Modul "SCENVY HOST" aktiv</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
          Digitale Gästemappe, Room-Service Bestellungen, Tisch-Rufknöpfe & automatisches Gäste-Feedback über QR-Codes am Platz.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'left', marginBottom: 28 }}>
          <div style={{ background: C.bg, padding: 14, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 4 }}>🔔 Service-Ruf</div>
            <div style={{ fontSize: 11, color: C.muted }}>Gäste rufen Kellner oder Zimmerservice mit 1-Klick am Handy</div>
          </div>
          <div style={{ background: C.bg, padding: 14, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 4 }}>📖 Gästemappe</div>
            <div style={{ fontSize: 11, color: C.muted }}>WLAN, Infos, Ausflugstipps & Hausordnung immer aktuell</div>
          </div>
          <div style={{ background: C.bg, padding: 14, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 4 }}>⭐ Live-Bewertung</div>
            <div style={{ fontSize: 11, color: C.muted }}>Google-Bewertungen steigern, indem Feedback direkt erfasst wird</div>
          </div>
        </div>

        <button style={{ padding: '12px 28px', borderRadius: 12, background: C.green, color: C.white, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          🛎️ Service-Tische & QR-Aufsteller konfigurieren
        </button>
      </div>
    </div>
  )
}

// ── Analytics Component ─────────────────────────────────────
function Analytics({ tenantId, locs = [], reels = [] }) {
  const { data: summary, isLoading } = useAnalyticsSummary(tenantId)
  const [timeframe, setTimeframe] = useState('week') // 'day' | 'week' | 'month' | 'year' | 'all'
  const [isReset, setIsReset] = useState(() => {
    try {
      return localStorage.getItem(`scenvy_analytics_reset_${tenantId}`) === 'true'
    } catch { return false }
  })

  const liveCount = reels.filter(r => r.status === 'live').length
  const scheduledCount = reels.filter(r => r.status === 'scheduled').length

  const handleResetAnalytics = () => {
    if (window.confirm('Möchtest du alle Analytics-Daten wirklich auf 0 zurücksetzen?\n\nDies ist ideal beim Wechsel vom Test- in den Live-Betrieb.')) {
      setIsReset(true)
      try {
        localStorage.setItem(`scenvy_analytics_reset_${tenantId}`, 'true')
      } catch (e) { console.warn(e) }
    }
  }

  const handleRestoreAnalytics = () => {
    setIsReset(false)
    try {
      localStorage.removeItem(`scenvy_analytics_reset_${tenantId}`)
    } catch (e) { console.warn(e) }
  }

  // Raw default baseline
  const baseTotalScans = summary?.totalScans || (locs.reduce((s,l) => s + (l.scans || 0), 0) || 418)

  // Calculate metrics based on timeframe and reset status
  let totalScans = isReset ? 0 : baseTotalScans
  let totalViews = isReset ? 0 : Math.round(totalScans * 2.6)
  let ctrVal = isReset ? '0.0%' : '44.8%'
  let dwellTime = isReset ? '0.0s' : '8.4s'

  if (!isReset) {
    if (timeframe === 'day') {
      totalScans = Math.round(baseTotalScans * 0.18)
      totalViews = Math.round(totalScans * 2.4)
      ctrVal = '48.2%'
    } else if (timeframe === 'week') {
      totalScans = baseTotalScans
      totalViews = Math.round(totalScans * 2.6)
      ctrVal = '44.8%'
    } else if (timeframe === 'month') {
      totalScans = Math.round(baseTotalScans * 3.8)
      totalViews = Math.round(totalScans * 2.7)
      ctrVal = '45.1%'
    } else if (timeframe === 'year') {
      totalScans = Math.round(baseTotalScans * 28.5)
      totalViews = Math.round(totalScans * 2.8)
      ctrVal = '43.9%'
    } else if (timeframe === 'all') {
      totalScans = Math.round(baseTotalScans * 34.2)
      totalViews = Math.round(totalScans * 2.9)
      ctrVal = '44.2%'
    }
  }

  // Chart datasets per timeframe
  const chartDatasets = {
    day: [
      { day: '08:00', scans: isReset ? 0 : 4, views: isReset ? 0 : 10, ctr: isReset ? 0 : 40 },
      { day: '11:00', scans: isReset ? 0 : 12, views: isReset ? 0 : 28, ctr: isReset ? 0 : 43 },
      { day: '13:00', scans: isReset ? 0 : 28, views: isReset ? 0 : 65, ctr: isReset ? 0 : 51 },
      { day: '16:00', scans: isReset ? 0 : 15, views: isReset ? 0 : 38, ctr: isReset ? 0 : 45 },
      { day: '19:00', scans: isReset ? 0 : 34, views: isReset ? 0 : 82, ctr: isReset ? 0 : 54 },
      { day: '21:00', scans: isReset ? 0 : 18, views: isReset ? 0 : 42, ctr: isReset ? 0 : 46 },
    ],
    week: [
      { day: 'Mo', scans: isReset ? 0 : 42, views: isReset ? 0 : 110, ctr: isReset ? 0 : 38 },
      { day: 'Di', scans: isReset ? 0 : 55, views: isReset ? 0 : 145, ctr: isReset ? 0 : 41 },
      { day: 'Mi', scans: isReset ? 0 : 68, views: isReset ? 0 : 180, ctr: isReset ? 0 : 44 },
      { day: 'Do', scans: isReset ? 0 : 74, views: isReset ? 0 : 195, ctr: isReset ? 0 : 48 },
      { day: 'Fr', scans: isReset ? 0 : 112, views: isReset ? 0 : 290, ctr: isReset ? 0 : 52 },
      { day: 'Sa', scans: isReset ? 0 : 140, views: isReset ? 0 : 360, ctr: isReset ? 0 : 58 },
      { day: 'So', scans: isReset ? 0 : 95, views: isReset ? 0 : 240, ctr: isReset ? 0 : 46 }
    ],
    month: [
      { day: 'Woche 1', scans: isReset ? 0 : 280, views: isReset ? 0 : 720, ctr: isReset ? 0 : 42 },
      { day: 'Woche 2', scans: isReset ? 0 : 390, views: isReset ? 0 : 1010, ctr: isReset ? 0 : 45 },
      { day: 'Woche 3', scans: isReset ? 0 : 440, views: isReset ? 0 : 1180, ctr: isReset ? 0 : 47 },
      { day: 'Woche 4', scans: isReset ? 0 : 510, views: isReset ? 0 : 1390, ctr: isReset ? 0 : 49 },
    ],
    year: [
      { day: 'Jan', scans: isReset ? 0 : 920, views: isReset ? 0 : 2400, ctr: isReset ? 0 : 39 },
      { day: 'Feb', scans: isReset ? 0 : 1050, views: isReset ? 0 : 2800, ctr: isReset ? 0 : 41 },
      { day: 'Mär', scans: isReset ? 0 : 1180, views: isReset ? 0 : 3100, ctr: isReset ? 0 : 42 },
      { day: 'Apr', scans: isReset ? 0 : 1340, views: isReset ? 0 : 3600, ctr: isReset ? 0 : 44 },
      { day: 'Mai', scans: isReset ? 0 : 1490, views: isReset ? 0 : 3950, ctr: isReset ? 0 : 45 },
      { day: 'Jun', scans: isReset ? 0 : 1620, views: isReset ? 0 : 4300, ctr: isReset ? 0 : 46 },
      { day: 'Jul', scans: isReset ? 0 : 1850, views: isReset ? 0 : 4900, ctr: isReset ? 0 : 48 },
    ],
    all: [
      { day: 'Q1 2025', scans: isReset ? 0 : 2400, views: isReset ? 0 : 6100, ctr: isReset ? 0 : 38 },
      { day: 'Q2 2025', scans: isReset ? 0 : 3800, views: isReset ? 0 : 9800, ctr: isReset ? 0 : 41 },
      { day: 'Q3 2025', scans: isReset ? 0 : 4900, views: isReset ? 0 : 12400, ctr: isReset ? 0 : 43 },
      { day: 'Q4 2025', scans: isReset ? 0 : 5600, views: isReset ? 0 : 14200, ctr: isReset ? 0 : 44 },
      { day: 'Q1 2026', scans: isReset ? 0 : 6800, views: isReset ? 0 : 17900, ctr: isReset ? 0 : 46 },
      { day: 'Q2 2026', scans: isReset ? 0 : 8100, views: isReset ? 0 : 21500, ctr: isReset ? 0 : 47 },
    ]
  }

  const chartData = chartDatasets[timeframe] || chartDatasets.week

  // Historical Monthly Documentation Data
  const monthlyHistory = isReset ? [] : [
    { month: 'Juli 2026', scans: 1850, views: 4900, ctr: '48.2%', topReel: 'Trüffel Burrata Special' },
    { month: 'Juni 2026', scans: 1620, views: 4300, ctr: '46.1%', topReel: 'Summer Happy Hour' },
    { month: 'Mai 2026', scans: 1490, views: 3950, ctr: '45.0%', topReel: 'Tagliolini al Tartufo' },
    { month: 'April 2026', scans: 1340, views: 3600, ctr: '44.3%', topReel: 'Aperol Spritz Special' },
    { month: 'März 2026', scans: 1180, views: 3100, ctr: '42.5%', topReel: 'Dry Aged Ribeye' },
  ]

  const locStats = locs.map(l => {
    const locReels = reels.filter(r => r.locationId === l.id || r.location_id === l.id || r.locationId === 'ALL' || r.location_id === 'ALL')
    return {
      id: l.id,
      name: l.name,
      city: l.city || 'Berlin',
      reelsCount: locReels.length,
      scans: isReset ? 0 : (l.scans || Math.floor(totalScans * 0.4)),
      ctr: isReset ? '0.0%' : ((l.ctr || 42.5) + '%'),
      status: l.active !== false ? 'Aktiv' : 'Inaktiv'
    }
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: C.pink, fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>PERFORMANCE TRACKING</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>📊 Analytics & Performance Dashboard</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Echtzeit-Auswertung aller QR-Code-Scans, Reel-Aufrufe, Interaktionen und Konversionen.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isReset ? (
            <button onClick={handleRestoreAnalytics} style={{ padding: '8px 14px', borderRadius: 10, background: `${C.blue}20`, border: `1px solid ${C.blue}`, color: C.blue, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} /> Testdaten wiederherstellen
            </button>
          ) : (
            <button onClick={handleResetAnalytics} style={{ padding: '8px 14px', borderRadius: 10, background: `${C.pink}15`, border: `1px solid ${C.pink}44`, color: C.pink, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={14} /> Analytics auf 0 zurücksetzen (Live-Modus)
            </button>
          )}
        </div>
      </div>

      {/* Timeframe Selector Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', background: C.card, padding: 6, borderRadius: 12, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        {[
          { id: 'day', label: 'Heute (Tag)' },
          { id: 'week', label: 'Diese Woche' },
          { id: 'month', label: 'Dieser Monat' },
          { id: 'year', label: 'Dieses Jahr' },
          { id: 'all', label: 'Gesamt (All-Time)' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTimeframe(t.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: timeframe === t.id ? grad(C.purple, C.pink) : 'transparent',
              color: timeframe === t.id ? C.white : C.muted,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>QR-CODE SCANS</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.purple}22`, color: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.white }}>{totalScans}</div>
          <div style={{ fontSize: 12, color: isReset ? C.muted : C.green, fontWeight: 700, marginTop: 6 }}>
            {isReset ? 'Bereit für Live-Betrieb' : '↑ +18.4% ggü. Vorperiode'}
          </div>
        </div>

        <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>FEED AUFRUFE</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.pink}22`, color: C.pink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.white }}>{totalViews}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{liveCount} Aktive Reels live</div>
        </div>

        <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>CLICK-THROUGH-RATE (CTR)</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.blue}22`, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MousePointer size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.white }}>{ctrVal}</div>
          <div style={{ fontSize: 12, color: isReset ? C.muted : C.green, fontWeight: 700, marginTop: 6 }}>
            {isReset ? 'Keine Klicks erfasst' : '↑ +5.2% Klicks auf CTA-Buttons'}
          </div>
        </div>

        <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>DURCHSCHN. VERWEILDAUER</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.orange}22`, color: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.white }}>{dwellTime}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Pro Gast im 9:16 Feed</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 28 }}>
        <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: C.white }}>📱 Scans & Video-Aufrufe ({timeframe.toUpperCase()})</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Verteilung der Gäste-Interaktionen</div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke={C.muted} fontSize={12} tickLine={false} />
                <YAxis stroke={C.muted} fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ background: '#181824', border: `1px solid ${C.purple}`, borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="scans" name="QR Scans" fill={C.purple} radius={[4, 4, 0, 0]} />
                <Bar dataKey="views" name="Feed Aufrufe" fill={C.pink} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: C.white }}>🎯 Klick-Konversion (%)</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Verhältnis von Scans zu CTA-Klicks</div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke={C.muted} fontSize={12} tickLine={false} />
                <YAxis stroke={C.muted} fontSize={12} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: '#181824', border: `1px solid ${C.blue}`, borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="ctr" name="CTR %" stroke={C.blue} strokeWidth={3} dot={{ fill: C.blue, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly History Documentation */}
      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24, marginBottom: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: C.white }}>📚 Monatliche Analytics-Historie & Dokumentation</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Übersicht der Performance vergangener Monate</div>

        {monthlyHistory.length === 0 ? (
          <div style={{ padding: 24, background: C.bg, borderRadius: 12, textAlign: 'center', color: C.muted, fontSize: 13 }}>
            Keine vergangenen Monats-Historien erfasst (Analytics auf 0 zurückgesetzt).
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontWeight: 700 }}>
                  <th style={{ padding: '10px 14px' }}>MONAT</th>
                  <th style={{ padding: '10px 14px' }}>QR SCANS</th>
                  <th style={{ padding: '10px 14px' }}>FEED AUFRUFE</th>
                  <th style={{ padding: '10px 14px' }}>CTR %</th>
                  <th style={{ padding: '10px 14px' }}>TOP PERFORMING REEL</th>
                </tr>
              </thead>
              <tbody>
                {monthlyHistory.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${C.border}44` }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: C.white }}>{m.month}</td>
                    <td style={{ padding: '12px 14px', color: C.purple, fontWeight: 700 }}>{m.scans.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: C.pink, fontWeight: 700 }}>{m.views.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: C.blue, fontWeight: 700 }}>{m.ctr}</td>
                    <td style={{ padding: '12px 14px', color: C.white }}>🎬 {m.topReel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Locations Stats */}
      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.border}`, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: C.white }}>📍 Standorte & Performance Übersicht</div>
        {locStats.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 20 }}>Noch keine Standorte hinterlegt.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>STANDORT</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>STADT</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>REELS</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>SCANS</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>CTR</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {locStats.map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}33` }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: C.white }}>{s.name}</td>
                    <td style={{ padding: '12px 14px', color: C.muted }}>{s.city}</td>
                    <td style={{ padding: '12px 14px', color: C.white, fontWeight: 700 }}>{s.reelsCount} Reels</td>
                    <td style={{ padding: '12px 14px', color: C.purple, fontWeight: 800 }}>{s.scans} Scans</td>
                    <td style={{ padding: '12px 14px', color: C.green, fontWeight: 700 }}>{s.ctr}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${C.green}22`, color: C.green }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const nav = useNavigate()
  const { user, logout, stopImpersonation } = useAuth()
  const tenantId = user?.tenant_id

  const { data: reels=[], isLoading: reelsLoading } = useReels(tenantId)
  const { data: locs=[],  isLoading: locsLoading  } = useLocations(tenantId)
  const { data: tenant,   isLoading: tenantLoading } = useTenant(tenantId)

  const [page,      setPage]      = useState('overview')
  const [moduleTab, setModuleTab] = useState('feed')
  const [open,      setOpen]      = useState(true)
  const [lang,      setLang]      = useState(() => localStorage.getItem('scenvy_lang')||'de')
  const [toast,     setToast]     = useState(null)

  // Reset or initialize subTab whenever module page changes
  const handleSetPage = (newPage) => {
    setPage(newPage)
    if (newPage === 'reels') setModuleTab('feed')
    else if (newPage === 'menu_generator' || newPage === 'menu') setModuleTab('create')
    else if (newPage === 'board') setModuleTab('overview')
    else if (newPage === 'host') setModuleTab('overview')
  }

  const t = T[lang]
  const notify = msg => { setToast(msg); setTimeout(()=>setToast(null), 3000) }

  if (reelsLoading || locsLoading || tenantLoading) return (
    <div style={{height:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:open?'center':'center'}}>
      <div style={{width:40,height:40,borderRadius:'50%',border:`3px solid ${C.purple}`,borderTopColor:'transparent',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:C.bg,fontFamily:"'Inter',sans-serif",color:C.white}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}} @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}} @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}`}</style>

      {user?.isImpersonating && (
        <div style={{
          background: 'linear-gradient(90deg, #7C3AED 0%, #FF2D8D 100%)',
          color: '#fff',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          fontWeight: 700,
          zIndex: 1000,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={16} />
            <span>PLATFORM ADMIN IMPERSONATION MODUS: Du verwaltest den Mandanten "{user?.tenant?.name || 'Mandant'}" (ID: {user?.tenant_id?.slice(0,12)}...)</span>
          </div>
          <button
            onClick={() => { stopImpersonation(); nav('/admin') }}
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              padding: '4px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 12,
              fontFamily: 'inherit'
            }}
          >
            ← Zurück zum Platform Admin Portal
          </button>
        </div>
      )}

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <Sidebar page={page} setPage={handleSetPage} open={open} setOpen={setOpen} t={t} user={user} logout={logout} tenant={tenant}/>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* SCENVY Ecosystem Module Switcher Bar */}
        <AppLauncherBar user={user} tenant={tenant} activePage={page} setPage={handleSetPage} />

        {/* Top bar */}
        <div style={{height:60,borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',padding:'0 24px',justifyContent:'space-between',flexShrink:0,background:C.bg}}>
          {/* Left: Tenant Profile & Page Badge */}
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: grad(C.purple, C.pink),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 900,
              color: C.white,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(139,92,246,0.3)'
            }}>
              {(user?.tenant?.name || user?.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:C.white,display:'flex',alignItems:'center',gap:8}}>
                <span>{user?.tenant?.name || user?.name || 'Scenvy Partner'}</span>
                <span style={{fontSize:9,padding:'2px 7px',borderRadius:6,background:`${C.green}22`,color:C.green,fontWeight:800,border:`1px solid ${C.green}44`}}>
                  {(user?.tenant?.plan || 'PRO PLATFORM').toUpperCase()}
                </span>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:1,display:'flex',alignItems:'center',gap:6}}>
                <span>Mandant #{tenantId ? tenantId.slice(0, 8) : '001'}</span>
                <span style={{color:C.border}}>•</span>
                <span style={{color:C.purple,fontWeight:700}}>{page.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Right: Language, domain, user avatar & Logout Button */}
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex',background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:2}}>
              {[['de','🇩🇪'],['en','🇬🇧']].map(([l,f])=>(
                <button key={l} onClick={()=>{setLang(l);localStorage.setItem('scenvy_lang',l)}} style={{padding:'2px 8px',borderRadius:5,border:'none',cursor:'pointer',background:lang===l?C.purple:'transparent',fontSize:14,fontFamily:'inherit'}}>{f}</button>
              ))}
            </div>
            <div style={{fontSize:12,color:C.muted,display:'none',alignItems:'center',gap:4}} className="md:flex">
              app.scenvy.de
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 10px',background:C.card2,borderRadius:8,border:`1px solid ${C.border}`}}>
              <div style={{width:24,height:24,borderRadius:'50%',background:grad(C.purple,C.pink),display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11}}>
                {(user?.name||user?.email||'?')[0].toUpperCase()}
              </div>
              <span style={{fontSize:12,fontWeight:600,color:C.white}}>{user?.name || user?.email?.split('@')[0]}</span>
            </div>
            <button
              onClick={logout}
              title={t.logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: `1px solid ${C.pink}44`,
                background: `${C.pink}11`,
                color: C.pink,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 12,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${C.pink}22`; e.currentTarget.style.borderColor = C.pink }}
              onMouseLeave={(e) => { e.currentTarget.style.background = `${C.pink}11`; e.currentTarget.style.borderColor = `${C.pink}44` }}
            >
              <LogOut size={15}/>
              <span>{t.logout || 'Abmelden'}</span>
            </button>
          </div>
        </div>

        {/* Second Line Sub-Header for Active Module */}
        <ModuleSubHeader
          activeModule={page}
          activeTab={moduleTab}
          setActiveTab={setModuleTab}
          reelsCount={reels.length}
        />

        <div style={{flex:1,overflowY:'auto',padding:28}}>
          {page==='overview'  && <Overview   setPage={handleSetPage} reels={reels} locs={locs} t={t}/>}
          {page==='reels'     && <ReelsPage  reels={reels} locs={locs} tenantId={tenantId} notify={notify} t={t} subTab={moduleTab} setSubTab={setModuleTab}/>}
          {page==='locations' && <LocationsPage locs={locs} tenantId={tenantId} notify={notify}/>}
          {page==='analytics' && <Analytics  tenantId={tenantId} locs={locs} reels={reels}/>}
          {page==='ai'        && <AIGenerator tenantId={tenantId} locs={locs} notify={notify}/>}
          {(page==='menu_generator' || page==='menu') && <MenuGenerator embedded={true} initialTab={moduleTab} />}
          {page==='board'     && <BoardShowcase user={user} tenant={tenant} />}
          {page==='host'      && <HostShowcase />}
          {page==='qr'        && <QRPage     locs={locs} notify={notify}/>}
          {page==='media'     && <MediaLibraryPage tenantId={tenantId} notify={notify}/>}
          {page==='company'   && <CompanySettingsPage tenantId={tenantId} notify={notify}/>}
          {page==='settings'  && (
            <div style={{display:'grid',gap:20,maxWidth:800}}>
              <div>
                <div style={{fontSize:11,color:C.pink,fontWeight:700,letterSpacing:2,marginBottom:4}}>ACCOUNT & BILLING</div>
                <div style={{fontSize:24,fontWeight:800,marginBottom:16}}>Einstellungen & Abonnements</div>
              </div>

              <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.purple}44`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:12}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:C.white}}>Aktuelles Plattform-Abonnement</div>
                    <div style={{fontSize:13,color:C.muted,marginTop:2}}>Gültig für alle Standorte, KI-Reels & Speisekarten-Generierung</div>
                  </div>
                  <span style={{padding:'6px 14px',background:`${C.purple}22`,color:C.purple,borderRadius:20,fontWeight:800,fontSize:12,border:`1px solid ${C.purple}44`}}>
                    ● {(user?.tenant?.plan || 'PRO').toUpperCase()} PLAN
                  </span>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,background:C.bg,padding:16,borderRadius:12,border:`1px solid ${C.border}`,marginBottom:16}}>
                  <div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700}}>STANDORTE / CAPACITY</div>
                    <div style={{fontSize:15,fontWeight:800,color:C.white,marginTop:2}}>{locs.length} Standorte belegt</div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700}}>REELS & CREATIVE CONTENT</div>
                    <div style={{fontSize:15,fontWeight:800,color:C.white,marginTop:2}}>{reels.length} aktive Reels</div>
                  </div>
                </div>

                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  <button
                    onClick={async () => {
                      notify('⌛ Öffne Stripe Customer Portal...')
                      const res = await createStripePortal({
                        customerId: user?.tenant?.stripe_customer_id || 'cus_demo_123',
                        tenantId: tenantId,
                        returnUrl: window.location.href
                      })
                      if (res?.url) window.open(res.url, '_blank')
                    }}
                    style={{
                      padding:'11px 20px',
                      borderRadius:10,
                      border:'none',
                      background:grad(C.purple, C.pink),
                      color:C.white,
                      fontWeight:800,
                      fontSize:13,
                      cursor:'pointer',
                      display:'flex',
                      alignItems:'center',
                      gap:8
                    }}
                  >
                    <ExternalLink size={15}/> Stripe Kundenportal öffnen & Rechnungen
                  </button>
                </div>
              </div>

              <div style={{background:C.card,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>Dein Account & Kontaktdaten</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:8}}>E-Mail: <span style={{color:C.white,fontWeight:600}}>{user?.email}</span></div>
                <div style={{fontSize:13,color:C.muted}}>Mandant-ID: <span style={{color:C.dim,fontSize:12,fontFamily:'monospace'}}>{tenantId}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {toast&&<div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',background:C.purple,color:C.white,padding:'12px 24px',borderRadius:14,fontSize:13,fontWeight:600,zIndex:9999,animation:'fadeUp .25s ease'}}>{toast}</div>}
  </div>
  )
}

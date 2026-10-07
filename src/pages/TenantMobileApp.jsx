import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, grad } from '@/tokens'
import { ScenvyLogoFull, ScenvyLogoIcon } from '@/components/ScenvyLogo'
import { useAuth } from '@/lib/AuthContext'
import {
  useTenant,
  useMenuReels,
  useSaveMenuReel,
  useDeleteMenuReel,
  useReels,
  useSaveReel,
  useDeleteReel,
  useDisplays,
  useSaveDisplay,
  usePlaylists,
  useLocations,
  useOrders,
  useUpdateOrderStatus,
  useServiceCalls,
  useUpdateServiceCallStatus,
  useSubmitServiceCall,
  useSubmitOrder,
  useAnalyticsSummary,
  uploadMedia,
  formatDateTime
} from '@/lib/db'
import { copyToClipboard, downloadQR, qrImageUrl } from '@/storage'
import {
  Home,
  Utensils,
  Bell,
  QrCode,
  Settings,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Edit3,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Monitor,
  Eye,
  Phone,
  MapPin,
  Receipt,
  ShoppingCart,
  Download,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Globe,
  Search,
  CheckSquare,
  Film,
  Tv,
  Play,
  Pause,
  Layers,
  Video,
  Image
} from 'lucide-react'
import MobileFlowTab from '@/components/mobile/MobileFlowTab'
import MobileBoardTab from '@/components/mobile/MobileBoardTab'

// Web Audio chime for restaurant service calls
function playServiceChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Tone 1
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    // Tone 2
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.15) // A5
    gain2.gain.setValueAtTime(0.35, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.15)
    osc2.stop(now + 0.7)
  } catch (e) {
    // AudioContext might be restricted until user gesture
  }
}

export default function TenantMobileApp() {
  const nav = useNavigate()
  const { user, logout } = useAuth()
  const tenantId = user?.tenant_id

  // Data queries
  const { data: tenant, isLoading: loadingTenant } = useTenant(tenantId)
  const { data: menuReels = [], isLoading: loadingMenus, refetch: refetchMenus } = useMenuReels(tenantId)
  const { data: reels = [], isLoading: loadingReels } = useReels(tenantId)
  const { data: displays = [], isLoading: loadingDisplays } = useDisplays(tenantId)
  const { data: playlists = [] } = usePlaylists(tenantId)
  const { data: locations = [], isLoading: loadingLocations } = useLocations(tenantId)
  const { data: serviceCalls = [], isLoading: loadingCalls, refetch: refetchCalls } = useServiceCalls(tenantId)
  const { data: orders = [], isLoading: loadingOrders, refetch: refetchOrders } = useOrders(tenantId)
  const { data: analytics } = useAnalyticsSummary(tenantId)

  // Mutations
  const saveMenuReel = useSaveMenuReel()
  const deleteMenuReel = useDeleteMenuReel()
  const saveReel = useSaveReel()
  const deleteReel = useDeleteReel()
  const saveDisplay = useSaveDisplay()
  const updateServiceCallStatus = useUpdateServiceCallStatus()
  const updateOrderStatus = useUpdateOrderStatus()
  const submitServiceCall = useSubmitServiceCall()
  const submitOrder = useSubmitOrder()

  // App State: 'home' (Hub) | 'flow' (SCENVY FLOW) | 'menu' (SCENVY MENU) | 'host' (SCENVY HOST) | 'board' (SCENVY BOARD)
  const [activeTab, setActiveTab] = useState('home')
  const [selectedLocId, setSelectedLocId] = useState('all')
  const [toast, setToast] = useState(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [lastCallCount, setLastCallCount] = useState(0)

  // SCENVY FLOW: Reel creation & AI Generator with Vorlage Upload
  const [showFlowModal, setShowFlowModal] = useState(false)
  const [flowGenMode, setFlowGenMode] = useState('video') // 'video' | 'image'
  const [flowOfferText, setFlowOfferText] = useState('')
  const [flowType, setFlowType] = useState('offer')
  const [flowTemplateMedia, setFlowTemplateMedia] = useState(null)
  const [flowTemplateType, setFlowTemplateType] = useState('image')
  const [flowTemplateUseMode, setFlowTemplateUseMode] = useState('both') // 'both' | 'inspiration_only' | 'direct_media'
  const [flowUploadingTemplate, setFlowUploadingTemplate] = useState(false)
  const [flowGenerating, setFlowGenerating] = useState(false)
  const [activePreviewReel, setActivePreviewReel] = useState(null)
  const [reelToDelete, setReelToDelete] = useState(null)
  const flowCameraInputRef = useRef(null)
  const flowFileInputRef = useRef(null)

  // SCENVY HOST: Sub-tabs 'live' (Rufe & Bestellungen) | 'tables' (Tische & QR)
  const [hostSubTab, setHostSubTab] = useState('live')

  // SCENVY BOARD: Signage Mode & Display Fleet (im Ansatz)
  const [boardPlayMode, setBoardPlayMode] = useState('reels') // 'reels' | 'menu' | 'splitscreen'
  const [showAddDisplayModal, setShowAddDisplayModal] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newDisplayLoc, setNewDisplayLoc] = useState('')
  const [showTvPairingModal, setShowTvPairingModal] = useState(false)

  // Settings Modal (Top Right)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false)

  // AI Menu Snap Modal State
  const [showSnapModal, setShowSnapModal] = useState(false)
  const [snapCartEnabled, setSnapCartEnabled] = useState(false)
  const [snapLanguage, setSnapLanguage] = useState('en')
  const [snapStyle, setSnapStyle] = useState('fine_dining')
  const [isSnapping, setIsSnapping] = useState(false)
  const [snapProgressStep, setSnapProgressStep] = useState('')
  const [snapFilePreview, setSnapFilePreview] = useState(null)
  const [snapFileBase64, setSnapFileBase64] = useState(null)
  const [snapFileMime, setSnapFileMime] = useState(null)
  const [snapFileName, setSnapFileName] = useState('')
  const [snapError, setSnapError] = useState(null)

  // Quick Table Availability / Article Editor
  const [editingMenuForArticles, setEditingMenuForArticles] = useState(null)
  const [articleSearchQuery, setArticleSearchQuery] = useState('')

  // Table QR Viewer State
  const [selectedTableNumber, setSelectedTableNumber] = useState(1)
  const [showQrFullscreen, setShowQrFullscreen] = useState(false)

  // Delete confirmation modal
  const [menuToDelete, setMenuToDelete] = useState(null)

  const cameraInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Detect PWA status & iOS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
      setIsStandalone(standalone)

      const ua = window.navigator.userAgent || ''
      const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
      setIsIOS(iOS)

      const handleBeforeInstall = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
      }
      window.addEventListener('beforeinstallprompt', handleBeforeInstall)
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  // Audio gong on new service calls
  useEffect(() => {
    const openCalls = serviceCalls.filter(c => c.status === 'open' || c.status === 'pending')
    if (openCalls.length > lastCallCount && lastCallCount > 0 && audioEnabled) {
      playServiceChime()
      notify(`🔔 Neuer Tisch-Ruf eingegangen (${openCalls.length} offen)!`)
    }
    setLastCallCount(openCalls.length)
  }, [serviceCalls.length])

  // Filtered Calls & Orders
  const openCallsList = useMemo(() => {
    return serviceCalls.filter(c => c.status === 'open' || c.status === 'pending' || !c.status)
  }, [serviceCalls])

  const openOrdersList = useMemo(() => {
    return orders.filter(o => o.status === 'pending' || o.status === 'preparing' || !o.status)
  }, [orders])

  const totalUrgentCount = openCallsList.length + openOrdersList.length

  // First Active Menu
  const activeMenu = useMemo(() => {
    if (menuReels.length > 0) return menuReels[0]
    return null
  }, [menuReels])

  const activeLocation = useMemo(() => {
    if (selectedLocId !== 'all') {
      return locations.find(l => l.id === selectedLocId) || locations[0]
    }
    return locations[0] || null
  }, [locations, selectedLocId])

  // Handle Photo / File selection for AI Snap
  const handleSnapFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSnapFileName(file.name)
    setSnapFileMime(file.type || 'image/jpeg')

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      setSnapFilePreview(result)
      setSnapFileBase64(result)
    }
    reader.readAsDataURL(file)
  }

  // Trigger AI Snap generation from Mobile
  const runAiSnapGeneration = async () => {
    if (!snapFileBase64) {
      notify('⚠️ Bitte nimm zuerst ein Foto auf oder wähle eine Datei.')
      return
    }

    setIsSnapping(true)
    setSnapError(null)
    setSnapProgressStep('📷 Bild & Dokument wird geladen...')

    setTimeout(() => setSnapProgressStep('🤖 SCENVY AI liest Speisen & Getränke...'), 1200)
    setTimeout(() => setSnapProgressStep('🥗 Allergene & Preise werden extrahiert...'), 2400)
    setTimeout(() => setSnapProgressStep('✨ Digitale Mobile Karte wird fertiggestellt...'), 3800)

    try {
      const res = await fetch('/api/ai/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: snapFileBase64,
          fileMimeType: snapFileMime,
          venue: tenant?.name || 'Gourmet Bistro',
          style: snapStyle,
          primaryLanguage: snapLanguage,
          cartEnabled: snapCartEnabled
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Verbindung zum KI-Server fehlgeschlagen.')
      }

      const parsed = await res.json()
      if (!parsed || !parsed.categories) {
        throw new Error('Die KI konnte keine Speisen im Dokument erkennen.')
      }

      parsed.cartEnabled = snapCartEnabled
      if (!parsed.branding) parsed.branding = {}
      parsed.branding.cartEnabled = snapCartEnabled
      parsed.branding.primaryLanguage = snapLanguage

      const newId = crypto.randomUUID()
      const payload = {
        id: newId,
        title: parsed.branding?.name || tenant?.name || 'Neue Speisekarte',
        data: parsed
      }

      await saveMenuReel.mutateAsync({
        menuReel: payload,
        tenantId
      })

      try {
        localStorage.setItem('scenvy_cached_menu', JSON.stringify(parsed))
      } catch (e) {}

      setIsSnapping(false)
      setShowSnapModal(false)
      setSnapFileBase64(null)
      setSnapFilePreview(null)
      notify('✨ Speisekarte erfolgreich per KI erfasst & live geschaltet!')
      refetchMenus()
      setActiveTab('menus')
    } catch (err) {
      console.error('Snap error:', err)
      setIsSnapping(false)
      setSnapError(err.message || 'Fehler bei der Analyse.')
      notify(`⚠️ ${err.message || 'Fehler beim Erfassen'}`)
    }
  }

  // Toggle item availability ("Ausverkauft" / "Verfügbar")
  const toggleItemAvailability = async (menuItem, catId) => {
    if (!editingMenuForArticles) return
    const menuData = editingMenuForArticles.data || editingMenuForArticles
    const newCategories = (menuData.categories || []).map(c => {
      if (c.id !== catId) return c
      return {
        ...c,
        items: (c.items || []).map(it => {
          if (it.id !== menuItem.id) return it
          const nextSoldOut = !it.isSoldOut
          return { ...it, isSoldOut: nextSoldOut }
        })
      }
    })

    const updatedMenu = {
      ...editingMenuForArticles,
      data: {
        ...menuData,
        categories: newCategories
      }
    }

    setEditingMenuForArticles(updatedMenu)

    try {
      await saveMenuReel.mutateAsync({
        menuReel: updatedMenu,
        tenantId
      })
      notify(menuItem.isSoldOut ? `✅ "${menuItem.name?.de || menuItem.name}" wieder verfügbar` : `🚫 "${menuItem.name?.de || menuItem.name}" als ausverkauft markiert`)
    } catch (e) {
      notify('⚠️ Fehler beim Speichern')
    }
  }

  // Quick acknowledge service call
  const handleAcknowledgeCall = async (callId) => {
    try {
      await updateServiceCallStatus.mutateAsync({ id: callId, status: 'completed' })
      notify('✅ Ruf erledigt & quittiert')
      refetchCalls()
    } catch (e) {
      notify('⚠️ Fehler beim Quittieren')
    }
  }

  // Quick change order status
  const handleChangeOrderStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status: nextStatus })
      notify(`✅ Bestellung aktualisiert (${nextStatus})`)
      refetchOrders()
    } catch (e) {
      notify('⚠️ Fehler beim Aktualisieren')
    }
  }

  // Handle Menu Delete
  const handleConfirmDeleteMenu = async (id) => {
    try {
      await deleteMenuReel.mutateAsync({ id, tenantId })
      notify('🗑️ Speisekarte gelöscht')
      setMenuToDelete(null)
      refetchMenus()
    } catch (e) {
      notify('⚠️ Fehler beim Löschen')
      setMenuToDelete(null)
    }
  }

  // SCENVY FLOW Handlers
  const handleFlowTemplateSelected = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFlowUploadingTemplate(true)
    const isVid = f.type?.includes('video') || f.name?.endsWith('.mp4') || f.name?.endsWith('.mov')
    setFlowTemplateType(isVid ? 'video' : 'image')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      setFlowTemplateMedia(base64)
      setFlowUploadingTemplate(false)
      notify('✅ Vorlage hochgeladen & für KI-Analyse bereit!')
      try {
        const uploadedUrl = await uploadMedia(f, tenantId)
        if (uploadedUrl) setFlowTemplateMedia(uploadedUrl)
      } catch (err) {}
    }
    reader.readAsDataURL(f)
  }

  const runFlowAiGeneration = async () => {
    if (!flowOfferText.trim() && !flowTemplateMedia) {
      notify('⚠️ Bitte gib eine Beschreibung oder lade eine Vorlage hoch.')
      return
    }

    setFlowGenerating(true)
    try {
      const isVideo = flowGenMode === 'video'
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: tenant?.name || 'Unser Restaurant',
          offer: flowOfferText || 'Highlight aus Vorlage',
          type: flowType,
          tone: 'exciting',
          isVideo,
          duration: 5,
          userImage: flowTemplateUseMode !== 'inspiration_only' ? flowTemplateMedia : null,
          referenceImage: flowTemplateMedia || null,
          templateUseMode: flowTemplateUseMode
        })
      })

      if (!res.ok) throw new Error('Generierung fehlgeschlagen')
      const data = await res.json()

      const newReel = {
        tenant_id: tenantId,
        title: data.headline || flowOfferText || 'SCENVY Highlight',
        type: flowType,
        status: 'live',
        imageUrl: data.imageUrl || data.mediaUrl || flowTemplateMedia,
        mediaUrl: data.mediaUrl || data.imageUrl || flowTemplateMedia,
        mediaType: data.mediaType || (isVideo ? 'video' : 'image'),
        hook: data.hook || 'JETZT ERLEBEN 🔥',
        subtext: data.subtext || `Exklusiv bei ${tenant?.name || 'uns'}`,
        ctaText: data.cta || 'Jetzt ansehen',
        ctaUrl: '',
        duration: data.duration || 5,
        hashtags: data.hashtags || ['scenvy', flowType],
        emoji: data.emoji || (isVideo ? '🎥' : '✨'),
        urgency: data.urgency || '',
        colorMood: data.colorMood || 'purple',
        location_id: 'ALL'
      }

      await saveReel.mutateAsync({ reel: newReel, tenantId })
      setFlowGenerating(false)
      setShowFlowModal(false)
      setFlowOfferText('')
      setFlowTemplateMedia(null)
      notify('✨ Neues Reel erfolgreich mit KI erstellt & live geschaltet!')
      setActiveTab('flow')
    } catch (err) {
      console.error('Flow AI Gen Error:', err)
      setFlowGenerating(false)
      notify('⚠️ Fehler bei der Reel-Generierung')
    }
  }

  const handleToggleReelStatus = async (reel) => {
    try {
      const nextStatus = reel.status === 'live' ? 'paused' : 'live'
      await saveReel.mutateAsync({
        reel: { ...reel, status: nextStatus },
        tenantId
      })
      notify(nextStatus === 'live' ? '🟢 Reel jetzt LIVE geschaltet' : '⚪ Reel pausiert')
    } catch (e) {
      notify('⚠️ Fehler beim Aktualisieren')
    }
  }

  const handleConfirmDeleteReel = async (id) => {
    try {
      await deleteReel.mutateAsync({ id, tenantId })
      notify('🗑️ Reel gelöscht')
      setReelToDelete(null)
    } catch (e) {
      notify('⚠️ Fehler beim Löschen')
      setReelToDelete(null)
    }
  }

  // SCENVY BOARD Handlers
  const handleAddDisplaySubmit = async (e) => {
    e?.preventDefault()
    if (!newDisplayName.trim()) return
    try {
      await saveDisplay.mutateAsync({
        tenantId,
        display: {
          name: newDisplayName.trim(),
          location: newDisplayLoc.trim() || 'Gastraum',
          status: 'online',
          playlistId: playlists[0]?.id || 'pl_default'
        }
      })
      setNewDisplayName('')
      setNewDisplayLoc('')
      setShowAddDisplayModal(false)
      notify('📺 Neues Display erfolgreich registriert!')
    } catch (e) {
      notify('⚠️ Fehler beim Hinzufügen des Displays')
    }
  }

  // Install PWA trigger
  const handleTriggerPwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        notify('🎉 SCENVY wird auf deinem Startbildschirm installiert!')
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
      setShowIosInstallGuide(true)
    } else {
      notify('ℹ️ Tippe im Browser-Menü auf "Zum Startbildschirm hinzufügen".')
    }
  }

  // Simulate test service call for instant demo
  const handleSimulateCall = async () => {
    try {
      await submitServiceCall.mutateAsync({
        tenantId: tenantId || 'tenant_default',
        tableNumber: `Tisch ${Math.floor(Math.random() * 12) + 1}`,
        type: Math.random() > 0.5 ? 'waiter' : 'bill'
      })
      notify('🔔 Test-Ruf an Service-Terminal gesendet!')
      playServiceChime()
      refetchCalls()
    } catch (e) {
      notify('⚠️ Fehler bei Testruf')
    }
  }

  const liveGuestMenuUrl = activeMenu
    ? `${window.location.origin}/m/${activeMenu.id}?table=Tisch+${selectedTableNumber}`
    : (activeLocation ? `${window.location.origin}/l/${activeLocation.id}` : window.location.origin)

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: '#09090E',
      color: '#F8FAFC',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* ── Fixed Mobile Header ───────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(9, 9, 14, 0.94)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 18,
            color: '#FFF',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
          }}>
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} />
            ) : '🍽️'}
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{tenant?.name || 'SCENVY Partner'}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} title="Live" />
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} color="#7C3AED" />
              <span>{activeLocation?.name || 'Hauptstandort'}</span>
            </div>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: audioEnabled ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${audioEnabled ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: audioEnabled ? '#A78BFA' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={audioEnabled ? 'Gong aktiviert' : 'Gong stummgeschaltet'}
          >
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <a
            href={liveGuestMenuUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFF',
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Eye size={13} color="#EC4899" />
            <span>Gästekarte</span>
          </a>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: activeTab === 'settings' ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${activeTab === 'settings' ? 'rgba(124, 58, 237, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
              color: activeTab === 'settings' ? '#A78BFA' : '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Einstellungen & Profil"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* ── Urgent Service Alert Banner (Floating if pending calls) ── */}
      {totalUrgentCount > 0 && activeTab !== 'service' && (
        <div
          onClick={() => setActiveTab('service')}
          style={{
            margin: '10px 16px 0',
            padding: '10px 14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(185, 28, 28, 0.28))',
            border: '1.5px solid rgba(239, 68, 68, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            animation: 'pulse 1.8s infinite',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.35)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛎️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#FEE2E2' }}>
                {totalUrgentCount} {totalUrgentCount === 1 ? 'offener Service-Ruf / Bestellung' : 'offene Service-Rufe & Bestellungen'}!
              </div>
              <div style={{ fontSize: 11, color: '#FCA5A5' }}>
                Tippe hier zum Quittieren & Bearbeiten
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="#FCA5A5" />
        </div>
      )}

      {/* ── Main Scrollable Body Content ──────────────── */}
      <main style={{
        flex: 1,
        padding: '16px 16px 100px', // Extra bottom padding for thumb navigation
        overflowY: 'auto'
      }}>
        {/* ════════════════════════════════════════════════
            TAB 1: HOME (ÜBERSICHT & SCHNELLAKTIONEN)
            ════════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Quick KPI Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#111622', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <QrCode size={13} color="#7C3AED" />
                  <span>Tisch-Scans Heute</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginTop: 4 }}>
                  {analytics?.total_scans || (menuReels.length > 0 ? 142 : 0)}
                </div>
                <div style={{ fontSize: 11, color: '#10B981', fontWeight: 800, marginTop: 2 }}>
                  ↑ +18% ggü. Vorwoche
                </div>
              </div>

              <div
                onClick={() => setActiveTab('service')}
                style={{
                  background: totalUrgentCount > 0 ? 'rgba(239, 68, 68, 0.12)' : '#111622',
                  border: `1px solid ${totalUrgentCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: 16,
                  padding: '14px 16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: totalUrgentCount > 0 ? '#FCA5A5' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={13} color={totalUrgentCount > 0 ? '#EF4444' : '#F59E0B'} />
                  <span>Offene Rufe</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: totalUrgentCount > 0 ? '#EF4444' : '#FFF', marginTop: 4 }}>
                  {totalUrgentCount}
                </div>
                <div style={{ fontSize: 11, color: totalUrgentCount > 0 ? '#EF4444' : '#94A3B8', fontWeight: 800, marginTop: 2 }}>
                  {totalUrgentCount > 0 ? '⚠️ Sofort quittieren ›' : '✓ Alles erledigt'}
                </div>
              </div>
            </div>

            {/* Quick Action Grid (Big thumb buttons) */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                Schnell-Aktionen
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* 1. Snap Camera Button */}
                <button
                  type="button"
                  onClick={() => setShowSnapModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(236, 72, 153, 0.18))',
                    border: '1.5px solid rgba(124, 58, 237, 0.4)',
                    borderRadius: 16,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>Karte knipsen</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Foto aufnehmen & KI-Start</div>
                  </div>
                </button>

                {/* 2. Live Service Terminal */}
                <button
                  type="button"
                  onClick={() => setActiveTab('service')}
                  style={{
                    background: '#111622',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                    <Bell size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>Service-Terminal</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Tisch-Rufe & KDS live</div>
                  </div>
                </button>

                {/* 3. Table QR Codes */}
                <button
                  type="button"
                  onClick={() => setActiveTab('qrcodes')}
                  style={{
                    background: '#111622',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.18)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                    <QrCode size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>Tisch-QR-Codes</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Für Tische & Gäste</div>
                  </div>
                </button>

                {/* 4. Open Live Guest Menu */}
                <a
                  href={liveGuestMenuUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#111622',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    textDecoration: 'none'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.18)', border: '1px solid rgba(59, 130, 246, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                    <Eye size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>Gast-Ansicht</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Live testen wie Gast</div>
                  </div>
                </a>
              </div>
            </div>

            {/* SCENVY Apps Suite Overview */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  SCENVY Apps Suite
                </span>
                <span style={{ fontSize: 11, color: '#A78BFA', fontWeight: 700 }}>
                  Alle Module integriert
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 1. SCENVY FLOW */}
                <div
                  onClick={() => setActiveTab('flow')}
                  style={{
                    background: '#111622',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                      <Film size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>SCENVY FLOW</span>
                        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 6, background: 'rgba(139, 92, 246, 0.25)', color: '#D8B4FE', fontWeight: 800 }}>
                          KI REELS & STORIES
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        {reels.length} Story-Reels • KI-Generator mit Vorlagen-Upload
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#64748B" />
                </div>

                {/* 2. SCENVY MENU */}
                <div
                  onClick={() => setActiveTab('menu')}
                  style={{
                    background: '#111622',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #F97316 0%, #EAB308 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                      <Utensils size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>SCENVY MENU</span>
                        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 6, background: 'rgba(249, 115, 22, 0.25)', color: '#FED7AA', fontWeight: 800 }}>
                          DIGITALE KARTEN
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        {menuReels.length} Menüs • Snap AI Foto-Erfassung & Ausverkauft-Schalter
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#64748B" />
                </div>

                {/* 3. SCENVY HOST */}
                <div
                  onClick={() => setActiveTab('host')}
                  style={{
                    background: '#111622',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>SCENVY HOST</span>
                        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 6, background: totalUrgentCount > 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)', color: totalUrgentCount > 0 ? '#FCA5A5' : '#A7F3D0', fontWeight: 800 }}>
                          {totalUrgentCount > 0 ? `${totalUrgentCount} OFFEN` : 'SERVICE & KDS'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        Live Kellnerrufe, KDS-Bestellungen & Tisch-QR-Codes
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#64748B" />
                </div>

                {/* 4. SCENVY BOARD (nur im Ansatz) */}
                <div
                  onClick={() => setActiveTab('board')}
                  style={{
                    background: '#111622',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                      <Tv size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>SCENVY BOARD</span>
                        <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', fontWeight: 800 }}>
                          TV SIGNAGE (BASIS)
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                        {displays.length > 0 ? `${displays.length} TV-Screens` : '2 Displays bereit'} • Live-Vorschau & Pairing
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#64748B" />
                </div>
              </div>
            </div>

            {/* Active Digital Menu Card */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Aktive Speisekarte
                </span>
                <button
                  onClick={() => setActiveTab('menus')}
                  style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Alle ({menuReels.length}) ›
                </button>
              </div>

              {activeMenu ? (
                <div style={{ background: '#111622', borderRadius: 18, border: '1px solid rgba(255, 255, 255, 0.08)', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>
                        {activeMenu.branding?.name || activeMenu.title || 'Hauptspeisekarte'}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
                        {activeMenu.data?.categories?.length || activeMenu.categories?.length || 0} Kategorien • {activeMenu.data?.categories?.reduce((s, c) => s + (c.items?.length || 0), 0) || 0} Artikel
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 9px',
                      borderRadius: 8,
                      background: (activeMenu.data?.cartEnabled || activeMenu.cartEnabled) ? 'rgba(16, 185, 129, 0.16)' : 'rgba(124, 58, 237, 0.16)',
                      color: (activeMenu.data?.cartEnabled || activeMenu.cartEnabled) ? '#10B981' : '#A78BFA',
                      fontSize: 10.5,
                      fontWeight: 800
                    }}>
                      {(activeMenu.data?.cartEnabled || activeMenu.cartEnabled) ? '🛒 MIT WARENKORB' : '📖 OHNE WARENKORB'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button
                      onClick={() => setEditingMenuForArticles(activeMenu)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                        color: '#FFF',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <SlidersHorizontal size={14} /> Verfügbarkeit / Ausverkauft
                    </button>
                    <button
                      onClick={() => {
                        copyToClipboard(liveGuestMenuUrl)
                        notify('📋 Menü-Link in Zwischenablage kopiert!')
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#FFF',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#111622', borderRadius: 18, border: '1px dashed rgba(255, 255, 255, 0.15)', padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Noch keine Speisekarte vorhanden</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 14 }}>
                    Knipse einfach deine physische Karte ab und die KI generiert dein digitales Menü in Sekunden.
                  </div>
                  <button
                    onClick={() => setShowSnapModal(true)}
                    style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                  >
                    Jetzt Karte knipsen
                  </button>
                </div>
              )}
            </div>

            {/* PWA Promotion Card if not standalone */}
            {!isStandalone && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(16, 185, 129, 0.12))',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: 18,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📲 Als App auf dem Handy nutzen</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#CBD5E1', marginTop: 3 }}>
                    Ohne Browserleisten, schneller Schnellstart vom Startbildschirm.
                  </div>
                </div>
                <button
                  onClick={handleTriggerPwaInstall}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: '#7C3AED',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Installieren
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: SCENVY FLOW (VIDEO REELS & STORIES)
            ════════════════════════════════════════════════ */}
        {activeTab === 'flow' && (
          <MobileFlowTab
            reels={reels}
            tenantId={tenantId}
            tenant={tenant}
            saveReel={saveReel}
            deleteReel={deleteReel}
            notify={notify}
          />
        )}

        {/* ════════════════════════════════════════════════
            TAB: SCENVY MENU (SPEISEKARTEN & SNAP AI)
            ════════════════════════════════════════════════ */}
        {(activeTab === 'menu' || activeTab === 'menus') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Action Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>Speisekarten</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{menuReels.length} gespeicherte Menüs</div>
              </div>

              <button
                type="button"
                onClick={() => setShowSnapModal(true)}
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
                <Camera size={15} /> <span>Neu knipsen</span>
              </button>
            </div>

            {/* List of Menus */}
            {menuReels.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', background: '#111622', borderRadius: 18, border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Noch keine Speisekarte vorhanden</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 16 }}>
                  Nutze deine Smartphone-Kamera für einen schnellen SNAP.
                </div>
                <button onClick={() => setShowSnapModal(true)} style={{ padding: '10px 18px', borderRadius: 10, background: '#7C3AED', color: '#FFF', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                  Karte jetzt aufnehmen
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {menuReels.map((m) => {
                  const data = m.data || m
                  const branding = data.branding || {}
                  const isCart = data.cartEnabled ?? branding.cartEnabled ?? false
                  const categories = data.categories || []
                  const totalItems = categories.reduce((sum, c) => sum + (c.items?.length || 0), 0)
                  const menuLink = `${window.location.origin}/m/${m.id}`

                  return (
                    <div
                      key={m.id}
                      style={{
                        background: '#111622',
                        borderRadius: 16,
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>
                            {branding.name || m.title || 'Digital Menu'}
                          </div>
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                            {categories.length} Kategorien • {totalItems} Speisen & Getränke
                          </div>
                        </div>

                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isCart ? 'rgba(16, 185, 129, 0.16)' : 'rgba(124, 58, 237, 0.16)',
                          color: isCart ? '#10B981' : '#A78BFA',
                          fontSize: 10,
                          fontWeight: 800
                        }}>
                          {isCart ? '🛒 MIT WARENKORB' : '📖 OHNE WARENKORB'}
                        </span>
                      </div>

                      {/* Action buttons row */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setEditingMenuForArticles(m)}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'rgba(124, 58, 237, 0.18)',
                            border: '1px solid rgba(124, 58, 237, 0.35)',
                            color: '#DDD6FE',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <SlidersHorizontal size={14} /> Verfügbarkeit & Preise
                        </button>

                        <a
                          href={menuLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#FFF',
                            fontSize: 12,
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <Eye size={14} /> Vorschau
                        </a>

                        <button
                          onClick={() => {
                            copyToClipboard(menuLink)
                            notify('📋 Link kopiert!')
                          }}
                          style={{
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#FFF',
                            cursor: 'pointer'
                          }}
                          title="Link kopieren"
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          onClick={() => setMenuToDelete(m)}
                          style={{
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#FCA5A5',
                            cursor: 'pointer'
                          }}
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: SCENVY HOST (BESTELLZENTRALE & TISCHE)
            ════════════════════════════════════════════════ */}
        {(activeTab === 'host' || activeTab === 'service' || activeTab === 'qrcodes') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header with Simulate Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={20} color="#10B981" />
                  <span>SCENVY HOST</span>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Tisch-Rufe, Live-KDS & Tisch-QR-Codes</div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleSimulateCall}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#E2E8F0',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Testruf simulieren"
                >
                  + Test-Ruf
                </button>
                <button
                  onClick={() => { refetchCalls(); refetchOrders(); notify('🔄 Aktualisiert') }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFF',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Segmented Sub-Tab Switcher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#111622', padding: 4, borderRadius: 12 }}>
              <button
                type="button"
                onClick={() => setHostSubTab('live')}
                style={{
                  padding: '9px',
                  borderRadius: 9,
                  border: 'none',
                  background: hostSubTab === 'live' ? '#7C3AED' : 'transparent',
                  color: hostSubTab === 'live' ? '#FFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Bell size={14} />
                <span>Live Rufe & KDS ({totalUrgentCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setHostSubTab('tables')}
                style={{
                  padding: '9px',
                  borderRadius: 9,
                  border: 'none',
                  background: hostSubTab === 'tables' ? '#7C3AED' : 'transparent',
                  color: hostSubTab === 'tables' ? '#FFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <QrCode size={14} />
                <span>Tische & QR ({locations.length || 12})</span>
              </button>
            </div>

            {hostSubTab === 'live' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Section 1: Active Waiter Calls */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={13} color="#EF4444" />
                <span>Offene Tisch-Rufe ({openCallsList.length})</span>
              </div>

              {openCallsList.length === 0 ? (
                <div style={{ background: '#111622', borderRadius: 14, padding: 16, textAlign: 'center', color: '#94A3B8', fontSize: 13, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  ✓ Keine offenen Tisch-Rufe. Alles ruhig!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {openCallsList.map((call) => (
                    <div
                      key={call.id}
                      style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14), rgba(185, 28, 28, 0.18))',
                        border: '1.5px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: 14,
                        padding: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{call.table_number || call.tableNumber || 'Tisch ?'}</span>
                          <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: call.type === 'bill' ? '#F59E0B22' : '#EF444422', color: call.type === 'bill' ? '#F59E0B' : '#FCA5A5', fontWeight: 800 }}>
                            {call.type === 'bill' ? '💳 MÖCHTE ZAHLEN' : '🙋 KELLNER GERUFEN'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 3 }}>
                          ⏱️ {formatDateTime(call.created_at || call.createdAt)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAcknowledgeCall(call.id)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 10,
                          background: '#10B981',
                          color: '#FFF',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Check size={14} /> Quittieren
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Active Orders */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingCart size={13} color="#7C3AED" />
                <span>Offene Tisch-Bestellungen ({openOrdersList.length})</span>
              </div>

              {openOrdersList.length === 0 ? (
                <div style={{ background: '#111622', borderRadius: 14, padding: 16, textAlign: 'center', color: '#94A3B8', fontSize: 13, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  ✓ Keine aktiven Bestellungen.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {openOrdersList.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: '#111622',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 14,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>
                            {order.table_number || order.tableNumber || 'Tisch ?'}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                            ⏱️ {formatDateTime(order.created_at || order.createdAt)}
                          </div>
                        </div>

                        <span style={{ fontSize: 13, fontWeight: 900, color: '#EC4899' }}>
                          {order.total_price || order.totalPrice || '0.00 €'}
                        </span>
                      </div>

                      {/* Items */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 10px', fontSize: 12 }}>
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                            <span><strong>{it.qty || 1}x</strong> {it.name?.de || it.name}</span>
                            <span style={{ color: '#94A3B8' }}>{it.price}</span>
                          </div>
                        ))}
                      </div>

                      {/* Status changer buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleChangeOrderStatus(order.id, 'preparing')}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: order.status === 'preparing' ? '#F59E0B' : 'rgba(245, 158, 11, 0.15)',
                            color: order.status === 'preparing' ? '#000' : '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          🍳 In Küche
                        </button>
                        <button
                          onClick={() => handleChangeOrderStatus(order.id, 'served')}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: order.status === 'served' ? '#3B82F6' : 'rgba(59, 130, 246, 0.15)',
                            color: order.status === 'served' ? '#FFF' : '#60A5FA',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          🍽️ Serviert
                        </button>
                        <button
                          onClick={() => handleChangeOrderStatus(order.id, 'completed')}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: '#10B981',
                            color: '#FFF',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          ✅ Erledigt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

            {/* ── Sub-Section 2: Tisch-QR-Codes & Standorte ── */}
            {hostSubTab === 'tables' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>Tisch-QR-Codes</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>QR-Codes sofort am Handy vorzeigen oder downloaden</div>
                </div>

            {/* Table Number Selector Pills */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>
                Tischnummer auswählen:
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedTableNumber(num)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: selectedTableNumber === num ? '#7C3AED' : '#111622',
                      border: `1px solid ${selectedTableNumber === num ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: '#FFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    Tisch {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Interactive QR Display Card */}
            <div style={{
              background: '#111622',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 22,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>
                Tisch {selectedTableNumber}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, marginBottom: 16 }}>
                Gast kann diesen Code direkt vom Smartphone abfotografieren
              </div>

              {/* QR Image Box */}
              <div style={{
                background: '#FFF',
                padding: 14,
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                display: 'inline-block'
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(liveGuestMenuUrl)}&margin=10`}
                  alt="QR Code"
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              </div>

              <div style={{ fontSize: 11, color: '#64748B', marginTop: 12, wordBreak: 'break-all', maxWidth: 280 }}>
                {liveGuestMenuUrl}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 18, width: '100%', maxWidth: 320 }}>
                <button
                  onClick={() => {
                    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(liveGuestMenuUrl)}&format=png&margin=20`
                    window.open(downloadUrl, '_blank')
                  }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 12,
                    background: '#7C3AED',
                    color: '#FFF',
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Download size={14} /> Drucken / PNG
                </button>
                <button
                  onClick={() => {
                    copyToClipboard(liveGuestMenuUrl)
                    notify('📋 Tisch-Link kopiert!')
                  }}
                  style={{
                    padding: '11px 14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFF',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: SCENVY BOARD (DIGITAL SIGNAGE IM ANSATZ)
            ════════════════════════════════════════════════ */}
        {activeTab === 'board' && (
          <MobileBoardTab
            displays={displays}
            reels={reels}
            menuReels={menuReels}
            tenant={tenant}
            tenantId={tenantId}
            saveDisplay={saveDisplay}
            notify={notify}
          />
        )}

        {/* ════════════════════════════════════════════════
            TAB 5: EINSTELLUNGEN & PROFIL
            ════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>Partner-Profil & App</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Mandanten-Einstellungen & PWA</div>
            </div>

            {/* Install PWA Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.16) 0%, rgba(236, 72, 153, 0.12) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.4)',
              borderRadius: 18,
              padding: 18
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#FFF' }}>
                  📱
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>
                    {isStandalone ? 'App ist installiert' : 'Als App auf dem Startbildschirm'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#CBD5E1', marginTop: 2 }}>
                    {isStandalone ? 'Du nutzt die installierte PWA-Version.' : 'Direkter 1-Tap-Zugriff wie eine native iOS/Android App.'}
                  </div>
                </div>
              </div>

              {!isStandalone && (
                <button
                  onClick={handleTriggerPwaInstall}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: 12,
                    background: '#7C3AED',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Download size={15} /> Zum Startbildschirm hinzufügen
                </button>
              )}
            </div>

            {/* Switch to Desktop Web Dashboard */}
            <div style={{ background: '#111622', borderRadius: 18, border: '1px solid rgba(255, 255, 255, 0.08)', padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Monitor size={18} color="#7C3AED" />
                <span>Web- & Desktop-Ansicht</span>
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, lineHeight: 1.45 }}>
                Du kannst jederzeit zur vollwertigen Desktop-Dashboard-Oberfläche wechseln (z. B. für große Tabellen, Excel-Importe oder Multidisplay-Steuerung).
              </div>
              <button
                onClick={() => {
                  try { localStorage.setItem('scenvy_force_desktop', 'true') } catch (e) {}
                  nav('/dashboard')
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Monitor size={16} /> Zur Desktop-Webansicht wechseln (/dashboard)
              </button>
            </div>

            {/* Restaurant Info */}
            <div style={{ background: '#111622', borderRadius: 18, border: '1px solid rgba(255, 255, 255, 0.08)', padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>
                Mandanten-Informationen
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Restaurant / Betrieb:</span>
                  <span style={{ fontWeight: 800, color: '#FFF' }}>{tenant?.name || 'Gourmet Bistro'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Benutzer / E-Mail:</span>
                  <span style={{ fontWeight: 700, color: '#E2E8F0' }}>{user?.email || 'Partner'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Mandanten-ID:</span>
                  <span style={{ fontFamily: 'monospace', color: '#94A3B8' }}>{tenantId?.slice(0, 12)}...</span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => logout()}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              Abmelden
            </button>
          </div>
        )}
      </main>

      {/* ── Fixed Native Mobile Bottom Navigation Bar (ALL SCENVY APPS) ── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(13, 13, 20, 0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 4px calc(8px + env(safe-area-inset-bottom, 0px))'
      }}>
        {/* 1. Hub (Home) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: activeTab === 'home' ? '#A78BFA' : '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <Home size={19} color={activeTab === 'home' ? '#7C3AED' : '#64748B'} />
          <span style={{ fontSize: 10, fontWeight: activeTab === 'home' ? 800 : 600 }}>Hub</span>
        </button>

        {/* 2. SCENVY FLOW */}
        <button
          type="button"
          onClick={() => setActiveTab('flow')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: activeTab === 'flow' ? '#A78BFA' : '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '6px 0',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Film size={19} color={activeTab === 'flow' ? '#8B5CF6' : '#64748B'} />
            {reels.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -7,
                background: 'rgba(139, 92, 246, 0.85)',
                color: '#FFF',
                fontSize: 8.5,
                fontWeight: 900,
                padding: '1px 4px',
                borderRadius: 8,
                lineHeight: 1
              }}>
                {reels.length}
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: activeTab === 'flow' ? 800 : 600 }}>Flow</span>
        </button>

        {/* 3. SCENVY MENU */}
        <button
          type="button"
          onClick={() => setActiveTab('menu')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: (activeTab === 'menu' || activeTab === 'menus') ? '#A78BFA' : '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '6px 0',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Utensils size={19} color={(activeTab === 'menu' || activeTab === 'menus') ? '#F97316' : '#64748B'} />
            {menuReels.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -7,
                background: 'rgba(249, 115, 22, 0.85)',
                color: '#FFF',
                fontSize: 8.5,
                fontWeight: 900,
                padding: '1px 4px',
                borderRadius: 8,
                lineHeight: 1
              }}>
                {menuReels.length}
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: (activeTab === 'menu' || activeTab === 'menus') ? 800 : 600 }}>Menu</span>
        </button>

        {/* 4. SCENVY HOST */}
        <button
          type="button"
          onClick={() => setActiveTab('host')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: (activeTab === 'host' || activeTab === 'service' || activeTab === 'qrcodes') ? '#A78BFA' : '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '6px 0',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Bell size={19} color={(activeTab === 'host' || activeTab === 'service' || activeTab === 'qrcodes') ? '#10B981' : (totalUrgentCount > 0 ? '#EF4444' : '#64748B')} />
            {totalUrgentCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -7,
                background: '#EF4444',
                color: '#FFF',
                fontSize: 8.5,
                fontWeight: 900,
                padding: '1px 4px',
                borderRadius: 8,
                lineHeight: 1
              }}>
                {totalUrgentCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: (activeTab === 'host' || activeTab === 'service' || activeTab === 'qrcodes') ? 800 : 600 }}>Host</span>
        </button>

        {/* 5. SCENVY BOARD (im Ansatz) */}
        <button
          type="button"
          onClick={() => setActiveTab('board')}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            color: activeTab === 'board' ? '#A78BFA' : '#64748B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <Tv size={19} color={activeTab === 'board' ? '#3B82F6' : '#64748B'} />
          <span style={{ fontSize: 10, fontWeight: activeTab === 'board' ? 800 : 600 }}>Board</span>
        </button>
      </nav>

      {/* ── MODAL 1: AI SNAP CAMERA & UPLOAD MODAL ────── */}
      {showSnapModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            background: '#13131F',
            borderTop: '1px solid rgba(124, 58, 237, 0.4)',
            borderRadius: '24px 24px 0 0',
            width: '100%',
            maxWidth: 500,
            maxHeight: '92dvh',
            overflowY: 'auto',
            padding: '24px 20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF' }}>KI Menü SNAP</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Speisekarte mit Kamera erfassen</div>
                </div>
              </div>

              <button onClick={() => setShowSnapModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Hidden Camera & File Inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleSnapFileSelected}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,.webp,image/*"
              onChange={handleSnapFileSelected}
              style={{ display: 'none' }}
            />

            {/* File Capture / Preview Box */}
            {snapFilePreview ? (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '2px solid #7C3AED', background: '#000', maxHeight: 220 }}>
                {snapFileMime?.includes('pdf') ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#FFF' }}>
                    <div style={{ fontSize: 36 }}>📄</div>
                    <div style={{ fontWeight: 800, marginTop: 6 }}>{snapFileName}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>PDF Dokument bereit zur KI-Analyse</div>
                  </div>
                ) : (
                  <img src={snapFilePreview} alt="Preview" style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }} />
                )}

                <button
                  type="button"
                  onClick={() => { setSnapFilePreview(null); setSnapFileBase64(null) }}
                  style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Anderes Bild
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    padding: '20px 14px',
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(236, 72, 153, 0.2))',
                    border: '1.5px dashed #7C3AED',
                    color: '#FFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={30} color="#A78BFA" />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>Kamera öffnen</span>
                  <span style={{ fontSize: 10.5, color: '#94A3B8' }}>Karte direkt abknipsen</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '20px 14px',
                    borderRadius: 16,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1.5px dashed rgba(255, 255, 255, 0.18)',
                    color: '#FFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={30} color="#94A3B8" />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>PDF / Foto wählen</span>
                  <span style={{ fontSize: 10.5, color: '#94A3B8' }}>Aus Mediathek / Dateien</span>
                </button>
              </div>
            )}

            {/* WARENKORB-MODUS AUSWAHL (Vor KI-Start) */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Warenkorb & Bestellmodus für Gäste
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSnapCartEnabled(false)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: !snapCartEnabled ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1.5px solid ${!snapCartEnabled ? '#7C3AED' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: '#FFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800 }}>
                    <span>📖 Ohne Warenkorb</span>
                    {!snapCartEnabled && <Check size={14} color="#7C3AED" />}
                  </div>
                  <span style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.3 }}>Reine Speisekarte zum Betrachten</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapCartEnabled(true)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: snapCartEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1.5px solid ${snapCartEnabled ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: '#FFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800 }}>
                    <span>🛒 Mit Warenkorb</span>
                    {snapCartEnabled && <Check size={14} color="#10B981" />}
                  </div>
                  <span style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.3 }}>Gäste können bestellen</span>
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Primäre Menü-Sprache
              </label>
              <select
                value={snapLanguage}
                onChange={(e) => setSnapLanguage(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#09090E', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFF', fontSize: 13, outline: 'none' }}
              >
                <option value="en">🇬🇧 Englisch (Original)</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Französisch</option>
                <option value="it">🇮🇹 Italienisch</option>
                <option value="es">🇪🇸 Spanisch</option>
              </select>
            </div>

            {/* Error Message */}
            {snapError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#FCA5A5', fontSize: 12 }}>
                ⚠️ {snapError}
              </div>
            )}

            {/* Progress Bar during generation */}
            {isSnapping && (
              <div style={{ padding: 14, borderRadius: 12, background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#A78BFA', marginBottom: 6 }}>{snapProgressStep}</div>
                <div style={{ height: 4, background: '#09090E', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '80%', background: 'linear-gradient(90deg, #7C3AED, #EC4899)', borderRadius: 2, animation: 'pulse 1.2s infinite' }} />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={runAiSnapGeneration}
              disabled={isSnapping || !snapFileBase64}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: (!snapFileBase64 || isSnapping) ? '#475569' : 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                color: '#FFF',
                border: 'none',
                fontWeight: 900,
                fontSize: 14,
                cursor: (!snapFileBase64 || isSnapping) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: snapFileBase64 ? '0 6px 20px rgba(124, 58, 237, 0.5)' : 'none'
              }}
            >
              <Sparkles size={16} /> {isSnapping ? 'Analysiere...' : '🚀 Speisekarte jetzt per KI erstellen'}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 2: QUICK ARTICLE AVAILABILITY & SOLD-OUT TOGGLE ── */}
      {editingMenuForArticles && (() => {
        const menuData = editingMenuForArticles.data || editingMenuForArticles
        const categories = menuData.categories || []

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{
              background: '#13131F',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px 24px 0 0',
              width: '100%',
              maxWidth: 550,
              maxHeight: '92dvh',
              overflowY: 'auto',
              padding: '20px 18px 30px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF' }}>Artikel-Verfügbarkeit</div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{menuData.branding?.name || 'Speisekarte'}</div>
                </div>
                <button onClick={() => setEditingMenuForArticles(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', top: 12, left: 12, color: '#64748B' }} />
                <input
                  value={articleSearchQuery}
                  onChange={(e) => setArticleSearchQuery(e.target.value)}
                  placeholder="Gericht oder Getränk suchen..."
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, background: '#09090E', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#FFF', fontSize: 13, outline: 'none' }}
                />
              </div>

              {/* Notice */}
              <div style={{ fontSize: 11, color: '#94A3B8', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                💡 Tippe auf den Schalter, um ein Gericht sofort als <strong>Ausverkauft</strong> für Gäste zu sperren.
              </div>

              {/* Categories & Items Loop */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '60dvh', overflowY: 'auto' }}>
                {categories.map((cat) => {
                  const filteredItems = (cat.items || []).filter(it => {
                    if (!articleSearchQuery) return true
                    const name = typeof it.name === 'object' ? `${it.name.de || ''} ${it.name.en || ''}` : String(it.name || '')
                    return name.toLowerCase().includes(articleSearchQuery.toLowerCase())
                  })

                  if (filteredItems.length === 0) return null

                  return (
                    <div key={cat.id} style={{ background: '#09090E', borderRadius: 14, padding: 12, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#A78BFA', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{cat.icon || '🍽️'}</span>
                        <span>{typeof cat.name === 'object' ? (cat.name.de || cat.name.en) : cat.name}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredItems.map((it) => {
                          const itemName = typeof it.name === 'object' ? (it.name.de || it.name.en) : it.name
                          const isSoldOut = Boolean(it.isSoldOut)

                          return (
                            <div
                              key={it.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                padding: '8px 10px',
                                borderRadius: 10,
                                background: isSoldOut ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${isSoldOut ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: isSoldOut ? '#94A3B8' : '#FFF', textDecoration: isSoldOut ? 'line-through' : 'none' }}>
                                  {itemName}
                                </div>
                                <div style={{ fontSize: 11, color: isSoldOut ? '#EF4444' : '#F59E0B', fontWeight: 800, marginTop: 1 }}>
                                  {it.price} {isSoldOut && '• AUSVERKAUFT'}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleItemAvailability(it, cat.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  background: isSoldOut ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                  border: `1px solid ${isSoldOut ? '#EF4444' : '#10B981'}`,
                                  color: isSoldOut ? '#FCA5A5' : '#6EE7B7',
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {isSoldOut ? 'Ausverkauft' : '✓ Verfügbar'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => setEditingMenuForArticles(null)}
                style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#7C3AED', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginTop: 8 }}
              >
                Fertig & Schließen
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── MODAL 3: DELETE CONFIRMATION MODAL ────────── */}
      {menuToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#13131F', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: 20, width: '100%', maxWidth: 420, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#EF4444' }}>
              <Trash2 size={24} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>
              Speisekarte löschen?
            </div>
            <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.45, marginBottom: 20 }}>
              Möchtest du "{menuToDelete.branding?.name || menuToDelete.title || 'Speisekarte'}" wirklich entfernen?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setMenuToDelete(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.08)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleConfirmDeleteMenu(menuToDelete.id)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#EF4444', color: '#FFF', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: iOS PWA INSTALL GUIDE ────────────── */}
      {showIosInstallGuide && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#13131F', borderTop: '1px solid rgba(124, 58, 237, 0.4)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 500, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📲</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>
              SCENVY zum Home-Bildschirm hinzufügen
            </div>
            <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5, textAlign: 'left', background: '#09090E', borderRadius: 14, padding: 14, margin: '14px 0' }}>
              <div style={{ marginBottom: 8 }}>
                <strong>1.</strong> Tippe unten im Safari-Browser auf das <strong>Teilen-Symbol</strong> (Rechteck mit Pfeil nach oben).
              </div>
              <div>
                <strong>2.</strong> Scrolle etwas nach unten und wähle <strong>"Zum Home-Bildschirm"</strong>.
              </div>
            </div>
            <button
              onClick={() => setShowIosInstallGuide(false)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#7C3AED', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Notification ────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 74,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18, 18, 28, 0.96)',
          border: '1px solid rgba(124, 58, 237, 0.5)',
          color: '#FFF',
          padding: '10px 18px',
          borderRadius: 20,
          fontSize: 12.5,
          fontWeight: 700,
          zIndex: 99999,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
          maxWidth: '90vw'
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
